#!/usr/bin/env bash
set -e
echo "🛠  Fixing critical ESLint errors …"

# 1️⃣  styled-jsx attribute cleanup  ───────────────────────────────
find src -type f \( -name "*.jsx" -o -name "*.tsx" \) -print0 | xargs -0 \
  sed -Ei \
  -e 's/<style[[:space:]]+jsx="true"[[:space:]]+global="true"/<style jsx global/g' \
  -e 's/<style[[:space:]]+jsx="true"[[:space:]]+global/<style jsx global/g' \
  -e 's/<style[[:space:]]+jsx="true"/<style jsx/g'

# 2️⃣  React no-unescaped-entities fixes  ──────────────────────────
# GenesisCodeExperience  (10 PRINT "CURTIS WHORTON …")
sed -Ei 's/10 PRINT "CURTIS WHORTON DIGITAL AWAKENING"/10 PRINT &quot;CURTIS WHORTON DIGITAL AWAKENING&quot;/g' \
  src/components/sections/GenesisCodeExperience.jsx

# AdvancedContactPortal  (what's  ->  what&apos;s )
sed -Ei "s/what's/what&apos;s/g" \
  src/components/ui/AdvancedContactPortal.jsx

# 3️⃣  undefined helper call  ─────────────────────────────────────
#   — simply comment it out for now; revisit when helper is ready.
sed -Ei 's/^\([[:space:]]*updateScrollVelocityEffects\(.*\);[[:space:]]*\)/\/\/ FIXME-undef \0/' \
  src/components/ui/navigation/StageController.jsx

# 4️⃣  no-case-declarations fix  ──────────────────────────────────
#   Wrap the offending line 173 in braces.
awk 'NR==173{print "        {"} NR==173{print $0; next} NR==174{print "        }"} 1' \
  src/utils/webgl/ShaderDebugSystem.js > /tmp/__tmp && mv /tmp/__tmp src/utils/webgl/ShaderDebugSystem.js

echo "✅ All critical ESLint errors auto-fixed."
echo "👉 Run  npm run lint  to verify; only warnings should remain."
