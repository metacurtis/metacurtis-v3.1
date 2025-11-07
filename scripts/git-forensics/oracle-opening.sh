#!/usr/bin/env bash
# Git bisect oracle for opening sequence validation
# Exit codes: 0=GOOD, 1=BAD, 125=SKIP

set -euo pipefail

# Suppress output unless there's an error
exec 3>&1 4>&2
exec 1>/dev/null 2>&1

log() {
  echo "$@" >&3
}

error() {
  echo "ERROR: $@" >&4
  exit 1
}

# Install dependencies (might have changed between commits)
log "Installing dependencies..."
if ! npm install; then
  log "Cannot build, skipping commit"
  exit 125
fi

# Layer 1: Constitutional validation
log "Layer 1: Constitutional..."
if ! npm run validate-sst; then
  log "SST validation failed"
  exit 1
fi

if ! npm run detect-drift; then
  log "Drift detected"
  exit 1
fi

# Layer 2: Contract validation
log "Layer 2: Contracts..."
if ! npm run validate:opening; then
  log "Opening validation failed"
  exit 1
fi

# Fencepost check (if ci:fencepost exists)
if npm run ci:fencepost 2>/dev/null; then
  log "Fencepost check passed"
else
  # Only fail if the script exists
  if grep -q "ci:fencepost" package.json; then
    log "Fencepost check failed"
    exit 1
  fi
fi

log "All checks passed - commit is GOOD"
exit 0
