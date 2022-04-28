import * as core from '@actions/core';

import * as setup from './setup';

async function main() {
  try {
    const versionSpec = core.getInput('version');
    const tool = await setup.checkOrInstallTool({
      versionSpec,
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
