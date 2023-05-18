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
    const version = versionSpec === '*' ? '*' : semver.valid(semver.coerce(versionSpec));
    console.log(`coerce version: ${version}`);
    const ver = version === null ? undefined : version;

    const tool = await setup.checkOrInstallTool({
      checkLatest,
      enablePlugins,
      bin: 'nu',
      name: 'nushell',
      owner: 'nushell',
      versionSpec: ver,
    });
    core.addPath(tool.dir);
    core.info(`Successfully setup ${tool.name} v${tool.version}`);

    if (enablePlugins) {
      console.log('Running ./nu/register-plugins.nu to register plugins...');
      shell.exec('nu ./nu/register-plugins.nu');
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

main();
