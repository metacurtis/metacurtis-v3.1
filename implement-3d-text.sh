#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 IMPLEMENTING 3D TEXT FORMATION - FULLY AUTOMATED"
echo "═══════════════════════════════════════════════════════════════"

# Phase 1: Setup
echo -e "\n📁 Phase 1: Setting up fonts..."
mkdir -p public/fonts
curl -s -o public/fonts/helvetiker_bold.typeface.json \
  https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/helvetiker_bold.typeface.json

if [ -f "public/fonts/helvetiker_bold.typeface.json" ]; then
  echo "✅ Font downloaded successfully"
else
  echo "❌ Font download failed"
  exit 1
fi

# Phase 2: Update ConsciousnessEngine.js
echo -e "\n🔧 Phase 2: Updating ConsciousnessEngine.js..."

# Add imports at the top of the file
sed -i '1a\
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";\
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";\
import * as THREE from "three";' src/engine/ConsciousnessEngine.js

# Add font properties to constructor using a Node.js script for complex editing
cat > add-font-support.js << 'EOJS'
const fs = require('fs');
const path = require('path');

const enginePath = path.join('src', 'engine', 'ConsciousnessEngine.js');
let content = fs.readFileSync(enginePath, 'utf8');

// Add properties to constructor
const constructorMatch = content.match(/constructor\(\) {[^}]*}/);
if (constructorMatch) {
  const constructorContent = constructorMatch[0];
  if (!constructorContent.includes('this.font = null')) {
    const newConstructor = constructorContent.replace(
      /constructor\(\) {/,
      `constructor() {
    // 3D Text support
    this.font = null;
    this.text3DCache = new Map();
    this.text2DFallback = true;
    this.loadFont();`
    );
    content = content.replace(constructorMatch[0], newConstructor);
  }
}

// Add loadFont method if it doesn't exist
if (!content.includes('async loadFont()')) {
  const loadFontMethod = `
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
  
  // Add before the closing brace of the class
  content = content.replace(/^}$/m, loadFontMethod + '\n}');
}

fs.writeFileSync(enginePath, content);
console.log('✅ ConsciousnessEngine updated with 3D text support');
EOJS

node add-font-support.js
rm add-font-support.js

# Phase 3: Update buildBlueprint to use text instead of brain
echo -e "\n🔄 Phase 3: Replacing brain positions with text..."

cat > replace-brain-with-text.js << 'EOJS'
const fs = require('fs');
const path = require('path');

const enginePath = path.join('src', 'engine', 'ConsciousnessEngine.js');
let content = fs.readFileSync(enginePath, 'utf8');

// Add stage texts
const stageTexts = `
    const STAGE_TEXTS = {
      genesis: 'HELLO CURTIS',
      discipline: 'STRUCTURE', 
      neural: 'AWAKENING',
      velocity: 'VELOCITY',
      architecture: 'SYSTEMS',
      harmony: 'FLOW STATE',
      transcendence: 'CONSCIOUSNESS'
    };`;

// Replace brain position generation with text
content = content.replace(
  /generateBrainRegionPositions|generateAllenAtlasPositions/g,
  'generate3DTextFormation'
);

// Update buildBlueprint method
if (!content.includes('STAGE_TEXTS')) {
  content = content.replace(
    /buildBlueprint\([^{]*{/,
    match => match + stageTexts
  );
}

// Replace brain position calls
content = content.replace(
  /this\.generate.*Positions\(.*?\)/g,
  'this.generate3DTextFormation(STAGE_TEXTS[stageName] || stageName.toUpperCase(), particleCount)'
);

fs.writeFileSync(enginePath, content);
console.log('✅ Brain positions replaced with text formations');
EOJS

node replace-brain-with-text.js
rm replace-brain-with-text.js

# Phase 4: Update WebGLBackground shaders
echo -e "\n🎨 Phase 4: Updating shaders..."

# Update vertex shader attribute names
find src -name "*.glsl" -o -name "*.jsx" | xargs sed -i \
  -e 's/allenAtlasPosition/text3DPosition/g' \
  -e 's/brainPosition/text3DPosition/g'

# Update WebGLBackground.jsx
sed -i 's/allenAtlasPosition/text3DPosition/g' src/components/webgl/WebGLBackground.jsx
sed -i 's/brainPosition/text3DPosition/g' src/components/webgl/WebGLBackground.jsx

echo "✅ Shaders updated for text positions"

# Phase 5: Test build
echo -e "\n🧪 Phase 5: Testing build..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful! 3D text implementation complete."
else
  echo "❌ Build failed. Check errors above."
fi

echo -e "\n═══════════════════════════════════════════════════════════════"
echo "📊 IMPLEMENTATION COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Check console for: '✅ 3D font loaded'"
echo "3. Navigate stages to see text formations"

