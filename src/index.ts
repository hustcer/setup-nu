/**
 * Author: hustcer
 * Created: 2022/04/28 18:50:20
 */

import shell from 'shelljs';
import semver from 'semver';
import * as core from '@actions/core';

import * as setup from './setup.js';
import { registerPlugins } from './plugins.js';

/**
 * Resolves the `version` input to something `semver.satisfies` understands.
 *
 * Valid ranges are kept as they are, so `^0.98`, `>=0.95 <0.100` and `0.90` all keep their range
 * semantics. Coercing them would collapse `0.90` to the exact `0.90.0` and skip `0.90.1`. Anything
 * that is no valid range still gets coerced, e.g. `v0.98-x64` becomes `0.98.0`.
 */
function resolveVersionSpec(versionSpec: string): string | null {
  if (['*', 'nightly'].includes(versionSpec)) {
    return versionSpec;
  }
  return semver.validRange(versionSpec) ? versionSpec : semver.valid(semver.coerce(versionSpec));
}

async function main() {
  try {
    const versionSpec = core.getInput('version') || '*';
    console.log(`versionSpec: ${versionSpec}`);
    const checkLatest = (core.getInput('check-latest') || 'false').toUpperCase() === 'TRUE';
    const enablePlugins = (core.getInput('enable-plugins') || 'false').toLowerCase();
    const rawFeatures = (core.getInput('features') || 'default').toLowerCase();
    if (rawFeatures !== 'default' && rawFeatures !== 'full') {
      throw new Error(`Invalid features input: ${rawFeatures}`);
    }
    const features = rawFeatures as 'default' | 'full';
    const githubToken = core.getInput('github-token');
    const commitSha = setup.isCommitSha(versionSpec) ? versionSpec.toLowerCase() : undefined;
    const version: string | null = commitSha ?? resolveVersionSpec(versionSpec);
    console.log(`resolved version: ${version}`);
    if (version === null) {
      throw new Error(`Invalid version input: ${versionSpec}`);
    }

    const tool = await setup.checkOrInstallTool({
      checkLatest,
      githubToken,
      enablePlugins,
      bin: 'nu',
      owner: 'nushell',
      versionSpec: version,
      features: features as 'default' | 'full',
      name: version === 'nightly' ? 'nightly' : 'nushell',
    });
    core.addPath(tool.dir);
    // version: * --> 0.114.1; nightly --> 0.114.2-nightly.33; 0.90 --> 0.90.1; ^0.113 --> 0.113.1
    core.info(`Successfully setup Nu ${tool.version}, with ${features} features.`);

    // Change to workspace directory (fallback to current dir for local runs).
    const workspaceDir = process.env.GITHUB_WORKSPACE || process.cwd();
    shell.cd(workspaceDir);
    console.log(`Current directory: ${process.cwd()}`);
    await registerPlugins(enablePlugins, tool.version);
  } catch (err) {
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
}

main();
