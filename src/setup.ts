/**
 * Author: hustcer
 * Created: 2022/04/28 18:50:20
 */

import { globby } from 'globby';
import * as semver from 'semver';
import * as path from 'node:path';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import { Octokit } from '@octokit/rest';
import { EnvHttpProxyAgent, fetch as undiciFetch } from 'undici';
import { promises as fs, constants as fs_constants } from 'node:fs';

// REF: https://nodejs.org/api/process.html#processarch
type Platform =
  | 'darwin_x64'
  | 'darwin_arm64'
  | 'win32_x64'
  | 'win32_arm64'
  | 'linux_x64'
  | 'linux_arm64'
  | 'linux_loong64'
  | 'linux_riscv64';

const PLATFORM_DEFAULT_MAP: Record<Platform, string[]> = {
  darwin_x64: ['x86_64-apple-darwin', 'macOS.zip'],
  darwin_arm64: ['aarch64-apple-darwin', 'macOS.zip'],
  win32_x64: ['x86_64-pc-windows-msvc.zip', 'windows.zip'],
  win32_arm64: ['aarch64-pc-windows-msvc.zip'],
  linux_riscv64: ['riscv64gc-unknown-linux-gnu'],
  linux_loong64: ['loongarch64-unknown-linux-gnu'],
  linux_arm64: ['aarch64-unknown-linux-musl', 'aarch64-unknown-linux-gnu'],
  linux_x64: ['x86_64-unknown-linux-musl', 'x86_64-unknown-linux-gnu', 'linux.tar.gz'],
};

const PLATFORM_FULL_MAP: Record<Platform, string[]> = {
  darwin_x64: ['x86_64-darwin-full'],
  darwin_arm64: ['aarch64-darwin-full'],
  win32_x64: ['x86_64-windows-msvc-full.zip'],
  win32_arm64: ['aarch64-windows-msvc-full.zip'],
  linux_arm64: ['aarch64-linux-gnu-full'],
  linux_riscv64: ['riscv64gc-unknown-linux-gnu-full'],
  linux_loong64: ['loongarch64-unknown-linux-gnu-full'],
  linux_x64: ['x86_64-linux-musl-full', 'x86_64-linux-gnu-full'],
};

/**
 * @returns {string[]} possible nushell target specifiers for the current platform.
 */
function getTargets(features: 'default' | 'full'): string[] {
  const { arch, platform } = process;
  const selector = `${platform}_${arch}`;

  core.info(`Try to get assets for Nu: arch = ${arch}, platform = ${platform}, feature = ${features}`);
  const platformMap = features === 'default' ? PLATFORM_DEFAULT_MAP : PLATFORM_FULL_MAP;
  const targets = platformMap[selector as Platform];
  if (!targets) {
    throw new Error(`Unsupported Nu target combination: arch = ${arch}, platform = ${platform}, feature = ${features}`);
  }
  return targets;
}

/**
 * Represents a tool to install from GitHub.
 */
export interface Tool {
  /** The GitHub owner (username or organization). */
  owner: string;
  /** The GitHub repo name. */
  name: string;
  /** The GitHub token to use for API requests. */
  githubToken: string;
  /** Set this option to `true` if you want to check for the latest version. */
  checkLatest: boolean;
  /** Set this option to `true` if you want to register plugins. */
  enablePlugins: string;
  /** A valid semantic version specifier for the tool. */
  versionSpec?: string;
  /** Feature set: default or full. */
  features: 'default' | 'full';
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
 * @returns {Release[]} a single GitHub release.
 */
// biome-ignore lint: Ignore
function filterMatch(response: any, versionSpec: string | undefined, features: 'default' | 'full'): Release[] {
  const targets = getTargets(features);
  return (
    response.data
      // biome-ignore lint: Ignore
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
      )
  );
}

/**
 * Filter the latest matching release for the given tool.
 *
 * @param response the response to filter a latest release from.
 * @returns {Release[]} a single GitHub release.
 */
