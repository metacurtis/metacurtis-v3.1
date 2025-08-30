#!/bin/bash

echo "Fixing ESLint errors..."

# Run ESLint with auto-fix
npm run lint -- --fix

# Show remaining errors if any
echo "Checking for remaining errors..."
npm run lint

# If there are still errors, show them
if [ $? -ne 0 ]; then
  echo "Some errors couldn't be auto-fixed. Review them manually."
  npm run lint -- --format compact
fi
