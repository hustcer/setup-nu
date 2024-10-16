import shell from 'shelljs';
import semver from 'semver';
import { promises as fs, constants as fs_constants } from 'node:fs';

const nu = String.raw;

const pluginRegisterScript = nu`
__PLUGIN_REGISTER_SCRIPT__
`;

export async function registerPlugins(enablePlugins: string, version: string) {
  if (enablePlugins === '' || enablePlugins === 'false') {
    return;
  }
  const LEGACY_VERSION = '0.92.3';
  const script = 'register-plugins.nu';
  const isLegacyVersion = !version.includes('nightly') && semver.lte(version, LEGACY_VERSION);
  await fs.writeFile(script, pluginRegisterScript);
  try {
    await fs.access(script, fs_constants.X_OK);
  } catch {
    await fs.chmod(script, '755');
    console.log(`Fixed file permissions (-> 0o755) for ${script}`);
  }
  if (isLegacyVersion) {
    shell.exec(`nu ${script} "'${enablePlugins}'" ${version} --is-legacy`);
  } else {
    shell.exec(`nu ${script} "'${enablePlugins}'" ${version}`);
  }
  // console.log('Contents of `do-register.nu`:\n');
  // const content = shell.cat('do-register.nu');
  // console.log(content.toString());
  console.log('\nRegistering plugins...\n');
  shell.exec('nu do-register.nu');
  console.log(`Plugins registered successfully for Nu ${version}.`);
}
