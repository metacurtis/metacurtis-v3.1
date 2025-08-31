#!/usr/bin/env bash
set -euo pipefail
BR="hotdors/purge-allen"
git rev-parse --verify -q "$BR" >/dev/null && git switch "$BR" || git switch -c "$BR"

prune_dirs=(-name node_modules -o -name snapshots -o -name .fix-backups -o -name .migration_backups -o -name patches -o -name dist -o -name build)

# Find source files only
files=$(find src \
  -type d \( "${prune_dirs[@]}" \) -prune -false -o \
  -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.glsl" \))

# Rename allenAtlasPositions -> text3DPositions, and allenAtlasPosition -> text3DPosition
for f in $files; do
  perl -0777 -pe 's/\ballenAtlasPositions\b/text3DPositions/g; s/\ballenAtlasPosition\b/text3DPosition/g' -i "$f"
done

git add -A
git commit -m "Purge: allenAtlasPosition(s) → text3DPosition(s) across src (keep runtime alias for safety)" || true
echo "✅ Purge complete. Review: git diff --stat && npm run dev"
