#!/usr/bin/env bash
set -euo pipefail

# HOT-DORS one-touch setup & run
# 1) Write HOT-DORS (paste the full hot-dors.cjs content after EOF)
cat > hot-dors.cjs <<'EOF'
#!/usr/bin/env node
/**
 * HOT-DORS v1.0 — Hermetic One-Touch Doctor + DORS
 * ... all of your JavaScript code ...
 * ... goes right here ...
 */

// ... more of your JavaScript code ...

if(require.main===module) main();
module.exports = { main };
EOF

# 2) Install and run
node hot-dors.cjs --install
npm run hot-dors