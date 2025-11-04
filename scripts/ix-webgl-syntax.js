// scripts/fix-webgl-syntax.js
import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.blue}🔧 Fixing WebGLBackground syntax error...${colors.reset}`);

const bgPath = path.join(process.cwd(), 'src/components/webgl/WebGLBackground.jsx');

// Read the file
let content = fs.readFileSync(bgPath, 'utf8');

// Backup
const backupPath = bgPath + `.bak.syntax-fix-${Date.now()}`;
fs.writeFileSync(backupPath, content);

// Fix the material creation section - find and replace the broken part
const correctMaterialSection = `  // Create material - SIMPLE with Canon Guard protection
  const material = useMemo(() => {
    if (!atlasTexture || !blueprint) return null;

    // Use Canon Guard's material factory with fallback protection
    const { material: mat, variant } = createPointsMaterial({
      gl,
      size,
      atlasTexture,
      uniformsBase: {
        uMorphProgress: { value: morphProgress },
        uScrollProgress: { value: scrollProgress },
        uActiveCount: { value: blueprint.activeCount },
        uStageProgress: { value: morphProgress },  // Alias
        uStageBlend: { value: scrollProgress },     // Alias
        // Pass stage colors from blueprint
        uColorCurrent: { value: blueprint.colorCurrent || new THREE.Color("#00ffcc") },
        uColorNext: { value: blueprint.colorNext || new THREE.Color("#f59e0b") }
      }
    });

    console.log(\`🎨 Material created: \${variant} variant\`);
    return mat;
  }, [atlasTexture, blueprint, gl, size, morphProgress, scrollProgress]);`;

// Find the material creation section and replace it
const materialStartPattern = /\/\/ Create material[\s\S]*?}, \[atlasTexture[^\]]*\]\);/;

if (content.match(materialStartPattern)) {
  content = content.replace(materialStartPattern, correctMaterialSection);
  console.log(`${colors.green}✅ Fixed material creation section${colors.reset}`);
} else {
  // Alternative approach - find the specific error line
  const errorPattern = /}\s*}\);\s*=\s*createPointsMaterial/;
  if (content.match(errorPattern)) {
    content = content.replace(errorPattern, '    })');
    console.log(`${colors.green}✅ Fixed syntax error${colors.reset}`);
  }
  
  // Or fix the specific problematic line
  content = content.replace(
    /}\s*}\);\s*=\s*createPointsMaterial\({/g,
    '    });\n\n    const { material: mat, variant } = createPointsMaterial({'
  );
}

// Also ensure we have the THREE import
if (!content.includes("import * as THREE from 'three'")) {
  content = content.replace(
    "import React",
    "import React\nimport * as THREE from 'three'"
  );
  console.log(`${colors.yellow}Added THREE import${colors.reset}`);
}

// Write the corrected file
fs.writeFileSync(bgPath, content);

console.log(`${colors.green}✅ WebGLBackground syntax fixed!${colors.reset}`);
console.log(`${colors.yellow}📦 Backup: ${backupPath}${colors.reset}`);
console.log(`${colors.blue}🔄 Restart your dev server${colors.reset}`);