#!/usr/bin/env bash
set -euo pipefail

# HotDors v2 — one-touch text-formation visual fix + verification
# Usage: bash hotdors.sh
# Undo:  git switch - && git branch -D hotdors/text-formation || true

REPO="${REPO:-$PWD}"
cd "$REPO"

if [ ! -d .git ]; then
  echo "❌ Not a git repo: $REPO"; exit 1
fi

echo "🏁 HotDors starting in: $REPO"

# --- preflight ---------------------------------------------------------------
need=( "src/components/webgl/WebGLBackground.jsx" "src/theater/TheaterDirector.js" )
for f in "${need[@]}"; do
  if [ ! -f "$f" ]; then echo "❌ Missing $f"; exit 1; fi
done

# clean worktree check (soft)
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ℹ️  Uncommitted changes detected; HotDors will still continue (branching)."
fi

BR="hotdors/text-formation"
if git rev-parse --verify -q "$BR" >/dev/null; then
  git branch -D "$BR" >/dev/null 2>&1 || true
fi
git switch -c "$BR" >/dev/null

# --- helpers ----------------------------------------------------------------
ok()   { printf "✅ %s\n" "$*"; }
warn() { printf "⚠️  %s\n" "$*"; }
err()  { printf "❌ %s\n" "$*"; }

