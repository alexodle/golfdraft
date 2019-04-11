## EXAMPLE config.sh

## Copy this into your home dir on ec2
## i.e. cp ~/golfdraft/ec2_config.sh ~/config.sh
##
## Then, fill in the following vars:
export REDIS_URL=TODO
export MONGO_PW=TODO
export ADMIN_PASS=TODO
export SESSION_SECRET=TODO


BASE_DIR=~/golfdraft

unset DEBUG
export NODE_ENV=production
export PORT=8000
export MONGO_URI="mongodb://gd:${MONGO_PW}@127.0.0.1:27017/gd"

export TZ="America/Los_Angeles"
