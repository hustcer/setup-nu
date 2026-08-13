import shell from 'shelljs';
import semver from 'semver';
import * as os from 'node:os';
import * as path from 'node:path';
import { promises as fs, constants as fs_constants } from 'node:fs';

/**
 * Validates enablePlugins input to prevent command injection.
 * Allows: 'true', 'false', or comma-separated plugin names (alphanumeric, underscore only).
 *
 * Exported so the entry point can reject a bad value before anything is downloaded.
 */
export function validatePluginInput(input: string): void {
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
  // Both helper scripts live in the runner temp dir. The workspace is the user's checkout and
  // leftovers there show up in any `git status` / `git diff --exit-code` check of a later step.
  const scriptDir = process.env.RUNNER_TEMP || os.tmpdir();
  const script = path.join(scriptDir, 'register-plugins.nu');
  const generated = path.join(scriptDir, 'do-register.nu');
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
    ? `nu "${script}" "'${enablePlugins}'" ${version} --is-legacy`
    : `nu "${script}" "'${enablePlugins}'" ${version}`;
  execOrThrow(registerCommand);
  // console.log('Contents of `do-register.nu`:\n');
  // const content = shell.cat(generated);
  // console.log(content.toString());
  console.log('\nRegistering plugins...\n');
  execOrThrow(`nu "${generated}"`);
  console.log(`Plugins registered successfully for Nu ${version}.`);
}
