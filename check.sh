#! /bin/bash

# Does basic static checks on the code.
# to check compliance before a git commit: ln -s '../../check.sh' .git/hooks/pre-commit
# To fix the linting: ./check.sh --fix
# Requires standard js: npm install --global standard

if [ "$1" == '--fix' ]; then
  standard --fix --env mocha --env browser --globals assert tests/**.js
  standard --fix --env browser js/**
  standard --fix --env serviceworker worker.js
  exit 0
fi

set -e

echo checking…

! grep -r 'console\.log' js/
standard --env mocha --env browser --globals assert tests/**.js
standard --env browser js/**
standard --env serviceworker worker.js

echo all good!
