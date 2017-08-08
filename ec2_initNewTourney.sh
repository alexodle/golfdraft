#!/bin/bash

cd ~/
source config.sh

cd ~/golfraft_cfg
git fetch
git checkout "$TOURNEY_CFG_TAG"
git pull origin "$TOURNEY_CFG_TAG"

cd ~/golfdraft
git checkout master
git pull origin master
npm install
/usr/bin/node ./server/refreshData.js
