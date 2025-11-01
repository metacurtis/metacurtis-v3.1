#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Record a trailing savepoint after successful commit
if [ -f .cdp/config.json ]; then
  node scripts/cdp-savepoint.mjs "post-commit"
fi
