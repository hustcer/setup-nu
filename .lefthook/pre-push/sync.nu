#!/usr/bin/env nu
# Author: hustcer <hustcer@outlook.com>
# Date:   2021/09/29 17:52:58 +0800
# Git pre push hooks, need just/nu and related nu scripts to run.

# 安全地读取标准输入，处理可能为空的情况
let all_lines = (lines | collect)

if ($all_lines | length) > 0 {
  let valid_input = $all_lines
    | each { split row " " }
    | where { |row| ($row | length) >= 4 }
    | first

  if ($valid_input | is-not-empty) {
    print 'Pushing to remote from Nu...'
    print $valid_input.0
    print $valid_input.1
    print $valid_input.2
    print $valid_input.3
    print '----------------------------------'
  }
}

