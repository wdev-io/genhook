#!/bin/sh
set -e

if test -z $1; then
  npm start
else
  $1
fi
