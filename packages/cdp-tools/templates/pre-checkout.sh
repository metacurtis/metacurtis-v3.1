#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Ensure working tree is clean before checkout
STATUS=$(git status --porcelain)
if [ -n "$STATUS" ]; then
  echo "⚠️  Uncommitted changes detected. Use git stash or commit before checkout."
  exit 1
fi
