/**
 * Author: hustcer
 * Created: 2022/04/28 18:50:20
 */

import shell from 'shelljs';
import semver from 'semver';
import * as core from '@actions/core';

import * as setup from './setup';

async function main() {
  try {
    const versionSpec = core.getInput('version');
    console.log(`versionSpec: ${versionSpec}`);
    const checkLatest = (core.getInput('check-latest') || 'false').toUpperCase() === 'TRUE';
    const enablePlugins = (core.getInput('enable-plugins') || 'false').toUpperCase() === 'TRUE';
    const version = ['*', 'nightly'].includes(versionSpec) ? versionSpec : semver.valid(semver.coerce(versionSpec));
    console.log(`coerce version: ${version}`);
    const ver = version === null ? undefined : version;
    if (!ver) {
      core.setFailed(`Invalid version: ${versionSpec}`);
    }

    const tool = await setup.checkOrInstallTool({
      checkLatest,
      enablePlugins,
      bin: 'nu',
      owner: 'nushell',
      versionSpec: ver,
      name: version === 'nightly' ? 'nightly' : 'nushell',
    });
    core.addPath(tool.dir);
    core.info(`Successfully setup Nu ${tool.version}`);

    if (enablePlugins) {
      console.log('Running ./nu/register-plugins.nu to register plugins...');
      shell.exec(`nu ./nu/register-plugins.nu ${tool.version}`);
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

main();
