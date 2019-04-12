# Provisioning a new EC2 instance

1. Create a new Ubuntu EC2 instance (ensure ports 80 and 443 are open)
1. `ssh -i <pemfile> ubuntu@<host>`
1. `sudo apt-get update`
1. `ssh-keygen -t rsa -b 4096 -C "email"`
1. Add new key to github
1. `sudo apt-get install git`
1. `git clone git@github.com:odetown/golfdraft.git`
1. `git clone git@github.com:odetown/golfraft_cfg.git`
1. `cp ./golfdraft/ec2_config.sh ./config.sh`
1. Fill in missing info in config.sh
1. `./golfdraft/ec2_provision.sh`
1. If you hit a mongodb connection issue, just run it again
1. `./golfdraft/ec2_initNewTourney.sh`
1. Let's encrypt setup: https://certbot.eff.org/lets-encrypt/ubuntuxenial-nginx
1. `./golfdraft/ec2_runServer.sh`

## crontab -e

```
*/10 * * * * ~/golfdraft/ec2_runUpdateScore.sh
0 * * * * [[ -d /tmp/golfdraft_data ]] && find /tmp/golfdraft_data/ -type f -mtime +2 -exec rm {} \;
0 * * * * [[ -d /var/log/golfdraft/ ]] && find /var/log/golfdraft/ -type f -mtime +2 -exec rm {} \;
```
