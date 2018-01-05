#!/bin/bash -e

BASE_DIR=~/golfdraft

source $BASE_DIR/../config.sh

$BASE_DIR/ec2_installNode.sh

$BASE_DIR/ec2_installMongodb.sh
$BASE_DIR/initializeMongo.sh

$BASE_DIR/ec2_installNginx.sh
