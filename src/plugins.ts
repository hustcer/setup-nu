import shell from 'shelljs';
import semver from 'semver';
import { promises as fs, constants as fs_constants } from 'node:fs';

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
  let nuDir = (which nu | get 0.path | path dirname)
  print $'enablePlugins: ($enablePlugins) of Nu version: ($version)'

  if $debug {
    print 'Output of (which nu):'; print (which nu)
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
      $allPlugins | filter {|it| $enablePlugins =~ ($it.name | path basename | split row . | first)}
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
