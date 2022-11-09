/**
 * Author: hustcer
 * Created: 2022/04/28 18:50:20
 */

import * as path from 'path';
import { globby } from 'globby';
import * as semver from 'semver';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import { Octokit } from '@octokit/rest';
import { promises as fs, constants as fs_constants } from 'fs';

/**
 * @returns {string[]} possible nushell target specifiers for the current platform.
 */
function getTargets(): string[] {
  const { arch, platform } = process;
  if (arch == 'x64') {
    if (platform == 'linux') {
      return ['x86_64-unknown-linux-musl', 'x86_64-unknown-linux-gnu', 'linux.tar.gz'];
    } else if (platform == 'darwin') {
      return ['x86_64-apple-darwin', 'macOS.zip'];
    } else if (platform == 'win32') {
      return ['x86_64-pc-windows-msvc.zip', 'windows.zip'];
    }
  }
  throw new Error(`failed to determine any valid targets; arch = ${arch}, platform = ${platform}`);
}

/**
 * Represents a tool to install from GitHub.
 */
export interface Tool {
  /** The GitHub owner (username or organization). */
  owner: string;
  /** The GitHub repo name. */
  name: string;
  /** Set this option to `true` if you want to check for the latest version. */
  checkLatest: boolean;
  /** A valid semantic version specifier for the tool. */
  versionSpec?: string;
  /** The name of the tool binary (defaults to the repo name) */
  bin?: string;
}

/**
 * Represents an installed tool.
 */
export interface InstalledTool {
  /** The GitHub owner (username or organization). */
  owner: string;
  /** The GitHub repo name. */
  name: string;
  /** The version of the tool. */
  version: string;
  /** The directory containing the tool binary. */
  dir: string;
  /** The name of the tool binary (defaults to the repo name) */
  bin?: string;
}

/**
 * Represents a single release for a {@link Tool}.
 */
interface Release {
  /** The exact release tag. */
  version: string;
  /** The asset download URL. */
  downloadUrl: string;
}

/**
 * Filter the matching release for the given tool with the specified versionSpec.
 *
 * @param response the response to filter a release from with the given versionSpec.
 *
 * @returns {Release[]} a single GitHub release.
 */
function filterMatch(response: any, versionSpec: string | undefined): Release[] {
  const targets = getTargets();
  return response.data
    .map((rel: { assets: any[]; tag_name: string }) => {
      const asset = rel.assets.find((ass: { name: string | string[] }) =>
        targets.some((target) => ass.name.includes(target))
      );
      if (asset) {
        return {
          version: rel.tag_name.replace(/^v/, ''),
          downloadUrl: asset.browser_download_url,
        };
      }
    })
    .filter((rel: { version: string | semver.SemVer }) =>
      rel && versionSpec ? semver.satisfies(rel.version, versionSpec) : true
    );
}

/**
 * Filter the latest matching release for the given tool.
 *
 * @param response the response to filter a latest release from.
 *
 * @returns {Release[]} a single GitHub release.
 */
function filterLatest(response: any): Release[] {
  const targets = getTargets();
  const versions = response.data.map((r: { tag_name: string }) => r.tag_name);
  const latest = semver.rsort(versions)[0];
  return response.data
    .filter((rel: { tag_name: string | semver.SemVer | undefined }) => rel && rel.tag_name === latest)
    .map((rel: { assets: any[]; tag_name: string }) => {
      const asset = rel.assets.find((ass: { name: string | string[] }) =>
        targets.some((target) => ass.name.includes(target))
      );
      if (rel.assets) {
        return {
          version: rel.tag_name.replace(/^v/, ''),
          downloadUrl: asset.browser_download_url,
        };
      }
    });
}

/**
 * Fetch the latest matching release for the given tool.
 *
 * @param tool the tool to fetch a release for.
 *
 * @returns {Promise<Release>} a single GitHub release.
 */
async function getRelease(tool: Tool): Promise<Release> {
  const { owner, name, versionSpec, checkLatest = false } = tool;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  return octokit
    .paginate(octokit.repos.listReleases, { owner, repo: name }, (response, done) => {
      const releases = checkLatest ? filterLatest(response) : filterMatch(response, versionSpec);

      if (releases) {
        done();
      }
      return releases;
    })
    .then((releases) => {
      const release = releases.find((release) => release != null);
      if (release === undefined) {
        throw new Error(`no release for ${name} matching version specifier ${versionSpec}`);
      }
      return release;
    });
}

async function handleBadBinaryPermissions(tool: Tool, dir: string): Promise<void> {
  const { name, bin } = tool;
  if (process.platform !== 'win32') {
    const findBin = async () => {
      const files = await fs.readdir(dir);
      for await (const file of files) {
        if (file.toLowerCase() == name.toLowerCase()) {
          return file;
        }
      }
      return name;
    };
    const binary = path.join(dir, bin ? bin : await findBin());
    try {
      await fs.access(binary, fs_constants.X_OK);
    } catch {
      await fs.chmod(binary, '755');
      core.debug(`Fixed file permissions (-> 0o755) for ${binary}`);
    }
  }
}

/**
 * Checks the tool cache for the tool, and if it is missing
 * fetches it from GitHub releases.
 *
 * @param tool the tool to check or install.
 *
 * @returns the directory containing the tool binary.
 */
export async function checkOrInstallTool(tool: Tool): Promise<InstalledTool> {
  const { name, versionSpec } = tool;

  // first check if we have previously downloaded the tool
  let dir = tc.find(name, versionSpec || '*');

  if (!dir) {
    // find the latest release by querying GitHub API
    const { version, downloadUrl } = await getRelease(tool);

    // download, extract, and cache the tool
    const artifact = await tc.downloadTool(downloadUrl);
    core.debug(`Successfully downloaded ${name} v${version}`);

    let extractDir;
    if (downloadUrl.endsWith('.zip')) {
      extractDir = await tc.extractZip(artifact);
    } else {
      extractDir = await tc.extractTar(artifact);
    }
    core.debug(`Successfully extracted archive for ${name} v${version}`);

    const paths = await globby(
      [
        `${extractDir}/nu_plugin_*`,
        `${extractDir}/**/nu_plugin_*`,
        // For nu v0.61~0.63 on Windows OS
        path.join(extractDir, '**', 'nu_plugin_*').replace(/\\/g, '/'),
      ],
      {
        unique: true,
        absolute: true,
      }
    );
    dir = await tc.cacheDir(path.dirname(paths[0]), name, version);

    // handle bad binary permissions, the binary needs to be executable!
    await handleBadBinaryPermissions(tool, dir);
  }

  // is there a better way to get the version?
  const version = path.basename(path.dirname(dir));

  return { version, dir, ...tool };
}
