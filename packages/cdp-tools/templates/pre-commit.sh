#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run cdp:validate
STATUS=$?

if [ $STATUS -ne 0 ]; then
  echo ""
  echo "❌ CDP validation failed. Commit blocked."
  echo ""
  echo "Options:"
  echo "  1. Fix the issues above"
  echo "  2. Skip validation (emergency only):"
  echo "     git commit --no-verify"
  echo ""
  exit 1
fi
