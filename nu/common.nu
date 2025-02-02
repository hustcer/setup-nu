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
export def has-ref [
  ref: string   # The git ref to check
] {
  let checkRepo = (do -i { git rev-parse --is-inside-work-tree } | complete)
  if not ($checkRepo.stdout =~ 'true') { return false }
  # Brackets were required here, or error will occur
  let parse = (do -i { git rev-parse --verify -q $ref } | complete)
  if ($parse.stdout | is-empty) { false } else { true }
}

# Compare two version number, return `1` if first one is higher than second one,
# Return `0` if they are equal, otherwise return `-1`
export def compare-ver [v1: string, v2: string] {
  # Parse the version number: remove pre-release and build information,
  # only take the main version part, and convert it to a list of numbers
  def parse-ver [v: string] {
    $v | str downcase | str trim -c v | str trim
       | split row - | first | split row . | each { into int }
  }
  let a = parse-ver $v1
  let b = parse-ver $v2
  # Compare the major, minor, and patch parts; fill in the missing parts with 0
  # If you want to compare more parts use the following code:
  # for i in 0..([2 ($a | length) ($b | length)] | math max)
  for i in 0..2 {
    let x = $a | get -i $i | default 0
    let y = $b | get -i $i | default 0
    if $x > $y { return 1    }
    if $x < $y { return (-1) }
  }
  0
}

# Compare two version number, return true if first one is lower then second one
export def is-lower-ver [
  from: string,
  to: string,
] {
  (compare-ver $from $to) < 0
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
    exit 2
  }
  # If we don't need repo check just quit now
  if ($check_repo != 0) {
    let checkRepo = (do -i { git rev-parse --is-inside-work-tree } | complete)
    if not ($checkRepo.stdout =~ 'true') {
      print $'Current directory is (ansi r)NOT(ansi reset) a git repo, bye...(char nl)'
      exit 3
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
  --blank-line(-b)
] {
  print $'(ansi g)---------------------------------------------------------------------------->(ansi reset)'
  if $blank_line { char nl }
}
