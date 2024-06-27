/**
 * Author: hustcer
 * Created: 2022/04/28 18:50:20
 */

import shell from 'shelljs';
import semver from 'semver';
import * as core from '@actions/core';

import * as setup from './setup';
import { registerPlugins } from './plugins';

async function main() {
  try {
    const versionSpec = core.getInput('version');
    console.log(`versionSpec: ${versionSpec}`);
    const checkLatest = (core.getInput('check-latest') || 'false').toUpperCase() === 'TRUE';
    const enablePlugins = (core.getInput('enable-plugins') || 'false').toLowerCase();
    const features = core.getInput('features') || 'default';
    const githubToken = core.getInput('github-token');
    const version = ['*', 'nightly'].includes(versionSpec) ? versionSpec : semver.valid(semver.coerce(versionSpec));
    console.log(`coerce version: ${version}`);
    const ver = version === null ? undefined : version;
    if (!ver) {
      core.setFailed(`Invalid version: ${versionSpec}`);
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

    // Change to workspace directory so that the register-plugins.nu script can be found.
    shell.cd(process.env.GITHUB_WORKSPACE);
    console.log(`Current directory: ${process.cwd()}`);
    registerPlugins(enablePlugins, tool.version);
  } catch (err) {
    core.setFailed(err.message);
  }
}

main();
