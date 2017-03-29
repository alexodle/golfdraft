#!/bin/sh

url=$1
pick_csv=$2

node server/refreshData.js pgatour $url
node server/setPicksFromCsv.js $pick_csv
