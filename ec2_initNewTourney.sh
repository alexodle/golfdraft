#!/bin/bash

curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs

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
/usr/bin/nodejs ./server/refreshData.js
