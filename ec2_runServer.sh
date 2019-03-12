#!/bin/bash -e

## Idea is to run this on a screen session

killall node || true

source ~/config.sh

pushd $BASE_DIR
git checkout master
git pull origin master
npm install

npm run buildServer
npm start > $BASE_DIR/../serverlog.log 2>&1 &

popd
tail -f $BASE_DIR/../serverlog.log
