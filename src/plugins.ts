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
#!/usr/bin/env nu

# REF
#   1. https://github.com/actions/runner-images/blob/main/images/win/Windows2022-Readme.md

# Config files are needed to avoid plugin register failure.
# The following lines were used to fix "× Plugin failed to load: No such file or directory (os error 2)"

def main [
  enablePlugins: string,  # Whether to enable or disable plugins.
  version: string,        # The tag name or version of the release to use.
  --debug,                # Whether to enable debug mode.
  --is-legacy,            # Whether to use the legacy plugin registration command for Nu 0.92.3 and below.
] {

  let useRegister = if $is_legacy { true } else { false }
  let nuDir = $nu.current-exe | path dirname
  print $'enablePlugins: ($enablePlugins) of Nu version: ($version)'

  if $debug {
    print 'Output of ($nu.current-exe):'; print $nu.current-exe
    print 'Directory contents:'; ls $nuDir | print
  }

  # print $nu
  # Create Nu config directory if it does not exist
  if not ($nu.default-config-dir | path exists) { mkdir $nu.default-config-dir }
  # Only fill in the config files when they are missing. Overwriting them would silently discard a
  # config that the runner image or an earlier step of the workflow had set up.
  if not ($nu.env-path | path exists) { config env --default | save -f $nu.env-path }
  if not ($nu.config-path | path exists) { config nu --default | save -f $nu.config-path }
  # print (ls $nu.default-config-dir)

  let allPlugins = ls $nuDir | where name =~ nu_plugin
  # "split row . | first" used to strip the .exe extension on Windows
  let available = $allPlugins | each {|it| $it.name | path basename | split row . | first }
  # The action wraps the input in an extra pair of single quotes, strip them before splitting.
  # NOTE: plugin registration supports Nu 0.86+, so "is-not-empty" (Nu 0.91+) must not be used here.
  let requested = $enablePlugins | str trim -c "'" | split row , | each { str trim } | where {|name| $name != '' }

  let filteredPlugins = if $requested == ['true'] {
      $allPlugins
    } else {
      let unknown = $requested | where {|name| $name not-in $available }
      if ($unknown | length) > 0 {
        # A silently ignored typo used to look exactly like "the plugin was registered"
        print $'::warning::No bundled plugin matches ($unknown | str join ", "). Available plugins: ($available | str join ", ")'
      }
      $allPlugins | where {|it| ($it.name | path basename | split row . | first) in $requested }
    }

  if $debug {
    print $'Filtered plugins:'; print $filteredPlugins
  }

  $filteredPlugins | each {|plugin|
        # "to nuon" quotes and escapes the values, a plugin dir may contain spaces on self-hosted
        # runners and an unquoted path would break the generated script.
        # NOTE: this file is inlined into a JS template literal, so it must not contain backticks.
        let p = $plugin.name | str replace -a \ / | to nuon
        let msg = $'Registering ($plugin.name)' | to nuon
        let cmd = if $useRegister { $'register ($p)' } else { $'plugin add ($p)' }
        [$'print ($msg)' $cmd] | str join "\n"
      }
    | str join "\n"
    | save -rf ($env.FILE_PWD | path join do-register.nu)
}

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
