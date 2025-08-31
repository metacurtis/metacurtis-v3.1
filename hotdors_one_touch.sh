#!/usr/bin/env bash
set -euo pipefail

ok(){ printf "✅ %s\n" "$*"; }
warn(){ printf "⚠️  %s\n" "$*"; }
err(){ printf "❌ %s\n" "$*"; }

# --- preflight ---------------------------------------------------------------
[ -d .git ] || { err "Not a git repo"; exit 1; }

BR="hotdors/one-touch-visuals"
if git rev-parse --verify -q "$BR" >/dev/null; then
  git switch "$BR" >/dev/null
else
  git switch -c "$BR" >/dev/null
fi

WEBGL="src/components/webgl/WebGLBackground.jsx"
APP=""
for f in src/main.jsx src/main.tsx src/App.jsx src/App.tsx; do
  [ -f "$f" ] && APP="$f" && break
done

[ -f "$WEBGL" ] || warn "Missing $WEBGL (will skip visual patch)"
[ -n "${APP}" ]  || warn "No App/main entry found (will skip console+slider)"

# --- patch: WebGLBackground.jsx (visuals) ------------------------------------
if [ -f "$WEBGL" ]; then
  tmp="$(mktemp)"; did=0

  # 1) Insert helpers after the THREE import (idempotent)
  if ! grep -q "HOTDORS helpers" "$WEBGL"; then
    awk '
      BEGIN{added=0}
      {
        print
        if ($0 ~ /import[[:space:]]+\* as THREE from/) {
          if (!added) {
            print ""
            print "// HOTDORS helpers"
            print "function __hotdorsFitCamera(camera, arr, padding = 1.12) {"
            print "  try {"
            print "    if (!camera || !arr || !arr.length) return;"
            print "    let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;"
            print "    for (let i=0;i<arr.length;i+=3){const x=arr[i],y=arr[i+1],z=arr[i+2];"
            print "      if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; if(z<minZ)minZ=z; if(z>maxZ)maxZ=z;}"
            print "    const cx=(minX+maxX)/2, cy=(minY+maxY)/2, cz=(minZ+maxZ)/2;"
            print "    const R=Math.max(maxX-minX,maxY-minY,maxZ-minZ)*0.5||1;"
            print "    const vfov=(camera.fov*Math.PI)/180;"
            print "    const dist=(R/Math.tan(vfov/2))*padding;"
            print "    camera.position.set(cx,cy,cz+dist);"
            print "    camera.lookAt(cx,cy,cz);"
            print "    camera.updateProjectionMatrix();"
            print "  } catch {}"
            print "}"
            print "function __hotdorsEnsurePointSize(mat, gl, size){"
            print "  try{"
            print "    if(!mat||!mat.uniforms||!mat.uniforms.uPointSize) return;"
            print "    let cap=48; try{const ctx=gl?.getContext?.(); const r=ctx?.getParameter(ctx.ALIASED_POINT_SIZE_RANGE); if(r&&r.length) cap=Math.min(64,r[1]*0.85);}catch{}"
            print "    const base=cap; const w=size?.width||1280; const factor=Math.pow(w/1280,0.25);"
            print "    const val=Math.max(10, Math.min(base, base*factor));"
            print "    mat.uniforms.uPointSize.value=val; mat.uniformsNeedUpdate=true;"
            print "  }catch{}"
            print "}"
            print "// HOTDORS helpers end"
            added=1
          }
        }
      }
    ' "$WEBGL" > "$tmp" && mv "$tmp" "$WEBGL"
    ok "Inserted helpers"
    did=1
  else
    warn "Helpers already present"
  fi

  # 2) Ensure aliasing between text3DPosition and allenAtlasPosition (both directions), idempotent
  if ! grep -q "HOTDORS alias" "$WEBGL"; then
    awk '
      {
        print $0
        # When we set text3DPosition, also set allenAtlasPosition
        if ($0 ~ /geo\.setAttribute\((["'\''])text3DPosition\1/) {
          line = $0
          gsub(/text3DPosition/,"allenAtlasPosition", line)
          print line " // HOTDORS alias"
        }
        # When we set allenAtlasPosition but not text, add a text alias once
        if ($0 ~ /geo\.setAttribute\((["'\''])allenAtlasPosition\1/ && !seen_inv) {
          line = $0
          gsub(/allenAtlasPosition/,"text3DPosition", line)
          print line " // HOTDORS alias (invert)"
          seen_inv=1
        }
      }
    ' "$WEBGL" > "$tmp" && mv "$tmp" "$WEBGL"
    ok "Added attribute aliases"
    did=1
  else
    warn "Attribute aliases already present"
  fi

  # 3) After first geo.setDrawRange(...), add camera fit + scale + point size (idempotent)
  if ! grep -q "HOTDORS fit\\+scale" "$WEBGL"; then
    awk '
      BEGIN{flag=0}
      {
        print
        if ($0 ~ /geo\.setDrawRange\(/ && !flag) {
          print "        // HOTDORS fit+scale"
          print "        try {"
          print "          const attr = geometryRef.current?.getAttribute?.(\"text3DPosition\") || geometryRef.current?.getAttribute?.(\"allenAtlasPosition\");"
          print "          const arr = attr ? attr.array : null;"
          print "          __hotdorsFitCamera(camera, arr, 1.12);"
          print "          if (meshRef.current) meshRef.current.scale.set(1.6,1.6,1.6);"
          print "          __hotdorsEnsurePointSize(materialRef.current, gl, size);"
          print "        } catch {}"
          print "        // HOTDORS fit+scale end"
          flag=1
        }
      }
    ' "$WEBGL" > "$tmp" && mv "$tmp" "$WEBGL"
    ok "Inserted fit+scale & point-size hook"
    did=1
  else
    warn "fit+scale already present"
  fi

  [ $did -eq 1 ] || warn "No visual edits needed in $WEBGL"
fi

# --- patch: App/main entry (console uncloaker + micro slider) ----------------
if [ -n "$APP" ]; then
  if ! grep -q "HOTDORS UNMUTE\\+SLIDER" "$APP"; then
    cat >> "$APP" <<'JS'

// HOTDORS UNMUTE+SLIDER (dev-only, idempotent)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (function(){
    if (window.__HOTDORS_UNMUTE__) return; window.__HOTDORS_UNMUTE__=true;

    // Unmute Canon/console and surface real errors
    try { const C=window.Canonical||{}; if (C.flags) C.flags.consoleMuted=false; } catch {}
    ;['log','info','warn','error','debug'].forEach(k=>{ if(typeof console[k]!=='function'){ console[k]=function(){} }});
    window.addEventListener('error', e => console.error('[page error]', e.message||e.error||e));
    window.addEventListener('unhandledrejection', e => console.error('[unhandled]', e.reason));

    // Tiny Morph slider (no React import)
    if (!document.getElementById('hotdors-morph')) {
      const box=document.createElement('div'); box.id='hotdors-morph';
      Object.assign(box.style,{position:'fixed',left:'12px',bottom:'12px',zIndex:10000,background:'rgba(0,0,0,.45)',color:'#9EFADF',padding:'8px 10px',borderRadius:'8px',font:'12px/16px ui-monospace, SFMono-Regular, Menlo, monospace',backdropFilter:'blur(6px)'});
      const label=document.createElement('span'); label.textContent='Morph'; label.style.marginRight='8px';
      const input=document.createElement('input'); input.type='range'; input.min='0'; input.max='1'; input.step='0.01'; input.value='0';
      const val=document.createElement('span'); val.style.marginLeft='8px'; val.textContent='0.00';
      const setMorph=(v)=>{ val.textContent=v.toFixed(2);
        try{ const m=window.__consciousnessMaterial; const u=m?.uniforms; const key=u?.uMorphProgress?'uMorphProgress':(u?.morphProgress?'morphProgress':null); if(key){ u[key].value=v; m.uniformsNeedUpdate=true; } }catch{}
        try{ window.BeatBus?.emit?.(window.EVENTS?.MORPH_PROGRESS||'MORPH_PROGRESS',{value:v}); }catch{}
      };
      input.addEventListener('input', e => setMorph(parseFloat(e.target.value)));
      box.appendChild(label); box.appendChild(input); box.appendChild(val);
      document.body.appendChild(box);
    }
  })();
}
JS
    ok "Added console uncloaker + micro slider to $APP"
  else
    warn "Console uncloaker/slider already in $APP"
  fi
fi

# --- commit ------------------------------------------------------------------
git add -A
git commit -m "HotDors one-touch: unmute console + fix visual path (text target alias, camera fit, point-size, morph slider)" >/dev/null || true

echo
ok "HotDors complete."
echo "   • Dev server: npm run dev"
echo "   • You should see a small 'Morph' slider (bottom-left)."
echo "   • Errors will surface via console even if Canon muted them."
echo
echo "Rollback:"
echo "   git switch -"
echo "   git branch -D $BR"