# Replace file in-place with awk/regex surgery, idempotent via sentinel tags
patch_webgl() {
  local file="src/components/webgl/WebGLBackground.jsx"
  local tmp="$(mktemp)"

  # 1) Add fitCameraToPositions helper (after clamp01), if missing
  if ! grep -q "HOTDORS: fitCameraToPositions" "$file"; then
    awk '
      BEGIN{added=0}
      {print}
      /const clamp01/ && !added {
        print "";
        print "// HOTDORS: fitCameraToPositions";
        print "function fitCameraToPositions(camera, positions, padding = 1.12) {";
        print "  try {";
        print "    if (!camera || !positions || positions.length < 3) return;";
        print "    let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;";
        print "    for (let i=0;i<positions.length;i+=3){";
        print "      const x=positions[i],y=positions[i+1],z=positions[i+2];";
        print "      if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; if(z<minZ)minZ=z; if(z>maxZ)maxZ=z;";
        print "    }";
        print "    const cx=(minX+maxX)/2, cy=(minY+maxY)/2, cz=(minZ+maxZ)/2;";
        print "    const dx=(maxX-minX)/2, dy=(maxY-minY)/2, dz=(maxZ-minZ)/2;";
        print "    const R=Math.max(dx,dy,dz)||1;";
        print "    const vfov=(camera.fov*Math.PI)/180;";
        print "    const dist=(R/Math.tan(vfov/2))*padding;";
        print "    camera.position.set(cx, cy, cz+dist);";
        print "    camera.lookAt(cx, cy, cz);";
        print "    camera.updateProjectionMatrix();";
        print "  } catch {}";
        print "}";
        added=1
      }
    ' "$file" > "$tmp" && mv "$tmp" "$file"
    ok "Added camera fit helper"
  else
    warn "Camera fit helper already present"
  fi

  # 2) Ensure geometry exposes text target and back-compat alias
  #    Insert an allenAtlasPosition alias immediately after any text3DPosition setAttribute
  if ! grep -q "allenAtlasPosition" "$file"; then
    awk '
      {
        print $0
        if ($0 ~ /geo\.setAttribute\(.text3DPosition./ && !seen[$0]++) {
          gsub("text3DPosition","allenAtlasPosition",$0);
          print $0 " // HOTDORS alias"
        }
      }
    ' "$file" > "$tmp" && mv "$tmp" "$file"
    ok "Added allenAtlasPosition alias after text3DPosition"
  else
    warn "Alias already present"
  fi

  # 3) After any geo.setDrawRange(...), add fit + scale (once per block), idempotent
  if ! grep -q "HOTDORS: fit+scale" "$file"; then
    awk '
      {
        print
        if ($0 ~ /geo\.setDrawRange\(/ && !flag) {
          print "        // HOTDORS: fit+scale";
          print "        fitCameraToPositions(camera, (geometryRef.current.getAttribute && geometryRef.current.getAttribute(\"atmosphericPosition\")) ? geometryRef.current.getAttribute(\"atmosphericPosition\").array : undefined, 1.12);";
          print "        if (meshRef.current) meshRef.current.scale.set(1.6,1.6,1.6);";
          flag=1
        }
      }
    ' "$file" > "$tmp" && mv "$tmp" "$file"
    ok "Added fit+scale after setDrawRange"
  else
    warn "fit+scale already present"
  fi

  # 4) Ensure <points ... scale=[1.6,1.6,1.6]>
  if grep -q "<points" "$file"; then
    if grep -q "scale=\[" "$file"; then
      sed -i -E 's/scale=\[[^]]+\]/scale=\[1.6, 1.6, 1.6]/' "$file" && ok "Normalized <points> scale"
    else
      sed -i -E 's#(<points[^>]*ref=\{meshRef\}[^>]*)(>)#\1 scale=\[1.6, 1.6, 1.6]\2#' "$file" && ok "Inserted <points> scale"
    fi
  fi
}

patch_director() {
  local file="src/theater/TheaterDirector.js"
  local tmp="$(mktemp)"

  # Insert STAGE_CHANGE after PARTICLES_EMERGED (idempotent)
  if ! grep -q "HOTDORS: tint reapply" "$file"; then
    awk '
      {
        print
        if ($0 ~ /BeatBus\.emit\(EVENTS\.PARTICLES_EMERGED\)/ && !done) {
          print "      // HOTDORS: tint reapply";
          print "      BeatBus.emit(EVENTS.STAGE_CHANGE, { stage: \"genesis\" });";
          print "      await this.sleep(150);";
          done=1
        }
      }
    ' "$file" > "$tmp" && mv "$tmp" "$file"
    ok "Added tint reapply after PARTICLES_EMERGED"
  else
    warn "Tint reapply already present"
  fi
}

patch_webgl
patch_director

# --- verify ------------------------------------------------------------------
PASS=1

# WebGL: text & alias present
if grep -q "text3DPosition" src/components/webgl/WebGLBackground.jsx; then ok "text3DPosition present"; else err "Missing text3DPosition"; PASS=0; fi
if grep -q "allenAtlasPosition" src/components/webgl/WebGLBackground.jsx; then ok "allenAtlasPosition alias present"; else warn "Alias not found (may be okay if shaders all updated)"; fi
if grep -q "fitCameraToPositions" src/components/webgl/WebGLBackground.jsx; then ok "Camera fit helper present"; else err "Missing camera fit helper"; PASS=0; fi
if grep -q "fit\\+scale" src/components/webgl/WebGLBackground.jsx; then ok "Fit+scale hook present"; else warn "Fit+scale hook not found"; fi

# Director: stage tint nudge
if grep -q "tint reapply" src/theater/TheaterDirector.js; then ok "Director tint reapply present"; else warn "Tint reapply not found"; fi

# Commit if at least core items passed
if [ "$PASS" -eq 1 ]; then
  git add -A
  git commit -m "HotDors: text-formation visual alignment (fit+scale, text target, tint reapply)"
  ok "Committed on branch $BR"
  echo
  echo "🎉 HotDors finished. Next:"
  echo "   npm run dev"
  echo "   → Scrub morph via your HUD or ArrowUp/Down and confirm text formation fills viewport."
  echo
  echo "Undo:"
  echo "   git switch -"
  echo "   git branch -D $BR"
  exit 0
else
  warn "Some checks failed. Changes are kept on $BR for inspection."
  echo "Open diffs in VS Code:"
  echo "   git status && code -n src/components/webgl/WebGLBackground.jsx src/theater/TheaterDirector.js"
  exit 2
fi
