#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🗺️ STATE DEPENDENCY MAP"
echo "═══════════════════════════════════════════════════════════════"

# Create detailed JSON map of state dependencies
cat > generate-state-map.js << 'EOF'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stateMap = {
  atoms: {},
  stores: {},
  hooks: {},
  conflicts: [],
  recommendations: []
};

// Find all atom files
function findAtomFiles() {
  const atomsDir = path.join(__dirname, '../src/stores/atoms');
  if (fs.existsSync(atomsDir)) {
    fs.readdirSync(atomsDir).forEach(file => {
      if (file.endsWith('.js')) {
        const content = fs.readFileSync(path.join(atomsDir, file), 'utf8');
        const atomName = file.replace('.js', '');
        
        // Extract atom details
        const keyMatch = content.match(/key:\s*['"]([^'"]+)['"]/);
        const defaultMatch = content.match(/default:\s*({[^}]+}|\[[^\]]+\]|[^,\n]+)/);
        
        stateMap.atoms[atomName] = {
          file: `stores/atoms/${file}`,
          key: keyMatch ? keyMatch[1] : null,
          hasDefault: defaultMatch !== null,
          importedBy: []
        };
      }
    });
  }
}

// Find all store files
function findStoreFiles() {
  const storesDir = path.join(__dirname, '../src/stores');
  if (fs.existsSync(storesDir)) {
    fs.readdirSync(storesDir).forEach(file => {
      if (file.endsWith('Store.js') || file.endsWith('store.js')) {
        stateMap.stores[file.replace('.js', '')] = {
          file: `stores/${file}`,
          importedBy: []
        };
      }
    });
  }
}

// Find who imports what
function mapImports() {
  const srcDir = path.join(__dirname, '../src');
  
  function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(srcDir, filePath);
    
    // Check atom imports
    Object.keys(stateMap.atoms).forEach(atomName => {
      if (content.includes(atomName)) {
        stateMap.atoms[atomName].importedBy.push(relativePath);
      }
    });
    
    // Check store imports
    Object.keys(stateMap.stores).forEach(storeName => {
      if (content.includes(storeName)) {
        stateMap.stores[storeName].importedBy.push(relativePath);
      }
    });
    
    // Check for conflicts
    const hasAtom = content.includes('atom');
    const hasStore = content.includes('Store');
    const hasUseState = content.includes('useState');
    
    if ([hasAtom, hasStore, hasUseState].filter(Boolean).length > 1) {
      stateMap.conflicts.push({
        file: relativePath,
        patterns: {
          atom: hasAtom,
          store: hasStore,
          useState: hasUseState
        }
      });
    }
  }
  
  function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules')) {
        walkDir(fullPath);
      } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
        scanFile(fullPath);
      }
    });
  }
  
  walkDir(srcDir);
}

// Analyze and make recommendations
function analyzeState() {
  // Find unused atoms
  Object.entries(stateMap.atoms).forEach(([name, data]) => {
    if (data.importedBy.length === 0) {
      stateMap.recommendations.push(`Remove unused atom: ${name}`);
    }
  });
  
  // Find redundant stores
  Object.entries(stateMap.stores).forEach(([name, data]) => {
    // Check if there's an equivalent atom
    const atomEquivalent = Object.keys(stateMap.atoms).find(atomName => 
      atomName.toLowerCase().includes(name.toLowerCase().replace('store', ''))
    );
    
    if (atomEquivalent) {
      stateMap.recommendations.push(`Remove redundant store: ${name} (use ${atomEquivalent} instead)`);
    }
  });
}

// Run analysis
findAtomFiles();
findStoreFiles();
mapImports();
analyzeState();

// Output results
console.log(JSON.stringify(stateMap, null, 2));

// Generate markdown report
const report = `
# State Management Analysis Report

## Atoms (${Object.keys(stateMap.atoms).length} files)
${Object.entries(stateMap.atoms).map(([name, data]) => 
  `- **${name}**: Used by ${data.importedBy.length} files`
).join('\n')}

## Stores (${Object.keys(stateMap.stores).length} files)
${Object.entries(stateMap.stores).map(([name, data]) => 
  `- **${name}**: Used by ${data.importedBy.length} files`
).join('\n')}

## Conflicts (${stateMap.conflicts.length} files)
${stateMap.conflicts.map(conflict => 
  `- ${conflict.file}: Uses ${Object.entries(conflict.patterns)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(', ')}`
).join('\n')}

## Recommendations
${stateMap.recommendations.map(rec => `- ${rec}`).join('\n')}
`;

fs.writeFileSync('state-analysis-report.md', report);
console.log('\nReport saved to state-analysis-report.md');
EOF

node generate-state-map.js > state-map.json

