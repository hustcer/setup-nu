#!/usr/bin/env nu
# Author: hustcer
# Created: 2022/04/29 10:06:56
# Description: Script to release setup-nu
#
# TODO:
#   [√] Make sure the release tag does not exist;
#   [√] Make sure there are no uncommitted changes;
#   [√] Update change log if required;
#   [√] Create a release tag and push it to the remote repo;
# Usage:
#   Change `actionVer` in package.json and then run: `just release` OR `just release true`

export def make-release [
  --update-log(-u),   # Set to `true` do enable updating CHANGELOG.md
] {

  cd $env.SETUP_NU_PATH
  let releaseVer = (open package.json | get actionVer)
  # Remembered before any checkout, `git checkout <tag>` below leaves a detached HEAD otherwise
  let originBranch = git rev-parse --abbrev-ref HEAD | str trim

  if (has-ref $releaseVer) {
  	print $'The version ($releaseVer) already exists, Please choose another version.(char nl)'
  	exit 5
  }
  let majorTag = $releaseVer | split row '.' | first
  let statusCheck = (git status --porcelain)
  if not ($statusCheck | is-empty) {
  	print $'You have uncommitted changes, please commit them and try `release` again!(char nl)'
  	exit 5
  }
  if ($update_log) {
    git cliff --unreleased --tag $releaseVer --prepend CHANGELOG.md;
    git commit CHANGELOG.md -m $'update CHANGELOG.md for ($releaseVer)'
  }
  # Delete tags that not exist in remote repo
  git fetch origin --prune '+refs/tags/*:refs/tags/*'
  let commitMsg = $'A new release for version: ($releaseVer) created by Release command of setup-nu'
  git tag $releaseVer -am $commitMsg
  # Remove local major version tag if exists and ignore errors
  do -i { git tag -d $majorTag } | complete 
  # A failure anywhere between the tag checkout and the push would abort the script and leave the
  # repo on a detached HEAD, so the restore below has to run on the error path as well.
  let failure = try {
    git checkout $releaseVer
    git tag $majorTag
    git push origin $majorTag $releaseVer --force
    null
  } catch {|err| $err }
  # Leave the repo on the branch the release was started from instead of a detached HEAD
  if $originBranch != 'HEAD' {
    git checkout $originBranch
    print $'(char nl)Switched back to ($originBranch).'
  }
  if $failure != null {
    error make {msg: $'Release of ($releaseVer) failed: ($failure.msg)'}
  }
}
