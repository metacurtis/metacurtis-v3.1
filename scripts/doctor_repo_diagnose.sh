#!/usr/bin/env bash
set -euo pipefail

TS="$(date -Iseconds | sed 's/:/-/g')"
OUT="/tmp/repo-diagnostic-${TS}.log"

echo "=== REPO DIAGNOSTIC @ ${TS} ===" | tee "$OUT"
echo "" | tee -a "$OUT"

echo "PWD: $(pwd)" | tee -a "$OUT"
echo "TOP: $(git rev-parse --show-toplevel)" | tee -a "$OUT"
echo "" | tee -a "$OUT"

echo "== HEAD ==" | tee -a "$OUT"
git show -s --format='%h %ci %d %s' | tee -a "$OUT"
echo "" | tee -a "$OUT"

echo "== BRANCH / REMOTES ==" | tee -a "$OUT"
git branch --show-current | sed 's/^/branch: /' | tee -a "$OUT"
git remote -v | tee -a "$OUT"
echo "" | tee -a "$OUT"

echo "== QUICK STATUS ==" | tee -a "$OUT"
git status -sb | tee -a "$OUT"
echo "" | tee -a "$OUT"

echo "== FETCH TAGS (non-fatal) ==" | tee -a "$OUT"
git fetch --tags --prune 2>/dev/null || true
echo "" | tee -a "$OUT"

echo "== TAGS (top 40) ==" | tee -a "$OUT"
git tag --sort=-creatordate | head -n 40 | tee -a "$OUT"
echo "" | tee -a "$OUT"

echo "== DOCTOR TAGS ==" | tee -a "$OUT"
git tag -l "doctor_*" --sort=-creatordate | tee -a "$OUT"
echo "" | tee -a "$OUT"

echo "== LAST 30 COMMITS (decorated) ==" | tee -a "$OUT"
git --no-pager log -n 30 --pretty=format:'%C(yellow)%h%Creset %Cgreen(%ad)%Creset %C(bold blue)%d%Creset %s %C(cyan)- %an' --date=iso | tee -a "$OUT"
echo "" | tee -a "$OUT"

echo "== REFLOG (last 30) ==" | tee -a "$OUT"
git reflog -n 30 --date=iso | tee -a "$OUT"
echo "" | tee -a "$OUT"

echo "== EXPECTED PATHS PRESENCE ==" | tee -a "$OUT"
paths=(
  "canon-console"
  "console"
  "src/canon-guard"
  "src/dev/renderHealthcheck.js"
  "src/engine/ConsciousnessEngine.js"
  "src/state/StateController.js"
  "src/modules/orchestration/core/BeatBusAdapter.js"
  "scripts"
  "snapshots"
)
for p in "${paths[@]}"; do
  if [ -e "$p" ]; then
    echo "present: $p" | tee -a "$OUT"
  else
    echo "missing: $p" | tee -a "$OUT"
  fi
done
echo "" | tee -a "$OUT"

echo "== IF MISSING, WHERE DID THEY LAST EXIST? ==" | tee -a "$OUT"
for p in "${paths[@]}"; do
  if [ ! -e "$p" ]; then
    echo "-- $p" | tee -a "$OUT"
    git rev-list -n 1 --all -- "$p" 2>/dev/null | tee -a "$OUT" || true
    git log --all --oneline -- "$p" | head -n 5 | tee -a "$OUT" || true
    echo "" | tee -a "$OUT"
  fi
done

echo "== FILE COUNTS (sanity) ==" | tee -a "$OUT"
echo "js/ts sources:" | tee -a "$OUT"
git ls-files | egrep '\.(js|jsx|ts|tsx|glsl)$' | wc -l | tee -a "$OUT"
echo "doctor scripts:" | tee -a "$OUT"
git ls-files "scripts/*.cjs" | wc -l | tee -a "$OUT"
echo "" | tee -a "$OUT"

echo "== SHOW-REF TAGS (full) ==" | tee -a "$OUT"
git show-ref --tags | tail -n 50 | tee -a "$OUT"
echo "" | tee -a "$OUT"

echo "DONE. Saved to $OUT" | tee -a "$OUT"
