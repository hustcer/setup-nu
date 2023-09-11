#!/usr/bin/env nu
# Author: hustcer
# Created: 2023/09/11 18:36:56
# Usage:
#   use source command to load it


# Get the specified env key's value or ''
export def 'get-env' [
  key: string       # The key to get it's env value
  default?: string  # The default value for an empty env
] {
  $env | get -i $key | default $default
}

