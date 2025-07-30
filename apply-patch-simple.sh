#!/bin/bash
# Simple patch application without branch management

PATCH_DIR=".ai-queue"
PATCHES=$(ls $PATCH_DIR/*.patch 2>/dev/null | head -1)

if [ -z "$PATCHES" ]; then
    echo "No patches found in $PATCH_DIR"
    exit 0
fi

PATCH=$(basename "$PATCHES")
echo "Applying patch: $PATCH"

# Apply the patch directly to current branch
git apply --3way "$PATCHES"

# Run validation
npm run lint
npm test --silent
node scripts/validate-sst.js

# If everything passed, commit
if [ $? -eq 0 ]; then
    git add -A
    git commit -m "Apply patch: $PATCH"
    echo "✅ Patch applied successfully!"
    
    # Remove the patch
    rm "$PATCHES"
else
    echo "❌ Validation failed, patch not committed"
    exit 1
fi