// biome-ignore lint: Ignore
function filterLatest(response: any, features: 'default' | 'full'): Release[] {
  const targets = getTargets(features);
  const versions = response.data.map((r: { tag_name: string }) => r.tag_name);
  const latest = semver.rsort(versions)[0];
  return (
    response.data
      .filter((rel: { tag_name: string | semver.SemVer | undefined }) => rel && rel.tag_name === latest)
      // biome-ignore lint: Ignore
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
  );
}

/**
 * Filter the latest matching release for the given tool.
 *
 * @param response the response to filter a latest release from.
 * @returns {Release[]} a single GitHub release.
 */
// biome-ignore lint: Ignore
function filterLatestNightly(response: any, features: 'default' | 'full'): Release[] {
  const targets = getTargets(features);
  const publishedAt = response.data.map((r: { published_at: string }) => r.published_at);
  const sortedDates = publishedAt.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
  const latest = sortedDates[0];
  core.info(`Try to get latest nightly version published at: ${latest}`);

  return (
    response.data
      .filter((rel: { published_at: string | Date }) => rel && rel.published_at === latest)
      // biome-ignore lint: Ignore
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
  );
}

/**
 * Fetch the latest matching release for the given tool.
 *
 * @param tool the tool to fetch a release for.
 *
 * @returns {Promise<Release>} a single GitHub release.
 */
async function getRelease(tool: Tool): Promise<Release> {
  const { owner, name, versionSpec, checkLatest = false, features = 'default' } = tool;
  const isNightly = versionSpec === 'nightly';

  const proxyFetch = (url: string, opts: any) => {
    return undiciFetch(url, {
      ...opts,
      dispatcher: new EnvHttpProxyAgent({
        keepAliveTimeout: 10,
        keepAliveMaxTimeout: 10,
      }),
    });
  };

  const octokit = new Octokit({
    auth: tool.githubToken,
    // Use public GitHub API for Nushell assets query, make it work for GitHub Enterprise
    baseUrl: 'https://api.github.com',
    request: { fetch: proxyFetch },
  });

  return octokit
    .paginate(octokit.repos.listReleases, { owner, repo: name }, (response, done) => {
      const nightlyReleases = isNightly ? filterLatestNightly(response, features) : [];
      const officialReleases = checkLatest
        ? filterLatest(response, features)
        : filterMatch(response, versionSpec, features);
      const releases = isNightly ? nightlyReleases : officialReleases;

      if (releases) {
        done();
      }
      return releases;
    })
    .then((releases) => {
      const release = releases.find((release) => release != null);
      if (release === undefined) {
        if (features === 'full') {
          core.warning('The "full" feature was removed for Nu after v0.93.1, try to use "default" feature instead.');
        }
        throw new Error(`No release for Nushell matching version specifier ${versionSpec} of ${features} feature.`);
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
        if (file.toLowerCase() === name.toLowerCase()) {
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

    let extractDir: string;
    if (downloadUrl.endsWith('.zip')) {
      extractDir = await tc.extractZip(artifact);
    } else {
      extractDir = await tc.extractTar(artifact);
    }
    core.debug(`Successfully extracted archive for ${name} v${version}`);

    const paths = await globby(
      [
        `${extractDir}/**/nu_plugin_*`,
        // For nu v0.61~0.63 on Windows OS
        path
          .join(extractDir, '**', 'nu_plugin_*')
          .replace(/\\/g, '/'),
      ],
      {
        unique: true,
        absolute: true,
      }
    );
    const cacheSource = paths.length > 0 ? path.dirname(paths[0]) : extractDir;
    if (paths.length === 0) {
      core.warning('No nu_plugin_* binaries found; caching extracted directory instead.');
    }
    dir = await tc.cacheDir(cacheSource, name, version);

    // handle bad binary permissions, the binary needs to be executable!
    await handleBadBinaryPermissions(tool, dir);
  }

  // is there a better way to get the version?
  const version = path.basename(path.dirname(dir));

  return { version, dir, ...tool };
}
