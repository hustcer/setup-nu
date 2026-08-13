#!/usr/bin/env nu
# Description: Run the test suite for setup-nu
#   - node:test over the TypeScript sources (no test framework dependency)
#   - the Nushell tests for the helper scripts
# Usage: pnpm test   OR   nu nu/test.nu

let root = $env.FILE_PWD | path dirname
cd $root

# The plugin tests import `src/plugins.ts`, which the build generates from `src/plugins-tpl.ts`
let plugins_ts = $root | path join src plugins.ts
if not ($plugins_ts | path exists) {
    print 'src/plugins.ts is missing, running the build first...'
    nu ($root | path join nu build.nu)
}

print $'(ansi pb)TypeScript tests(ansi reset)'
# `--experimental-strip-types` runs the .ts sources directly, it is a no-op on Node 24+.
# Node 22 cannot discover tests from a directory, so the files are passed explicitly.
let ts_tests = glob ($root | path join tests '*.test.ts')
^node --experimental-strip-types --test ...$ts_tests

print $'(char nl)(ansi pb)Nushell tests(ansi reset)'
^nu ($root | path join tests nu-test.nu)

print $'(char nl)(ansi g)All tests passed.(ansi reset)'
