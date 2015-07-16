#!/bin/bash

env_script=/home/ubuntu/prodEnv.sh
codedir=/home/ubuntu/code/golfdraft

date=`date +%Y-%m-%d:%H:%M:%S`

logdir=/var/log/golfdraft
logfile="${logdir}/log.${date}.log"
#errlogfile="${logdir}/log.${date}.err.log"

pushd $codedir
git checkout master
git pull origin master
npm install
source $env_script
/usr/bin/node ./scores_sync/runUpdateScore.js pgatour http://www.pgatour.com/data/r/100/leaderboard-v2.json > $logfile 2>&1
popd

echo "DONE!"
