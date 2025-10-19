// Save as: architectural-analysis/analyze-imports.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '..', 'src');
const dependencies = {};
const exports = {};
const errors = [];

function analyzeFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(sourceDir, filePath);
        
        // Find imports
        const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*(?:{[^}]*}|\w+))?\s+from\s+['"]([^'"]+)['"]/g;
        const imports = [];
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        
        // Find exports (improved regex)
        const exportPatterns = [
            /export\s+default\s+/g,
            /export\s+{\s*([^}]+)\s*}/g,
            /export\s+(?:const|let|var|function|class)\s+(\w+)/g,
            /export\s+\*\s+from/g
        ];
        
        let hasExports = false;
        for (const pattern of exportPatterns) {
            if (pattern.test(content)) {
                hasExports = true;
                break;
            }
        }
        
        dependencies[relativePath] = imports;
        exports[relativePath] = hasExports;
        
    } catch (error) {
        errors.push(`Error analyzing ${filePath}: ${error.message}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !file.includes('node_modules')) {
            walkDir(fullPath);
        } else if ((file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.mjs')) 
                   && !file.includes('.bak') 
                   && !file.includes('.orig')) {
            analyzeFile(fullPath);
        }
    });
}

console.log('═══════════════════════════════════════════════════');
console.log('📊 IMPORT/EXPORT DEPENDENCY ANALYSIS RESULTS');
console.log('═══════════════════════════════════════════════════');

// Start analysis
walkDir(sourceDir);

// Statistics
console.log(`\n📈 STATISTICS:`);
console.log(`Total files analyzed: ${Object.keys(dependencies).length}`);
console.log(`Files with imports: ${Object.values(dependencies).filter(d => d.length > 0).length}`);
console.log(`Files with exports: ${Object.values(exports).filter(e => e).length}`);

// Find circular dependencies (simplified check)
console.log('\n🔄 CIRCULAR DEPENDENCY CHECK:');
const visited = new Set();
const recursionStack = new Set();
let circularFound = false;

Object.keys(dependencies).forEach(file => {
    // For each file, check if any of its imports also import it back
    dependencies[file].forEach(imp => {
        // Convert import path to potential file paths
        const possiblePaths = [
            imp + '.js',
            imp + '.jsx',
            imp + '/index.js',
            imp + '/index.jsx'
        ];
        
        possiblePaths.forEach(possiblePath => {
            const normalizedPath = possiblePath.replace(/^\.\//, '').replace(/^@\//, '');
            if (dependencies[normalizedPath]) {
                dependencies[normalizedPath].forEach(reverseImp => {
                    if (reverseImp.includes(file.replace('.jsx', '').replace('.js', ''))) {
                        console.log(`  ⚠️ Potential circular: ${file} ↔ ${normalizedPath}`);
                        circularFound = true;
                    }
                });
            }
        });
    });
});

if (!circularFound) {
    console.log('  ✅ No obvious circular dependencies detected');
}

// Find orphaned files
console.log('\n📦 ORPHANED FILES (no imports/exports):');
let orphanCount = 0;
Object.keys(dependencies).forEach(file => {
    if (dependencies[file].length === 0 && !exports[file]) {
        console.log(`  - ${file}`);
        orphanCount++;
    }
});
if (orphanCount === 0) {
    console.log('  ✅ No orphaned files found');
}

// Find duplicate functionality (files with similar names)
console.log('\n🔁 POTENTIAL DUPLICATES (similar names):');
const fileGroups = {};
Object.keys(dependencies).forEach(file => {
    const basename = path.basename(file, path.extname(file))
        .toLowerCase()
        .replace(/\.test$/, '')
        .replace(/\.spec$/, '');
    
    if (!fileGroups[basename]) fileGroups[basename] = [];
    fileGroups[basename].push(file);
});

let duplicateCount = 0;
Object.entries(fileGroups).forEach(([name, files]) => {
    if (files.length > 1) {
        console.log(`  📁 "${name}":`);
        files.forEach(f => console.log(`      - ${f}`));
        duplicateCount++;
    }
});
if (duplicateCount === 0) {
    console.log('  ✅ No duplicate file names found');
}

// Find commonly imported files (potential core dependencies)
console.log('\n⭐ MOST IMPORTED FILES (core dependencies):');
const importCounts = {};
Object.values(dependencies).forEach(imports => {
    imports.forEach(imp => {
        const cleanPath = imp.replace(/^[@./]+/, '');
        importCounts[cleanPath] = (importCounts[cleanPath] || 0) + 1;
    });
});

const sortedImports = Object.entries(importCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

sortedImports.forEach(([file, count]) => {
    console.log(`  ${count}x - ${file}`);
});

// Check for problematic patterns
console.log('\n⚠️ POTENTIAL ISSUES:');
let issueCount = 0;

// Check for files importing too many dependencies
Object.entries(dependencies).forEach(([file, imports]) => {
    if (imports.length > 15) {
        console.log(`  Heavy imports: ${file} (${imports.length} imports)`);
        issueCount++;
    }
});

// Check for deep relative paths
Object.entries(dependencies).forEach(([file, imports]) => {
    imports.forEach(imp => {
        if (imp.includes('../../../')) {
            console.log(`  Deep relative path in ${file}: ${imp}`);
            issueCount++;
        }
    });
});

if (issueCount === 0) {
    console.log('  ✅ No obvious issues detected');
}

// Save results
fs.writeFileSync('dependency-map.json', JSON.stringify(dependencies, null, 2));
fs.writeFileSync('export-map.json', JSON.stringify(exports, null, 2));

console.log('\n📁 Results saved to:');
console.log('  - dependency-map.json');
console.log('  - export-map.json');

if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(e => console.log(`  - ${e}`));
}