#!/usr/bin/env nu
# Author: hustcer
# Created: 2022/04/29 10:06:56
# Description: Script to release setup-nu
#
# TODO:
#   [√] Make sure the release tag does not exist;
#   [√] Make sure there are no uncommit changes;
#   [√] Update change log if required;
#   [√] Create a release tag and push it to the remote repo;
# Usage:
#   Change `actionVer` in package.json and then run: `just release` OR `just release true`

export def 'make-release' [
  --update-log(-u),   # Set to `true` do enable updating CHANGELOG.md
] {

  cd $env.SETUP_NU_PATH
  let releaseVer = (open package.json | get actionVer)

  if (has-ref $releaseVer) {
  	print $'The version ($releaseVer) already exists, Please choose another version.(char nl)'
  	exit 5
  }
  let statusCheck = (git status --porcelain)
  if not ($statusCheck | is-empty) {
  	print $'You have uncommit changes, please commit them and try `release` again!(char nl)'
  	exit 5
  }
  if ($update_log) {
    git cliff --unreleased --tag $releaseVer --prepend CHANGELOG.md;
    git commit CHANGELOG.md -m $'update CHANGELOG.md for ($releaseVer)'
  }
  # Delete tags that not exist in remote repo
  git fetch origin --prune '+refs/tags/*:refs/tags/*'
  let commitMsg = $'A new release for version: ($releaseVer) created by Release command of setup-nu'
  git tag $releaseVer -am $commitMsg; git push origin --tags
}
