#!/usr/bin/env nu
# Author: hustcer
# Created: 2022/04/29 10:06:56
# Description: Script to release setup-nu
# TODO:
# [√] 确保新版本对应 Tag 不存在
# [√] 确保没有未提交的变更
# [√] 自动生成 Tag, 并推送远程
# [√] 更新 Change Log
# Usage:
# 	just release

def 'release' [
  --update-log: any      # Set to `true` do enable updating CHANGELOG.md, defined as `any` acutually `bool`
] {

  cd $env.SETUP_NU_PATH
  let releaseVer = (open ./package.json | get actionVer)

  if (has-ref $releaseVer) {
  	$'The version ($releaseVer) already exists, Please choose another version.(char nl)'
  	exit --now
  }
  let statusCheck = (git status --porcelain)
  if ($statusCheck | empty?) == false {
  	$'You have uncommit changes, please commit them and try `release` again!(char nl)'
  	exit --now
  }
  if ($update-log) {
    git cliff --unreleased --tag $releaseVer --prepend CHANGELOG.md;
    git commit CHANGELOG.md -m $'update CHANGELOG.md for ($releaseVer)'
  }
  # Delete tags that not exist in remote repo
  git fetch origin --prune '+refs/tags/*:refs/tags/*'
  let commitMsg = $'A new release for version: ($releaseVer) created by Release command of setup-nu'
  git tag $releaseVer -am $commitMsg; git push origin --tags
}
