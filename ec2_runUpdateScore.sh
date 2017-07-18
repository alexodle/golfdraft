#!/bin/bash

cd ~/
source config.sh

codedir=$(pwd)/golfdraft

date=`date +%Y-%m-%d:%H:%M:%S`

logdir=/var/log/golfdraft
logfile="${logdir}/log.${date}.log"

git checkout master
git pull origin master
npm install
/usr/bin/node ./scores_sync/runUpdateScore.js $SCORES_URL_TYPE $SCORES_URL > $logfile 2>&1

echo "DONE!"
