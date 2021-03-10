#!/bin/bash -e

BASE_DIR=~/golfdraft

source $BASE_DIR/../config.sh

apt-get update
apt-get install -y libgbm-dev

$BASE_DIR/ec2_installNode.sh

$BASE_DIR/ec2_installMongodb.sh
$BASE_DIR/initializeMongo.sh

$BASE_DIR/ec2_installNginx.sh

