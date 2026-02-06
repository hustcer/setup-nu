/**
 * Author: hustcer
 * Created: 2022/04/28 18:50:20
 */

import shell from 'shelljs';
import semver from 'semver';
import * as core from '@actions/core';

import * as setup from './setup.js';
import { registerPlugins } from './plugins.js';

async function main() {
  try {
    const versionSpec = core.getInput('version');
    console.log(`versionSpec: ${versionSpec}`);
    const checkLatest = (core.getInput('check-latest') || 'false').toUpperCase() === 'TRUE';
    const enablePlugins = (core.getInput('enable-plugins') || 'false').toLowerCase();
    const rawFeatures = (core.getInput('features') || 'default').toLowerCase();
    if (rawFeatures !== 'default' && rawFeatures !== 'full') {
      throw new Error(`Invalid features input: ${rawFeatures}`);
    }
    const features = rawFeatures as 'default' | 'full';
    const githubToken = core.getInput('github-token');
    const version = ['*', 'nightly'].includes(versionSpec) ? versionSpec : semver.valid(semver.coerce(versionSpec));
    console.log(`coerce version: ${version}`);
    const ver = version === null ? undefined : version;
    if (!ver) {
      throw new Error(`Invalid version input: ${versionSpec}`);
    }

    const tool = await setup.checkOrInstallTool({
      checkLatest,
      githubToken,
      enablePlugins,
      bin: 'nu',
      owner: 'nushell',
      versionSpec: ver,
      features: features as 'default' | 'full',
      name: version === 'nightly' ? 'nightly' : 'nushell',
    });
    core.addPath(tool.dir);
    // version: * --> 0.95.0; nightly --> nightly-56ed69a; 0.95 --> 0.95.0
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
