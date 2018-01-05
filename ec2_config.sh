# EXAMPLE config.sh

# Copy this into your home dir on ec2
# ex: cp ~/golfdraft/ec2_config.sh ~/config.sh
#
# Then, fill in the following vars:
export REDIS_URL=TODO
export MONGO_PW=TODO
export ADMIN_PASS=TODO

BASE_DIR=~/golfdraft

# UPDATE FOR CURRENT TOURNEY
export TOURNEY_CFG_TAG="" # ex: 17pga
export TOURNEY_CFG="$BASE_DIR/../golfraft_cfg/tourney_cfg.json"



unset DEBUG
export PORT=8000

export MONGO_URI="mongodb://gd:${MONGO_PW}@127.0.0.1:27017/gd"

export TOURNEY_ID=596e402a829d03944426f355
