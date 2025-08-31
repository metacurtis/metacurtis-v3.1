#!/usr/bin/env bash
set -euo pipefail

WEBGL="src/components/webgl/WebGLBackground.jsx"
[ -f "$WEBGL" ] || { echo "❌ $WEBGL not found"; exit 1; }

# 1) After materialRef.current = mat; expose globals (idempotent)
if ! grep -q "HOTDORS EXPOSE MATERIAL" "$WEBGL"; then
  awk '
    {print}
    /materialRef\.current[[:space:]]*=[[:space:]]*mat[[:space:]]*;/ && !seen++ {
      print "    // HOTDORS EXPOSE MATERIAL"
      print "    if (typeof window !== \"undefined\") {"
      print "      window.__webglBackground = window.__webglBackground || {};"
      print "      window.__webglBackground.material = mat;"
      print "      window.__webglBackground.materialRef = materialRef;"
      print "      window.__consciousnessMaterial = mat;"
      print "    }"
    }
  ' "$WEBGL" > "$WEBGL.tmp" && mv "$WEBGL.tmp" "$WEBGL"
  echo "✅ Exposed material globals"
else
  echo "⚠️  Material globals already exposed"
fi

# 2) Before returning the geometry in useMemo, expose geometry (idempotent)
if ! grep -q "HOTDORS EXPOSE GEOMETRY" "$WEBGL"; then
  awk '
    /return[[:space:]]+geo[[:space:]]*;/ && !gseen++ {
      print "    // HOTDORS EXPOSE GEOMETRY"
      print "    if (typeof window !== \"undefined\") {"
      print "      window.__webglBackground = window.__webglBackground || {};"
      print "      window.__webglBackground.geometry = geo;"
      print "      window.__particleGeometry = geo;"
      print "    }"
    }
    {print}
  ' "$WEBGL" > "$WEBGL.tmp" && mv "$WEBGL.tmp" "$WEBGL"
  echo "✅ Exposed geometry globals"
else
  echo "⚠️  Geometry globals already exposed"
fi

# 3) In the JSX <points ... />, also stash the mesh ref each render (idempotent)
if ! grep -q "HOTDORS EXPOSE MESHREF" "$WEBGL"; then
  awk '
    {print}
    /<points/ && !mseen++ {
      print "      {/* HOTDORS EXPOSE MESHREF */}"
      print "      ref={(n)=>{"
      print "        if(!n) return;"
      print "        if (typeof window !== \"undefined\") {"
      print "          window.__webglBackground = window.__webglBackground || {};"
      print "          window.__webglBackground.mesh = n;"
      print "        }"
      print "        meshRef.current = n;"
      print "      }}"
    }
  ' "$WEBGL" > "$WEBGL.tmp" && mv "$WEBGL.tmp" "$WEBGL"
  echo "✅ Exposed mesh ref"
else
  echo "⚠️  Mesh ref already exposed"
fi

# 4) Add a tiny console helper at the bottom of the file (idempotent)
if ! grep -q "HOTDORS CHECKER" "$WEBGL"; then
  cat >> "$WEBGL" <<'JS'

// HOTDORS CHECKER
if (typeof window !== "undefined" && !window.checkRenderGlobals) {
  window.checkRenderGlobals = function(){
    try{
      const mat = window.__consciousnessMaterial;
      const geo = window.__particleGeometry;
      const bg  = window.__webglBackground;
      const u   = mat?.uniforms;
      const pos = geo?.getAttribute?.("position");
      const atmos = geo?.getAttribute?.("atmosphericPosition");
      const text  = geo?.getAttribute?.("text3DPosition") || geo?.getAttribute?.("allenAtlasPosition");
      console.group("[HotDors] Render globals");
      console.log("material:", !!mat, "uniforms:", !!u);
      console.log("geometry:", !!geo, "posCount:", pos?.count || 0);
      console.log("attrs:", { atmos: !!atmos, text: !!text, allenAlias: !!geo?.getAttribute?.("allenAtlasPosition") });
      console.log("uniforms:", u ? Object.keys(u) : "(none)");
      console.log("webglBackground keys:", bg ? Object.keys(bg) : "(none)");
      console.groupEnd();
      return { mat, geo, u, posCount: pos?.count||0, hasAtmos:!!atmos, hasText:!!text };
    }catch(e){ console.error(e); }
  }
}
JS
  echo "✅ Added checkRenderGlobals()"
else
  echo "⚠️  checkRenderGlobals() already present"
fi

echo "🎯 Done. Restart dev server and reload the scene route."
