/**
 * Author: hustcer
 * Created: 2022/04/28 18:50:20
 */

import { globby } from 'globby';
import * as semver from 'semver';
import * as path from 'node:path';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import { Octokit, type RestEndpointMethodTypes } from '@octokit/rest';
import {
  EnvHttpProxyAgent,
  fetch as undiciFetch,
  type RequestInit as UndiciRequestInit,
  type Response as UndiciResponse,
} from 'undici';
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

const COMMIT_SHA_PATTERN = /^[0-9a-f]{7,40}$/i;

// The repos that publish Nushell binaries, they are also used as tool cache names.
const STABLE_REPO = 'nushell';
const NIGHTLY_REPO = 'nightly';

// Nushell binaries are always published on public GitHub, even when the workflow itself runs on
// GitHub Enterprise Server, so every API request goes to this host.
const PUBLIC_GITHUB_API = 'https://api.github.com';

/**
 * Tests whether a value is a full or abbreviated Git commit SHA.
 */
export function isCommitSha(value: string): boolean {
  return COMMIT_SHA_PATTERN.test(value);
}

/**
 * Tests whether two commit SHAs point to the same commit, the shorter one is compared as a
 * prefix so that abbreviated SHAs of any length match on both sides.
 */
function matchesSha(candidate: string, commitSha: string): boolean {
  const length = Math.min(candidate.length, commitSha.length);
  return candidate.slice(0, length).toLowerCase() === commitSha.slice(0, length).toLowerCase();
}

// Singleton to ensure efficient use of connection pooling, resources, etc.
const proxyAgent = new EnvHttpProxyAgent();

/**
 * @returns {string[]} possible nushell target specifiers for the current platform.
 */
function getTargets(features: 'default' | 'full'): string[] {
  const { arch, platform } = process;
  const selector = `${platform}_${arch}`;

  const platformMap = features === 'default' ? PLATFORM_DEFAULT_MAP : PLATFORM_FULL_MAP;
  const targets = platformMap[selector as Platform];
  if (!targets) {
    throw new Error(`Unsupported Nu target combination: arch = ${arch}, platform = ${platform}, feature = ${features}`);
  }
  return targets;
}

/**
 * @returns the first release asset matching one of the given target specifiers, if any.
 */
function findAsset(assets: ReleaseAsset[], targets: string[]): ReleaseAsset | undefined {
  return assets.find((asset) => targets.some((target) => asset.name.includes(target)));
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
  /** The tool cache name to store the release under, defaults to {@link Tool.name}. */
  name?: string;
}

/** A single release as returned by the GitHub API. */
type GitHubReleaseItem = RestEndpointMethodTypes['repos']['listReleases']['response']['data'][number];
/** A single release asset as returned by the GitHub API. */
type ReleaseAsset = GitHubReleaseItem['assets'][number];
/** A page of releases as handed to the `octokit.paginate` map function. */
type ReleasePage = { data: GitHubReleaseItem[] };

/**
 * Tests whether an unknown error has the specified HTTP status.
 */
function hasHttpStatus(error: unknown, status: number): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === status;
}

/**
 * Warns that the `full` feature no longer exists, it's a common cause of a missing release.
 */
function warnIfFullFeature(features: 'default' | 'full'): void {
  if (features === 'full') {
    core.warning('The "full" feature was removed for Nu after v0.93.1, try to use "default" feature instead.');
  }
}

/**
 * Filter the matching release for the given tool with the specified versionSpec.
 *
 * @param response the response to filter a release from with the given versionSpec.
 * @returns {Release[]} a single GitHub release.
 */
function filterMatch(response: ReleasePage, versionSpec: string | undefined, features: 'default' | 'full'): Release[] {
  const targets = getTargets(features);
  return (
    response.data
      .map((rel) => {
        const asset = findAsset(rel.assets, targets);
        return asset ? { version: rel.tag_name.replace(/^v/, ''), downloadUrl: asset.browser_download_url } : undefined;
      })
      // Releases without a matching asset have to be dropped here, otherwise they keep the
      // result non-empty and stop the pagination before older releases were ever fetched.
      .filter((rel): rel is Release => rel != null && (!versionSpec || semver.satisfies(rel.version, versionSpec)))
  );
}

