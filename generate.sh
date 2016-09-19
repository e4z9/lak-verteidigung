#/usr/bin/bash

BASE=`dirname $0`
$BASE/generate.hs "$BASE" "$@"
