#!/bin/bash

BASE_DIR=~/golfdraft

sudo apt-get update
sudo apt-get install -y nginx

sudo ufw allow 'Nginx HTTP'
sudo ufw status

sudo systemctl status nginx

sudo cp $BASE_DIR/ec2_default_nginx_conf /etc/nginx/sites-available/default
sudo systemctl restart nginx
