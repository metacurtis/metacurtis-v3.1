const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'src');
const dependencies = {};
const exports = {};

function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(sourceDir, filePath);
    
    // Find imports
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*(?:{[^}]*}|\w+))?\s+from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }
    
    // Find exports
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class|{)/g;
    const hasExports = exportRegex.test(content);
    
    dependencies[relativePath] = imports;
    exports[relativePath] = hasExports;
}

// Analyze all JS/JSX files
function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !file.includes('node_modules')) {
            walkDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            if (!file.includes('.bak') && !file.includes('.orig')) {
                analyzeFile(fullPath);
            }
        }
    });
}

walkDir(sourceDir);

// Output analysis
console.log('DEPENDENCY ANALYSIS RESULTS:');
console.log('═══════════════════════════');

// Find circular dependencies
console.log('\n🔄 Checking for circular dependencies...');
const visited = new Set();
const recursionStack = new Set();

function hasCycle(node, graph, visited, recursionStack) {
    visited.add(node);
    recursionStack.add(node);
    
    const deps = graph[node] || [];
    for (const dep of deps) {
        if (!visited.has(dep)) {
            if (hasCycle(dep, graph, visited, recursionStack)) {
                return true;
            }
        } else if (recursionStack.has(dep)) {
            console.log(`  ⚠️ Circular: ${node} -> ${dep}`);
            return true;
        }
    }
    
    recursionStack.delete(node);
    return false;
}

// Find orphaned files (no imports, no exports)
console.log('\n📦 Files with no imports or exports (potential dead code):');
Object.keys(dependencies).forEach(file => {
    if (dependencies[file].length === 0 && !exports[file]) {
        console.log(`  - ${file}`);
    }
});

// Find duplicate functionality
console.log('\n🔁 Potential duplicate functionality (similar names):');
const fileGroups = {};
Object.keys(dependencies).forEach(file => {
    const basename = path.basename(file, path.extname(file)).toLowerCase();
    if (!fileGroups[basename]) fileGroups[basename] = [];
    fileGroups[basename].push(file);
});

Object.entries(fileGroups).forEach(([name, files]) => {
    if (files.length > 1) {
        console.log(`  ${name}:`);
        files.forEach(f => console.log(`    - ${f}`));
    }
});

fs.writeFileSync('dependency-map.json', JSON.stringify(dependencies, null, 2));
fs.writeFileSync('export-map.json', JSON.stringify(exports, null, 2));
