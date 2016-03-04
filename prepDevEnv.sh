#!/bin/sh

redis-server $(pwd)/redis.conf
mongod --fork --syslog