/**
 * Filter the latest matching release for the given tool.
 *
 * @param response the response to filter a latest release from.
 * @returns {Release[]} a single GitHub release.
 */
function filterLatest(response: ReleasePage, features: 'default' | 'full'): Release[] {
  const targets = getTargets(features);
  // Only releases that carry an asset for the current platform may take part in the `latest`
  // election. Electing one without a usable asset yields `[undefined]`, which still counts as a
  // non-empty page, stops the pagination and then fails instead of falling back to an older
  // release. Tags that are no valid semver are dropped as well, `semver.rsort` throws on those.
  const candidates = response.data.filter((rel) => semver.valid(rel.tag_name) && findAsset(rel.assets, targets));
  if (candidates.length === 0) {
    return [];
  }

  const latest = semver.rsort(candidates.map((rel) => rel.tag_name))[0];
  const release = candidates.find((rel) => rel.tag_name === latest) as GitHubReleaseItem;
  const asset = findAsset(release.assets, targets) as ReleaseAsset;
  return [{ version: release.tag_name.replace(/^v/, ''), downloadUrl: asset.browser_download_url }];
}

/**
 * Filter the latest matching release for the given tool.
 *
 * @param response the response to filter a latest release from.
 * @returns {Release[]} a single GitHub release.
 */
function filterLatestNightly(response: ReleasePage, features: 'default' | 'full'): Release[] {
  const targets = getTargets(features);
  // Same reasoning as in `filterLatest`: a nightly release is created before its assets finish
  // uploading, so the newest one regularly has no asset for some platform yet. Skip those and
  // take the newest nightly that is actually installable.
  const candidates = response.data.filter((rel) => findAsset(rel.assets, targets));
  if (candidates.length === 0) {
    return [];
  }

  // `published_at` is nullable in the API types, a draft release without one sorts to the epoch.
  const publishedAt = (rel: GitHubReleaseItem) => new Date(rel.published_at ?? 0).getTime();
  const latest = candidates.reduce((newest, rel) => (publishedAt(rel) > publishedAt(newest) ? rel : newest));
  core.info(`Try to get latest nightly version published at: ${latest.published_at}`);

  const asset = findAsset(latest.assets, targets) as ReleaseAsset;
  return [{ version: latest.tag_name.replace(/^v/, ''), downloadUrl: asset.browser_download_url }];
}

/**
 * Filters a nightly release by its Nushell commit SHA.
 *
 * @param response The response that contains the releases.
 * @param commitSha The full or abbreviated commit SHA to match.
 * @returns A matching GitHub release, if one exists.
 */
function filterNightlyByCommit(response: ReleasePage, commitSha: string, features: 'default' | 'full'): Release[] {
  const targets = getTargets(features);
  const release = response.data.find((candidate) => {
    const releaseCommitSha = candidate.tag_name.match(/(?:\+|nightly-)([0-9a-f]{7,40})$/i)?.[1];
    if (releaseCommitSha === undefined || !matchesSha(releaseCommitSha, commitSha)) {
      return false;
    }
    return findAsset(candidate.assets, targets) !== undefined;
  });

  if (!release) {
    return [];
  }

  const asset = findAsset(release.assets, targets);
  return asset
    ? [
        {
          version: release.tag_name.replace(/^v/, ''),
          downloadUrl: asset.browser_download_url,
          name: NIGHTLY_REPO,
        },
      ]
    : [];
}

/**
 * Verifies that the token is accepted by public GitHub and drops it when it is not.
 *
 * On GitHub Enterprise Server the default `github.token` belongs to the GHES instance, github.com
 * answers 401 for it and every release query would fail. Falling back to an unauthenticated request
 * keeps the action working there, the same applies to an expired or revoked PAT. The `/rate_limit`
 * probe does not count against the rate limit itself.
 */
