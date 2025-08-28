#!/bin/sh
# Author: hustcer <hustcer@outlook.com>
# Date:   2021/09/29 17:52:58 +0800
# Git pre push hooks, need just/nu and related nu scripts to run.

# set -exo pipefail

loop {
  let input = input -s | split row " "
  if ($input | length) < 4 {continue};
  print 'Pushing to remote...'
  print $input.0?
  print $input.1?
  print $input.2?
  print $input.3?
  print '----------------------------------'
  break
}
