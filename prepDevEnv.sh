#!bin/bash

redis-server $(pwd)/redis.conf
mongod --fork --syslog
