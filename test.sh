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

echo
echo 'building webpage...'
node build.js
