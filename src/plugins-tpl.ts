import shell from 'shelljs';
import semver from 'semver';
import { promises as fs, constants as fs_constants } from 'node:fs';

/**
 * Validates enablePlugins input to prevent command injection.
 * Allows: 'true', 'false', or comma-separated plugin names (alphanumeric, underscore only).
 */
function validatePluginInput(input: string): void {
  // Allow 'true', 'false', or comma-separated identifiers (word characters only)
  if (!/^(true|false|[\w]+(,[\w]+)*)$/i.test(input)) {
    throw new Error(
      `Invalid enable-plugins input: "${input}". Only alphanumeric characters, underscores, and commas are allowed.`
    );
  }
}

/**
 * Validates version string to prevent command injection.
 * Allows: alphanumeric, dots, hyphens (e.g., "0.95.0", "nightly-56ed69a").
 */
function validateVersion(version: string): void {
  if (!/^[\w.-]+$/.test(version)) {
    throw new Error(
      `Invalid version format: "${version}". Only alphanumeric characters, dots, and hyphens are allowed.`
    );
  }
}

const nu = String.raw;

const pluginRegisterScript = nu`
__PLUGIN_REGISTER_SCRIPT__
`;

export async function registerPlugins(enablePlugins: string, version: string) {
  if (enablePlugins === '' || enablePlugins === 'false') {
    return;
  }

  // Validate inputs to prevent command injection
  validatePluginInput(enablePlugins);
  validateVersion(version);

  const LEGACY_VERSION = '0.92.3';
  const script = 'register-plugins.nu';
  const isLegacyVersion = !version.includes('nightly') && semver.lte(version, LEGACY_VERSION);
  const execOrThrow = (command: string) => {
    const result = shell.exec(command);
    if (result.code !== 0) {
      throw new Error(`Command failed (${command}): ${result.stderr || result.stdout}`);
    }
  };
  await fs.writeFile(script, pluginRegisterScript);
  try {
    await fs.access(script, fs_constants.X_OK);
  } catch {
    await fs.chmod(script, '755');
    console.log(`Fixed file permissions (-> 0o755) for ${script}`);
  }
  const registerCommand = isLegacyVersion
    ? `nu ${script} "'${enablePlugins}'" ${version} --is-legacy`
    : `nu ${script} "'${enablePlugins}'" ${version}`;
  execOrThrow(registerCommand);
  // console.log('Contents of `do-register.nu`:\n');
  // const content = shell.cat('do-register.nu');
  // console.log(content.toString());
  console.log('\nRegistering plugins...\n');
  execOrThrow('nu do-register.nu');
  console.log(`Plugins registered successfully for Nu ${version}.`);
}
