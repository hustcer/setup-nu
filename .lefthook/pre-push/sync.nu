#!/bin/sh
# Author: hustcer <hustcer@outlook.com>
# Date:   2021/09/29 17:52:58 +0800
# Git pre push hooks, need just/nu and related nu scripts to run.

let input = lines # reads from the input, stdin when run with `nu --stdin`
  | each { split row " " }
  | skip while { length | $in < 4 }
  | first
  | {local_ref: $in.0, local_oid: $in.1, remote_ref: $in.2, remote_oid: $in.3}

  print 'Pushing to remote from Nu...'
  print $input.local_ref
  print $input.local_oid
  print $input.remote_ref
  print $input.remote_oid
  print '----------------------------------'

