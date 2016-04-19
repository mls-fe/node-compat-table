#!/usr/bin/env bash

echo
echo 'extracting testers...'
node extract.js > ./testers.json

echo
echo 'running the tests on each version of node...'
while read v; do
  n use $v test.js
  n use $v --es_staging test.js
done < .versions


LATEST=$(curl -sL https://nodejs.org/download/nightly/index.tab |   awk '{ if (!f && NR > 1) { print $1; f = 1 } }')
PROJECT_NAME="node" PROJECT_URL="https://nodejs.org/download/nightly/" n project $LATEST
node test.js
node --es_staging test.js

echo
echo 'building webpage...'
node build.js
