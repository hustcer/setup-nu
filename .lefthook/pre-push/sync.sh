#!/bin/sh
# Author: hustcer <hustcer@outlook.com>
# Date:   2021/09/29 17:52:58 +0800
# Git pre push hooks, need just/nu and related nu scripts to run.

# set -exo pipefail

while read -t 2 -s local_ref local_oid remote_ref remote_oid
do

  # ----------------------------------------
  echo 'Pushing to remote...'
  # echo $local_ref
  # echo $local_oid
  # echo $remote_ref
  # echo $remote_oid
  echo '----------------------------------'

  # Break is important here, to stop another loop
  break;
done

exit 0
