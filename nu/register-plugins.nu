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
  # "split row . | first" used to strip the .exe extension on Windows
  let available = $allPlugins | each {|it| $it.name | path basename | split row . | first }
  # The action wraps the input in an extra pair of single quotes, strip them before splitting
  let requested = $enablePlugins | str trim -c "'" | split row , | each { str trim } | where { is-not-empty }

  let filteredPlugins = if $requested == ['true'] {
      $allPlugins
    } else {
      let unknown = $requested | where {|name| $name not-in $available }
      if ($unknown | is-not-empty) {
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
    | save -rf do-register.nu
}
