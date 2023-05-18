#!/bin/sh
# Author: hustcer <hustcer@outlook.com>
# Date:   2021/09/29 17:52:58 +0800
# Git pre push hooks, need just/nu and related nu scripts to run.

# set -exo pipefail

while read -t 2 -s local_ref local_oid remote_ref remote_oid
do
  # CASE DELETE REMOTE:
  # (delete)
  # 0000000000000000000000000000000000000000
  # refs/heads/feature/hooks
  # 8e333c3a5cc4e0e238c2b64b9df78294bee819dd
  # ----------------------------------------
  # CASE PUSH NEW REMOTE:
  # refs/heads/feature/hooks
  # 8e333c3a5cc4e0e238c2b64b9df78294bee819dd
  # refs/heads/feature/hooks
  # 0000000000000000000000000000000000000000
  # ----------------------------------------
  # CASE NORMAL PUSH:
  # refs/heads/feature/hooks
  # 15cc359819f39a6c891109aa407baac6d8a9f608
  # refs/heads/feature/hooks
  # 8e333c3a5cc4e0e238c2b64b9df78294bee819dd
  # ----------------------------------------
  # echo $local_ref
  # echo $local_oid
  # echo $remote_ref
  # echo $remote_oid
  # echo '----------------------------------'

  if ! command -v just &> /dev/null; then
    echo "Command 'just' could not be found, Please install it by 'brew install just', and try again!\n"
    break;
  fi
  if ! command -v nu &> /dev/null; then
    echo "Command 'nu' could not be found, Please install it by 'brew install nushell', and try again!\n"
    break;
  fi

  # 本地分支删除的时候 local_ref="(delete)"，just 解析 `(delete)` 参数的时候有问题
  # 所以需要将其转换下，反正删除时候的 `local_ref` 值对脚本用处不大
  if [[ $local_ref == '(delete)' ]]; then local_ref='_delete_'; fi
  just --justfile ~/.justfile --dotenv-path ~/.env git-sync-branch $local_ref "'$local_oid'" $remote_ref;
  # Break is important here, to stop another loop
  break;
done

exit 0
