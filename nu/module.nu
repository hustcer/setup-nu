#!/usr/bin/env nu
# Author: hustcer
# Created: 2023/09/11 18:36:56
# Usage:
#   use source command to load it


# Get the specified env key's value or ''
export def 'get-env-abc' [
  default?: string  # The default value for an empty env
] {
  $env | get ABC? | default $default
}

