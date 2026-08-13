#!/usr/bin/env nu
# Description: Tests for the Nushell helper scripts.
# Usage: nu tests/nu-test.nu
# cspell:ignore qeury
#
# `register-plugins.nu` is exercised against a fixture directory of fake plugin binaries, so the
# filtering, quoting and warning behavior is covered without downloading a real Nushell release.

use ../nu/common.nu [compare-ver, is-lower-ver]

const REPO = path self ..
const WORK = '/tmp/setup-nu-nu-tests'

mut failures = 0

# Assert that two values are equal.
def check [name: string, expected: any, actual: any]: nothing -> bool {
  let ok = $expected == $actual
  let mark = if $ok { $'(ansi g)PASS(ansi reset)' } else { $'(ansi r)FAIL(ansi reset)' }
  print $'  ($mark)  ($name)'
  if not $ok {
    print $'          expected: ($expected)'
    print $'          actual:   ($actual)'
  }
  $ok
}

# Build a fake Nu install: a `nu` stub plus plugin binaries, then run register-plugins.nu with it.
# Returns the generated do-register.nu contents together with the script output.
def run-register [
  enable_plugins: string    # The value the action would pass through
  plugins: list<string>     # Plugin binary names to place next to the fake `nu`
]: nothing -> record {
  let dir = $WORK | path join 'nu-dir'
  rm -rf $dir
  mkdir $dir
  for plugin in $plugins { '' | save -f ($dir | path join $plugin) }

  # register-plugins.nu resolves the plugin dir from $nu.current-exe, so it has to run through a
  # real `nu` binary that lives in the fixture dir.
  let nu_copy = $dir | path join (if ($nu.current-exe | path basename | str contains '.exe') { 'nu.exe' } else { 'nu' })
  cp $nu.current-exe $nu_copy

  let script = $WORK | path join 'register-plugins.nu'
  cp ($REPO | path join nu register-plugins.nu) $script

  let home = $WORK | path join 'home'
  rm -rf $home
  mkdir ($home | path join '.config')
  let result = with-env { HOME: $home, XDG_CONFIG_HOME: ($home | path join '.config') } {
    ^$nu_copy $script $"'($enable_plugins)'" '0.113.1' | complete
  }
  let generated = $WORK | path join 'do-register.nu'
  {
    output: ($result.stdout + $result.stderr)
    script: (if ($generated | path exists) { open --raw $generated } else { '' })
  }
}

rm -rf $WORK
mkdir $WORK

print $'(ansi pb)register-plugins.nu(ansi reset)'

# --- plugin selection ------------------------------------------------------
let selected = run-register 'nu_plugin_inc,nu_plugin_query' [nu_plugin_inc nu_plugin_query nu_plugin_polars]
$failures += (if (check 'only the requested plugins are registered' 2 ($selected.script | lines | where {|l| $l starts-with 'plugin add' } | length)) { 0 } else { 1 })
$failures += (if (check 'a plugin that was not requested is left out' false ($selected.script | str contains 'nu_plugin_polars')) { 0 } else { 1 })

let all = run-register 'true' [nu_plugin_inc nu_plugin_query nu_plugin_polars]
$failures += (if (check "'true' registers every bundled plugin" 3 ($all.script | lines | where {|l| $l starts-with 'plugin add' } | length)) { 0 } else { 1 })

# --- quoting ---------------------------------------------------------------
# An unquoted path breaks the generated script as soon as the plugin dir contains a space
$failures += (if (check 'the plugin path is quoted' true ($selected.script | str contains 'plugin add "')) { 0 } else { 1 })

# --- unknown plugin names --------------------------------------------------
# A silently ignored typo used to be indistinguishable from a successful registration
let typo = run-register 'nu_plugin_qeury' [nu_plugin_inc nu_plugin_query]
$failures += (if (check 'an unknown plugin name warns' true ($typo.output | str contains '::warning::No bundled plugin matches')) { 0 } else { 1 })
$failures += (if (check 'an unknown plugin name registers nothing' '' ($typo.script | str trim)) { 0 } else { 1 })

# --- Nu 0.86 compatibility -------------------------------------------------
# Plugin registration is supported from Nu 0.86 on, `is-not-empty` only exists since 0.91.
# Comments are stripped first, the NOTE in the script mentions the command it must not use.
let source = open --raw ($REPO | path join nu register-plugins.nu)
let code = $source | lines | where {|line| not ($line | str trim | str starts-with '#') }
$failures += (if (check 'does not use is-not-empty (needs Nu 0.91+)' false ($code | any {|line| $line | str contains 'is-not-empty' })) { 0 } else { 1 })
# The file is inlined into a String.raw template literal in plugins-tpl.ts, a backtick ends it
$failures += (if (check 'contains no backtick (breaks the JS template literal)' false ($source | str contains (char -i 96))) { 0 } else { 1 })

print $'(ansi pb)common.nu(ansi reset)'
$failures += (if (check 'compare-ver: higher major' 1 (compare-ver '1.0.0' '0.9.9')) { 0 } else { 1 })
$failures += (if (check 'compare-ver: equal' 0 (compare-ver '0.112.1' '0.112.1')) { 0 } else { 1 })
$failures += (if (check 'compare-ver: lower patch' (-1) (compare-ver '0.112.0' '0.112.1')) { 0 } else { 1 })
$failures += (if (check 'compare-ver: tolerates a v prefix' 0 (compare-ver 'v0.112.1' '0.112.1')) { 0 } else { 1 })
$failures += (if (check 'compare-ver: ignores pre-release suffix' 0 (compare-ver '0.112.1-nightly.3' '0.112.1')) { 0 } else { 1 })
$failures += (if (check 'is-lower-ver' true (is-lower-ver '0.111.1' '0.112.0')) { 0 } else { 1 })

rm -rf $WORK
print ''
if $failures == 0 {
  print $'(ansi g)All Nushell checks passed.(ansi reset)'
} else {
  print $'(ansi r)($failures) Nushell checks failed.(ansi reset)'
  exit 1
}
