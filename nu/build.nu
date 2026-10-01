#!/usr/bin/env nu
# Description: Build the setup-nu action
# This script replaces the complex build command in package.json

# Get the project root directory
let root = $env.FILE_PWD | path dirname

# Step 1: Generate src/plugins.ts from the template
# The register script is embedded into the bundle, so it has to be inlined before esbuild runs.
# The Justfile delegates to this script for the build.
let plugins_tpl = $root | path join src plugins-tpl.ts
let register_script = $root | path join nu register-plugins.nu
let plugins_ts = $root | path join src plugins.ts
open --raw $plugins_tpl
    | str replace __PLUGIN_REGISTER_SCRIPT__ (open --raw $register_script)
    | save -rf $plugins_ts
print $'Generated ($plugins_ts)'

# Step 2: Bundle the Node 24 action as CommonJS. This keeps bundled CommonJS
# dependencies compatible with the ESM source package.
print 'Building with esbuild...'
cd $root
let dist_dir = $root | path join dist
let index_js = $dist_dir | path join index.js
let result = (^esbuild src/index.ts --bundle --platform=node --target=node24 --format=cjs --minify $'--outfile=($index_js)' | complete)
if $result.exit_code != 0 {
    error make { msg: $'esbuild failed: ($result.stderr)' }
}
print $result.stderr

# Node treats .js in this directory as CommonJS independently of the ESM source package.
'{"type":"commonjs"}' | save -f ($dist_dir | path join package.json)

print 'Build completed!'
