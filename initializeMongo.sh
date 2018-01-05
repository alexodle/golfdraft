#!/bin/bash

source ~/config.sh
mongo --eval "var pwd = '${MONGO_PW}'" ~/golfdraft/initializeMongo.js
