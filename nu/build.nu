#!/usr/bin/env nu
# Description: Build the setup-nu action
# This script replaces the complex build command in package.json

# Get the project root directory
let root = $env.FILE_PWD | path dirname

# Step 1: Remove dist directory
let dist_dir = $root | path join dist
if ($dist_dir | path exists) {
    rm -rf $dist_dir
    print $'Removed ($dist_dir)'
}

# Step 2: Build with ncc
print 'Building with ncc...'
cd $root
^ncc build src/index.ts --minify

# Step 3: Rename exec-child.js to exec-child.cjs
let exec_child_js = $dist_dir | path join exec-child.js
let exec_child_cjs = $dist_dir | path join exec-child.cjs
if ($exec_child_js | path exists) {
    mv $exec_child_js $exec_child_cjs
    print $'Renamed exec-child.js to exec-child.cjs'
}

# Step 4: Replace 'exec-child.js' with 'exec-child.cjs' in index.js
let index_js = $dist_dir | path join index.js
if ($index_js | path exists) {
    open --raw $index_js
        | str replace -a 'exec-child.js' 'exec-child.cjs'
        | save -f $index_js
    print $'Updated references in index.js'
}

print 'Build completed!'
