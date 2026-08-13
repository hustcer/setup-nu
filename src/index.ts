/**
 * Author: hustcer
 * Created: 2022/04/28 18:50:20
 */

import shell from 'shelljs';
import * as core from '@actions/core';

import * as setup from './setup.js';
import { registerPlugins, validatePluginInput } from './plugins.js';

async function main() {
  try {
    const versionSpec = core.getInput('version') || '*';
    console.log(`versionSpec: ${versionSpec}`);
    const checkLatest = (core.getInput('check-latest') || 'false').toUpperCase() === 'TRUE';
    const enablePlugins = (core.getInput('enable-plugins') || 'false').toLowerCase();
    // Reject a malformed plugin list before anything is downloaded, the registration itself only
    // happens after the install and a typo there would waste the whole download.
    if (enablePlugins !== 'false') {
      validatePluginInput(enablePlugins);
    }
    const rawFeatures = (core.getInput('features') || 'default').toLowerCase();
    if (rawFeatures !== 'default' && rawFeatures !== 'full') {
      throw new Error(`Invalid features input: ${rawFeatures}`);
    }
    const features = rawFeatures as 'default' | 'full';
    const githubToken = core.getInput('github-token');
    const commitSha = setup.isCommitSha(versionSpec) ? versionSpec.toLowerCase() : undefined;
    const version: string | null = commitSha ?? setup.resolveVersionSpec(versionSpec);
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
