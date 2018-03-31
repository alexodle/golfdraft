#!/bin/bash

BASE_DIR=~/golfdraft

killall node

source $BASE_DIR/../config.sh

pushd $BASE_DIR
git checkout master
git pull origin master
npm install

nohup npm start > $BASE_DIR/../serverlog.log 2>&1 &

popd
tail -f $BASE_DIR/../serverlog.log
