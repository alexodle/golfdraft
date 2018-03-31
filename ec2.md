#Provisioning a new EC2 instance

1. Create a new Ubuntu EC2 instance
1. `ssh -i <pemfile> ubuntu@<host>`
1. `sudo apt-get update`
1. `ssh-keygen -t rsa -b 4096 -C "email"`
1. Add new key to github
1. `sudo apt-get install git`
1. `git clone git@github.com:odetown/golfdraft.git`
1. `git clone git@github.com:odetown/golfraft_cfg.git`
1. `cp ./golfdraft/ec2_config.sh ./config.sh`
1. Fill in config.sh
