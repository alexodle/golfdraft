#!/bin/bash -e

BASE_DIR=~/golfdraft

source $BASE_DIR/../config.sh

pushd $BASE_DIR/../golfraft_cfg
git fetch
git fetch --tags
git checkout "$TOURNEY_CFG_TAG"
git pull origin "$TOURNEY_CFG_TAG"
popd

pushd $BASE_DIR
git checkout master
git pull origin master
npm install
npm run updateWgr
npm run refreshData
popd
