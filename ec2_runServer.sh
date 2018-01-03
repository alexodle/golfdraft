#!/bin/bash

killall node

cd ~/
source config.sh

cd golfdraft
git checkout master
git pull origin master
npm install

cd golfdraft/
nohup node server/server.js > ../serverlog.log 2>&1 &
cd ../

tail -f ../serverlog.log
