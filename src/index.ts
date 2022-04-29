/**
 * Author: hustcer
 * Created: 2022/04/28 18:50:20
 */

import * as core from '@actions/core';

import * as setup from './setup';

async function main() {
  try {
    const versionSpec = core.getInput('version');
    const checkLatest = (core.getInput('check-latest') || 'false').toUpperCase() === 'TRUE';
    const tool = await setup.checkOrInstallTool({
      versionSpec,
      checkLatest,
      bin: 'nu',
      name: 'nushell',
      owner: 'nushell',
    });
    core.addPath(tool.dir);
    core.info(`Successfully setup ${tool.name} v${tool.version}`);
  } catch (err) {
    core.setFailed(err.message);
  }
}

main();
