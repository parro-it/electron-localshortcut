#!/bin/sh
json -I -f package.json -e 'this.license="MIT"'
licejs mit | head -n 3  | sed 's/$/\n/' >> readme.md &&
licejs mit > license
