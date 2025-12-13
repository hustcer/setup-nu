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
  config env --default | save -f $nu.env-path
  config nu --default | save -f $nu.config-path
  # print (ls $nu.default-config-dir)

  let allPlugins = ls $nuDir | where name =~ nu_plugin
  let filteredPlugins = if $enablePlugins == "'true'" or $enablePlugins == 'true' {
      $allPlugins
    } else {
      $allPlugins | reduce -f [] {|it, acc|
        # "split row . | first" used to handle binary with .exe extension
        if $enablePlugins =~ ($it.name | path basename | split row . | first) {
          $acc | append $it
        } else {
          $acc
        }
      }
    }

  if $debug {
    print $'Filtered plugins:'; print $filteredPlugins
  }

  $filteredPlugins | each {|plugin|
        let p = $plugin.name | str replace -a \ /
        if $useRegister {
          echo ([('print "' + $'Registering ($p)' + '"') $'register ($p)'] | str join "\n")
        } else {
          echo ([('print "' + $'Registering ($p)' + '"') $'plugin add ($p)'] | str join "\n")
        }
      }
    | str join "\n"
    | save -rf do-register.nu
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
