#!/bin/sh

redis-server $(pwd)/redis.conf
mongod --fork --syslog
export DEBUG=true
