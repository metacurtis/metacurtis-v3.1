#!/bin/bash
set -e

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/../.." && pwd)
SST_FILE="$ROOT_DIR/sst/canon/v3.5.json"
BACKUP_FILE="$SST_FILE.backup"

copy_back() {
  if [ -f "$BACKUP_FILE" ]; then
    mv "$BACKUP_FILE" "$SST_FILE"
  fi
}

trap copy_back EXIT

echo "Testing SST validation with corrupted data..."
cp "$SST_FILE" "$BACKUP_FILE"

# Test 1: invalid type
echo "\nTest 1: Invalid type (string for particlesPerLetter)"
python3 - "$SST_FILE" <<'PYCODE'
import json, sys
path = sys.argv[1]
with open(path) as f:
    data = json.load(f)
data['visual']['letterGeometry']['genesis']['particlesPerLetter'] = "167"
with open(path, 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
PYCODE

if npm run validate-sst >/dev/null 2>&1; then
  echo "❌ Failed to detect invalid type"
  exit 1
else
  echo "✅ Correctly rejected invalid type"
fi

mv "$BACKUP_FILE" "$SST_FILE"
cp "$SST_FILE" "$BACKUP_FILE"

# Test 2: missing stage
echo "\nTest 2: Missing required stage"
python3 - "$SST_FILE" <<'PYCODE'
import json, sys
path = sys.argv[1]
with open(path) as f:
    data = json.load(f)
del data['visual']['letterGeometry']['discipline']
with open(path, 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
PYCODE

if npm run validate-sst >/dev/null 2>&1; then
  echo "❌ Failed to detect missing stage"
  exit 1
else
  echo "✅ Correctly rejected missing stage"
fi

echo "\n✅ All validation tests passed"
