#!/usr/bin/env bash
set -euo pipefail
WEBGL="src/components/webgl/WebGLBackground.jsx"
[ -f "$WEBGL" ] || { echo "❌ $WEBGL not found"; exit 1; }
cp "$WEBGL" "$WEBGL.bak.hotdors"

# 1) Drop the problematic inline comment
awk '
  { if ($0 ~ /\{\/\* HOTDORS EXPOSE MESHREF \*\/\}/) next; else print }
' "$WEBGL" > "$WEBGL.tmp" && mv "$WEBGL.tmp" "$WEBGL"

# 2) If we injected a second ref={(n)=>{...}}, replace that whole block with ref={meshRef}
awk '
  BEGIN{skip=0}
  {
    if (skip==0) {
      if ($0 ~ /ref=\{\(n\)=>\{/) {
        print "      ref={meshRef}"
        skip=1
      } else {
        print
      }
    } else {
      if ($0 ~ /\}\}/) { skip=0 }
      # skip inner lines until we see the closing "}}"
    }
  }
' "$WEBGL" > "$WEBGL.tmp" && mv "$WEBGL.tmp" "$WEBGL"

echo "✅ Fixed JSX around <points>. A backup is at $WEBGL.bak.hotdors"
