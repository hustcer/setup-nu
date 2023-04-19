#!/usr/bin/env nu
# Author: hustcer
# Created: 2022/04/29 18:36:56
# Usage:
#   use source command to load it

# If current host is Windows
export def windows? [] {
  # Windows / Darwin
  (sys).host.name == 'Windows'
}

# Get the specified env key's value or ''
export def 'get-env' [
  key: string       # The key to get it's env value
  default?: string  # The default value for an empty env
] {
  $env | get -i $key | default $default
}

# Check if a git repo has the specified ref: could be a branch or tag, etc.
export def 'has-ref' [
  ref: string   # The git ref to check
] {
  let parse = (git rev-parse --verify -q $ref)
  if ($parse | is-empty) { false } else { true }
}

# Compare two version number, return `true` if first one is higher than second one,
# Return `null` if they are equal, otherwise return `false`
export def 'compare-ver' [
  from: string,
  to: string,
] {
  let dest = ($to | str downcase | str trim -c 'v' | str trim)
  let source = ($from | str downcase | str trim -c 'v' | str trim)
  let v1 = ($source | split row '.' | each {|it| ($it | into int)})
  let v2 = ($dest | split row '.' | each {|it| ($it | into int)})
  for $v in $v1 -n {
    let c1 = ($v1 | get -i $v.index | default 0)
    let c2 = ($v2 | get -i $v.index | default 0)
    if $c1 > $c2 {
      return true
    } else if ($c1 < $c2) {
      return false
    }
  }
  return null
}

# Compare two version number, return true if first one is lower then second one
export def 'is-lower-ver' [
  from: string,
  to: string,
] {
  (compare-ver $from $to) == false
}

# Check if git was installed and if current directory is a git repo
export def 'git-check' [
  dest: string        # The dest dir to check
  --check-repo: int   # Check if current directory is a git repo
] {
  cd $dest
  let isGitInstalled = ((which git | length) > 0)
  if (not $isGitInstalled) {
    print $'You should (ansi r)INSTALL git(ansi reset) first to run this command, bye...'
    exit --now
  }
  # If we don't need repo check just quit now
  if ($check_repo != 0) {
    let checkRepo = (do -i { git rev-parse --is-inside-work-tree } | complete)
    if not ($checkRepo.stdout =~ 'true') {
      print $'Current directory is (ansi r)NOT(ansi reset) a git repo, bye...(char nl)'
      exit --now
    }
  }
}

# Log some variables
export def 'log' [
  name: string
  var: any
] {
  print $'(ansi g)-----------------> Debug Begin: ($name) <-----------------(ansi reset)'
  print $var
  print $'(ansi g)------------------->  Debug End <---------------------(char nl)(ansi reset)'
}

export def 'hr-line' [
  --blank-line(-b): bool
] {
  print $'(ansi g)---------------------------------------------------------------------------->(ansi reset)'
  if $blank_line { char nl }
}
