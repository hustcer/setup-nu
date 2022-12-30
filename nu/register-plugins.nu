#!/usr/bin/env nu

# match command
def match [input, matchers: record] {
    echo $matchers | get $input | do $in
}

# register plugin
def register_plugin [plugin] {
    $"Registering ($plugin) ..."
    nu -c $'register ($plugin)'
}

# Config files are needed to avoid plugin register failure.
# The following 3 lines were used to fix `× Plugin failed to load: No such file or directory (os error 2)`
let config_path = ($nu.env-path | path dirname)
aria2c https://raw.githubusercontent.com/nushell/nushell/main/crates/nu-utils/src/sample_config/default_env.nu -o env.nu -d $config_path
aria2c https://raw.githubusercontent.com/nushell/nushell/main/crates/nu-utils/src/sample_config/default_config.nu -o config.nu -d $config_path

# get list of all plugin files from their installed directory
let plugin_location = ((which nu).path.0 | path dirname)

# for each plugin file, print the name and launch another instance of nushell to register it
for plugin in (ls $"($plugin_location)/nu_plugin_*") {
    match ($plugin.name | path basename | str replace '\.exe$' '') {
        nu_plugin_inc: { register_plugin $plugin.name }
        nu_plugin_gstat: { register_plugin $plugin.name }
        nu_plugin_query: { register_plugin $plugin.name }
        nu_plugin_example: { register_plugin $plugin.name }
        nu_plugin_custom_values: { register_plugin $plugin.name }
    }
}

# print helpful message
print "\nPlugins registered successfully"
