#!/usr/bin/env nu

# REF
#   1. https://github.com/actions/runner-images/blob/main/images/win/Windows2022-Readme.md

# Config files are needed to avoid plugin register failure.
# The following lines were used to fix `× Plugin failed to load: No such file or directory (os error 2)`
let config_path = ($nu.env-path | path dirname)
let config_prefix = 'https://raw.githubusercontent.com/nushell/nushell/main/crates/nu-utils/src'
aria2c $'($config_prefix)/sample_config/default_env.nu' -o env.nu -d $config_path
aria2c $'($config_prefix)/sample_config/default_config.nu' -o config.nu -d $config_path

def register-plugins [] {
  ls (which nu | get 0.path | path dirname)
    | where name =~ nu_plugin
    | each {|plugin|
        print $'Registering ($plugin.name)'
        nu -c $'register ($plugin.name)'
    }
}

register-plugins
print $"(char nl)Plugins registered successfully"
