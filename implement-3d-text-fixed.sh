#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 IMPLEMENTING 3D TEXT FORMATION - FIXED VERSION"
echo "═══════════════════════════════════════════════════════════════"

# Phase 1 already worked, skip if font exists
if [ ! -f "public/fonts/helvetiker_bold.typeface.json" ]; then
  echo "📁 Phase 1: Setting up fonts..."
  mkdir -p public/fonts
  curl -s -o public/fonts/helvetiker_bold.typeface.json \
    https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/helvetiker_bold.typeface.json
  echo "✅ Font downloaded"
else
  echo "✅ Font already exists"
fi

# Phase 2: Update ConsciousnessEngine.js with sed commands
echo "🔧 Phase 2: Updating ConsciousnessEngine.js..."

# Add imports if not already present
if ! grep -q "FontLoader" src/engine/ConsciousnessEngine.js; then
  sed -i '1a\
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";\
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";\
import * as THREE from "three";' src/engine/ConsciousnessEngine.js
fi

# Create a CommonJS script for complex edits
cat > add-font-support.cjs << 'EOJS'
const fs = require('fs');
const path = require('path');

const enginePath = path.join('src', 'engine', 'ConsciousnessEngine.js');
let content = fs.readFileSync(enginePath, 'utf8');

// Add font properties to constructor
if (!content.includes('this.font = null')) {
  content = content.replace(
    /constructor\(\) {/,
    `constructor() {
    // 3D Text support
    this.font = null;
    this.text3DCache = new Map();
    this.text2DFallback = true;
    this.loadFont();`
  );
}

// Add methods if they don't exist
if (!content.includes('async loadFont()')) {
  const methods = `
  async loadFont() {
    try {
      const loader = new FontLoader();
      const fontUrls = [
        '/fonts/helvetiker_bold.typeface.json',
        'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json'
      ];
      
      for (const url of fontUrls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const fontData = await response.json();
            this.font = loader.parse(fontData);
            this.text2DFallback = false;
            console.log('✅ 3D font loaded from:', url);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!this.font) {
        console.warn('📝 Using 2D text fallback');
      }
    } catch (e) {
      console.warn('Font loading failed:', e);
    }
  }

  generate3DTextFormation(text, count) {
    const cacheKey = \`\${text}_\${count}\`;
    if (this.text3DCache.has(cacheKey)) {
      return this.text3DCache.get(cacheKey);
    }

    if (!this.font || this.text2DFallback) {
      return this.buildTextPositions ? this.buildTextPositions(text, count) : new Float32Array(count * 3);
    }

    const geometry = new TextGeometry(text, {
      font: this.font,
      size: 3,
      height: 1.2,
      curveSegments: 4,
      bevelEnabled: false
    });
    
    geometry.computeBoundingBox();
    geometry.center();
    
    const positions = [];
    const posAttr = geometry.attributes.position;
    
    for (let i = 0; i < posAttr.count && positions.length < count * 3; i++) {
      positions.push(
        posAttr.getX(i),
        posAttr.getY(i),
        posAttr.getZ(i)
      );
    }
    
    const bbox = geometry.boundingBox;
    const volumeNeeded = count - positions.length / 3;
    
    if (volumeNeeded > 0) {
      const step = Math.cbrt(
        (bbox.max.x - bbox.min.x) *
        (bbox.max.y - bbox.min.y) * 
        (bbox.max.z - bbox.min.z) / volumeNeeded
      );
      
      for (let x = bbox.min.x; x <= bbox.max.x && positions.length < count * 3; x += step) {
        for (let y = bbox.min.y; y <= bbox.max.y && positions.length < count * 3; y += step) {
          for (let z = bbox.min.z; z <= bbox.max.z && positions.length < count * 3; z += step) {
            positions.push(
              x + (Math.random() - 0.5) * step * 0.8,
              y + (Math.random() - 0.5) * step * 0.8,
              z + (Math.random() - 0.5) * step * 0.8
            );
          }
        }
      }
    }
    
    const result = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      result[i] = positions[i] || ((Math.random() - 0.5) * 10);
    }
    
    geometry.dispose();
    this.text3DCache.set(cacheKey, result);
    return result;
  }`;
  
  // Find the last method and add these after it
  const lastMethodRegex = /^\s{2}\w+\([^)]*\)\s*{[^}]*}\n/gm;
  const matches = [...content.matchAll(lastMethodRegex)];
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const insertPos = lastMatch.index + lastMatch[0].length;
    content = content.slice(0, insertPos) + methods + '\n' + content.slice(insertPos);
  }
}

fs.writeFileSync(enginePath, content);
console.log('✅ ConsciousnessEngine updated');
EOJS

node add-font-support.cjs
rm add-font-support.cjs

# Phase 3: Add stage texts
echo "🔄 Phase 3: Adding stage text definitions..."

# Add STAGE_TEXTS if not present
if ! grep -q "STAGE_TEXTS" src/engine/ConsciousnessEngine.js; then
  sed -i '/buildBlueprint.*{/a\
    const STAGE_TEXTS = {\
      genesis: "HELLO CURTIS",\
      discipline: "STRUCTURE",\
      neural: "AWAKENING",\
      velocity: "VELOCITY",\
      architecture: "SYSTEMS",\
      harmony: "FLOW STATE",\
      transcendence: "CONSCIOUSNESS"\
    };' src/engine/ConsciousnessEngine.js
fi

# Replace brain position calls with text
sed -i 's/generateBrainRegionPositions/generate3DTextFormation/g' src/engine/ConsciousnessEngine.js
sed -i 's/generateAllenAtlasPositions/generate3DTextFormation/g' src/engine/ConsciousnessEngine.js

# Phase 4: Update shaders
echo "🎨 Phase 4: Updating shaders..."

# Update all shader references
find src -type f \( -name "*.glsl" -o -name "*.jsx" -o -name "*.js" \) -exec sed -i \
  -e 's/allenAtlasPosition/text3DPosition/g' \
  -e 's/brainPosition/text3DPosition/g' {} \;

echo "✅ All components updated"

# Test build
echo "🧪 Testing build..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
else
  echo "⚠️ Build failed - check errors"
fi

echo "═══════════════════════════════════════════════════════════════"
echo "📊 3D TEXT IMPLEMENTATION COMPLETE"
echo "Run: npm run dev"
echo "Check console for: '✅ 3D font loaded'"
echo "═══════════════════════════════════════════════════════════════"