async function resolveToken(githubToken: string | undefined): Promise<string | undefined> {
  if (!githubToken) {
    return undefined;
  }

  const probe = new Octokit({ auth: githubToken, baseUrl: PUBLIC_GITHUB_API, request: { fetch: proxyFetch } });
  try {
    await probe.rateLimit.get();
    return githubToken;
  } catch (error) {
    if (hasHttpStatus(error, 401)) {
      core.warning(
        'The provided GitHub token was rejected by github.com and is ignored, continuing without ' +
          'authentication. On GitHub Enterprise Server the default `github.token` is only valid for ' +
          'your own instance, pass a public GitHub PAT via the `github-token` input to avoid the ' +
          'much lower anonymous rate limit.'
      );
      return undefined;
    }
    // Anything else (a network hiccup, a 403 while rate limited, ...) is no verdict on the token.
    // Keep it and let the actual release request surface the problem, a failing probe must never
    // be the reason the whole action fails.
    core.debug(`Could not verify the GitHub token, using it anyway: ${error}`);
    return githubToken;
  }
}

/**
 * Tests whether a commit SHA exists in the given repo.
 *
 * Checking this up front keeps a typo from paging through the entire tag list of the repository,
 * which costs one API request per 100 tags and finds nothing.
 */
async function commitExists(octokit: Octokit, owner: string, commitSha: string): Promise<boolean> {
  try {
    await octokit.request('HEAD /repos/{owner}/{repo}/commits/{ref}', {
      owner,
      repo: STABLE_REPO,
      ref: commitSha,
    });
    return true;
  } catch (error) {
    // 404 for an unknown commit, 422 for a SHA that cannot be resolved at all.
    if (hasHttpStatus(error, 404) || hasHttpStatus(error, 422)) {
      return false;
    }
    throw error;
  }
}

/**
 * Finds a stable release whose tag points to the specified commit SHA.
 */
async function getStableReleaseByCommit(
  octokit: Octokit,
  owner: string,
  commitSha: string,
  features: 'default' | 'full'
): Promise<Release | undefined> {
  // No early `done()` here: the tags of a single commit can land on different pages. `a80dfe8` is
  // tagged both `v0.96.0` (first entry of page 1) and `0.96.0`, and only the latter has a release,
  // so stopping on the first matching page would drop the tag that actually resolves.
  const tags = await octokit.paginate(octokit.repos.listTags, { owner, per_page: 100, repo: STABLE_REPO }, (response) =>
    response.data.filter((tag) => matchesSha(tag.commit.sha, commitSha))
  );

  const targets = getTargets(features);
  // A commit may carry more than one tag, e.g. `a80dfe8` is tagged both `v0.96.0` and `0.96.0`
  // while only the latter has a release, so every matching tag has to be tried.
  for (const tag of tags) {
    try {
      const response = await octokit.repos.getReleaseByTag({ owner, repo: STABLE_REPO, tag: tag.name });
      const asset = findAsset(response.data.assets, targets);
      if (asset) {
        return {
          version: response.data.tag_name.replace(/^v/, ''),
          downloadUrl: asset.browser_download_url,
        };
      }
    } catch (error) {
      if (!hasHttpStatus(error, 404)) {
        throw error;
      }
    }
  }
  return undefined;
}

/**
 * Finds a nightly release whose tag contains the specified commit SHA.
 */
