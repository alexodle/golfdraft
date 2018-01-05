# EXAMPLE config.sh

export TOURNEY_CFG_TAG="17pga"
export TOURNEY_CFG="/home/ec2-user/golfraft_cfg/tourney_cfg.json"

unset DEBUG
export PORT=8000

# NEED TO FILL IN
export REDIS_TOGO_URL=TODO
export MONGO_PW=TODO

export MONGO_URI="mongodb://gd:${MONGO_PW}@127.0.0.1:27017/gd"

export TOURNEY_ID=596e402a829d03944426f355

export ADMIN_PASS=<admin_pass>
