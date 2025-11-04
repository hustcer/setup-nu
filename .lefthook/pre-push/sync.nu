#!/usr/bin/env nu
# Author: hustcer <hustcer@outlook.com>
# Date:   2025/08/29 08:52:58 +0800
# Git pre push hooks, need just/nu and related nu scripts to run.

# Read stdin safely and handle empty cases
let all_lines = (lines | collect)

# print '****************************************************'
# print $all_lines
# print '****************************************************'

if ($all_lines | length) > 0 {
  let input = $all_lines
    | each { split row ' ' }
    | where { |row| ($row | length) > 3 }
    | first
    | { local_ref: $in.0, local_oid: $in.1, remote_ref: $in.2, remote_oid: $in.3 }

  if ($input | is-not-empty) {
    print 'Pushing to remote from Nu...'
    print $input.local_ref
    print $input.local_oid
    print $input.remote_ref
    print $input.remote_oid
    print '----------------------------------'
  }
}