async function getNightlyReleaseByCommit(
  octokit: Octokit,
  owner: string,
  commitSha: string,
  features: 'default' | 'full'
): Promise<Release | undefined> {
  const releases = await octokit.paginate(
    octokit.repos.listReleases,
    { owner, per_page: 100, repo: NIGHTLY_REPO },
    (response, done) => {
      const matches = filterNightlyByCommit(response, commitSha, features);
      if (matches.length > 0) {
        done();
      }
      return matches;
    }
  );
  return releases[0];
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
  const commitSha = versionSpec && isCommitSha(versionSpec) ? versionSpec : undefined;

  // Logged once here instead of inside `getTargets`, which runs for every page of every query.
  core.info(`Try to get assets for Nu: arch = ${process.arch}, platform = ${process.platform}, feature = ${features}`);

  const octokit = new Octokit({
    auth: await resolveToken(tool.githubToken),
    // Use public GitHub API for Nushell assets query, make it work for GitHub Enterprise
    baseUrl: PUBLIC_GITHUB_API,
    request: { fetch: proxyFetch },
  });

  if (commitSha) {
    if (checkLatest) {
      core.warning('The "check-latest" input is ignored when the version is a commit SHA.');
    }
    if (!(await commitExists(octokit, owner, commitSha))) {
      // A digit-only input is a valid abbreviated SHA, but it is far more likely to be a version
      // that lost its dots, so point that out instead of only reporting the missing commit.
      const hint = /^\d+$/.test(commitSha)
        ? ' It consists of digits only, if you meant a version use the full form such as "0.112.2".'
        : '';
      throw new Error(`Commit SHA ${commitSha} does not exist in ${owner}/${STABLE_REPO}.${hint}`);
    }
    const stableRelease = await getStableReleaseByCommit(octokit, owner, commitSha, features);
    const release = stableRelease ?? (await getNightlyReleaseByCommit(octokit, owner, commitSha, features));
    if (!release) {
      warnIfFullFeature(features);
      throw new Error(`No published Nushell release found for commit SHA ${commitSha} with ${features} features.`);
    }
    return release;
  }

  return octokit
    .paginate(octokit.repos.listReleases, { owner, per_page: 100, repo: name }, (response, done) => {
      // Evaluated lazily, running the unused filter over every page is pure waste.
      const releases = isNightly
        ? filterLatestNightly(response, features)
        : checkLatest
          ? filterLatest(response, features)
          : filterMatch(response, versionSpec, features);

      if (releases.length > 0) {
        done();
      }
      return releases;
    })
    .then((releases) => {
      const release = releases.find((release) => release != null);
      if (release === undefined) {
        warnIfFullFeature(features);
        throw new Error(`No release for Nushell matching version specifier ${versionSpec} of ${features} feature.`);
      }
      return release;
    });
}

function proxyFetch(url: string | URL, opts?: UndiciRequestInit): Promise<UndiciResponse> {
  return undiciFetch(url, {
    ...opts,
    dispatcher: proxyAgent,
  });
}

async function handleBadBinaryPermissions(tool: Tool, dir: string): Promise<void> {
  const { name, bin } = tool;
  if (process.platform === 'win32') {
    return;
  }

  const files = await fs.readdir(dir);
  const mainBinary = bin ?? files.find((file) => file.toLowerCase() === name.toLowerCase());
  // The plugin binaries need the executable bit just as much as `nu` itself, `plugin add` fails
  // with a permission error otherwise.
  const binaries = new Set([
    ...(mainBinary && files.includes(mainBinary) ? [mainBinary] : []),
    ...files.filter((file) => file.startsWith('nu_plugin_')),
  ]);

  for (const binary of binaries) {
    const binaryPath = path.join(dir, binary);
    try {
      await fs.access(binaryPath, fs_constants.X_OK);
    } catch {
      await fs.chmod(binaryPath, '755');
      core.debug(`Fixed file permissions (-> 0o755) for ${binaryPath}`);
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
  const { name, versionSpec, checkLatest = false } = tool;

  // first check if we have previously downloaded the tool, `check-latest` has to skip this lookup:
  // a cached version always satisfies the `*` spec, so it would shadow the newest release and make
  // the option a no-op on runners that already carry a Nu in their tool cache.
  let dir = checkLatest ? '' : tc.find(name, versionSpec || '*');
  // a release resolved by commit SHA may come from the nightly repo, cache it under that name
  let cacheName = name;

  if (!dir) {
    // find the latest release by querying GitHub API
    const release = await getRelease(tool);
    const { version, downloadUrl } = release;
    cacheName = release.name ?? name;
    dir = tc.find(cacheName, version);

    if (dir) {
      return { ...tool, name: cacheName, version: path.basename(path.dirname(dir)), dir };
    }

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
        path.join(extractDir, '**', 'nu_plugin_*').replace(/\\/g, '/'),
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
    dir = await tc.cacheDir(cacheSource, cacheName, version);

    // handle bad binary permissions, the binary needs to be executable!
    await handleBadBinaryPermissions(tool, dir);
  }

  // is there a better way to get the version?
  const version = path.basename(path.dirname(dir));

  return { ...tool, name: cacheName, version, dir };
}
