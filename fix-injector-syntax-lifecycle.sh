#!/bin/bash

echo "=== Fixing Injector Syntax Error ==="

# The problem is the injector has mismatched parentheses after adding lifecycle guards
# We need to fix the promise chain structure

# First, backup the broken file
cp canon-console/browser/inject.js canon-console/browser/inject.js.broken-lifecycle

# Fix by rewriting the end of the promise chain correctly
# Find the line number where the chain should end (around line 350)
# The structure should be: .then().then().then()... without extra })()

# Use sed to fix the specific issue
sed -i '352d' canon-console/browser/inject.js  # Remove the extra })();

echo "✓ Removed extra closing parentheses"

# Verify the fix
if node -c canon-console/browser/inject.js 2>/dev/null; then
  echo "✓ Syntax is now valid"
else
  echo "✗ Still has syntax errors, manual fix needed"
  echo "Check around line 350-352 for mismatched parentheses"
fi
