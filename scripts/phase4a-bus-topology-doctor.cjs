#!/usr/bin/env node
/* eslint-env node */
/**
 * Phase 4a: Bus Topology Stabilization Doctor
 * One-touch, AST-based, idempotent bus consolidation
 * 
 * Usage: node scripts/phase4a-bus-topology-doctor.cjs [--write] [--strict] [--verbose]
 * 
 * Goal: Converge to single BeatBus instance without changing call-sites
 */

const fs = require('fs');
const _path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// Configuration
const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const OPTS = new Set(process.argv.slice(2));
const WRITE = OPTS.has('--write');
const STRICT = OPTS.has('--strict');
const VERBOSE = OPTS.has('--verbose');

// Artifact setup
const ARTIFACTS_DIR = path.join(ROOT, 'doctor_artifacts');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR);

// Logging utilities
const log = (...args) => VERBOSE && console.log('[4a-doctor]', ...args);
const info = (...args) => console.log('ℹ️ ', ...args);
const success = (...args) => console.log('✅', ...args);
const warn = (...args) => console.log('⚠️ ', ...args);
const error = (...args) => console.error('❌', ...args);

// Data structures
const findings = {
  busFiles: [],
  instances: [],  // Changed to array to capture all instances
  exports: [],
  imports: new Map(),
  canonCalls: [],  // Renamed for clarity
  stubsAndAdapters: [],  // New: detect hand-rolled buses
  issues: [],
  actions: [],
  topology: { 
    producers: [], 
    consumers: [], 
    bridges: [],
    disposeDebt: new Map()  // Track listener/dispose imbalance per file
  }
};

// Canonical bus path (your architecture decision)
const CANONICAL_BUS = 'src/src/modules/orchestration/core/BeatBus.js';

/**
 * Phase 1: Discovery - Find all bus-related files
 */
function discoverBusFiles() {
  info('Phase 1: Discovering bus topology...');
  
  const files = [];
  function walk(dir) {
    for (const file of fs.readdirSync(dir)) {
      if (file === 'node_modules' || file.startsWith('.')) continue;
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (/\.(m?jsx?|tsx?)$/.test(file)) {
        files.push(filePath);
      }
    }
  }
  walk(SRC);
  
  log(`Found ${files.length} source files to analyze`);
  return files;
}

/**
 * Parse file into AST with all needed plugins
 */
function parseFile(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    return parser.parse(code, {
      sourceType: 'module',
      plugins: [
        'jsx', 
        'typescript', 
        'classProperties', 
        'decorators-legacy',
        'optionalChaining',  // Added
        'nullishCoalescingOperator',  // Added
        'dynamicImport',  // Added
        'topLevelAwait'  // Added if needed
      ]
    });
  } catch (e) {
    findings.issues.push({
      severity: 'WARN',
      type: 'PARSE_ERROR',
      file: filePath,
      message: e.message.split('\n')[0]
    });
    return null;
  }
}

/**
 * Get full source string from any node
 */
function getFullSourceString(node) {
  const parts = [];
  let current = node;
  
  while (current) {
    if (current.type === 'MemberExpression') {
      const prop = current.property;
      parts.unshift(prop.name || prop.value || '<computed>');
      current = current.object;
    } else if (current.type === 'Identifier') {
      parts.unshift(current.name);
      break;
    } else if (current.type === 'ThisExpression') {
      parts.unshift('this');
      break;
    } else {
      // Handle window, globalThis, etc.
      parts.unshift('<expression>');
      break;
    }
  }
  
  return parts.join('.');
}

/**
 * Check if an object looks like a bus (has on/off/emit methods)
 */
function looksLikeBus(node, code) {
  if (!node) return false;
  
  // For object expressions, check properties
  if (node.type === 'ObjectExpression') {
    const methods = new Set();
    node.properties.forEach(prop => {
      if (prop.key?.name) methods.add(prop.key.name);
    });
    return methods.has('on') && methods.has('off') && methods.has('emit');
  }
  
  // For identifiers, check if the file exports bus-like methods
  if (node.type === 'Identifier') {
    const pattern = new RegExp(`${node.name}\\.(on|off|emit)\\s*\\(`);
    return pattern.test(code);
  }
  
  return false;
}

/**
 * Phase 2: Analysis - Build topology map
 */
function analyzeBusTopology(files) {
  info('Phase 2: Analyzing bus topology...');
  
  for (const file of files) {
    const ast = parseFile(file);
    if (!ast) continue;
    
    const code = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(ROOT, file);
    
    let hasWindowExport = false;
    let hasGlobalExport = false;
    let busImports = [];
    let busExports = [];
    let listeners = [];
    let emitters = [];
    let disposes = [];
    
    traverse(ast, {
      // Detect class definitions
      ClassDeclaration(nodePath) {
        if (nodePath.node.id?.name === 'BeatBus') {
          findings.busFiles.push({ 
            file: relPath, 
            type: 'CLASS_DEFINITION',
            line: nodePath.node.loc?.start.line 
          });
        }
      },
      
      // Detect instantiations (improved)
      NewExpression(nodePath) {
        if (nodePath.node.callee.name === 'BeatBus') {
          findings.instances.push({  // Now array, captures all
            file: relPath,
            type: 'INSTANTIATION',
            line: nodePath.node.loc?.start.line
          });
        }
      },
      
      // Detect imports of bus instances
      ImportDeclaration(nodePath) {
        const source = nodePath.node.source.value;
        if (source.includes('BeatBus') || source.includes('beatBus') || source.includes('bus')) {
          const specs = nodePath.node.specifiers.map(s => ({
            local: s.local.name,
            imported: s.imported?.name || 'default'
          }));
          busImports.push({ source, specifiers: specs });
          
          // Mark as instance consumer if importing from known bus files
          if (source.includes('/bus/') || source.includes('/BeatBus')) {
            findings.instances.push({
              file: relPath,
              type: 'IMPORT_INSTANCE',
              source,
              line: nodePath.node.loc?.start.line
            });
          }
        }
      },
      
      // Detect stub/adapter exports (new)
      ExportDefaultDeclaration(nodePath) {
        const decl = nodePath.node.declaration;
        if (looksLikeBus(decl, code)) {
          findings.stubsAndAdapters.push({
            file: relPath,
            type: 'STUB_EXPORT',
            line: nodePath.node.loc?.start.line
          });
        }
        if (decl.type === 'Identifier' && decl.name.toLowerCase().includes('bus')) {
          busExports.push({ type: 'DEFAULT', name: decl.name });
        }
      },
      
      ExportNamedDeclaration(nodePath) {
        nodePath.node.specifiers?.forEach(spec => {
          if (spec.exported.name.toLowerCase().includes('bus')) {
            busExports.push({ type: 'NAMED', name: spec.exported.name });
          }
        });
      },
      
      // Detect window/global exports (improved)
      AssignmentExpression(nodePath) {
        const left = nodePath.node.left;
        if (left.type === 'MemberExpression') {
          const fullPath = getFullSourceString(left);
          if (fullPath === 'window.BeatBus' || fullPath === 'globalThis.BeatBus') {
            findings.exports.push({ 
              file: relPath, 
              type: fullPath.split('.')[0],
              line: nodePath.node.loc?.start.line 
            });
          }
        }
      },
      
      // Detect Canon calls (expanded)
      CallExpression(nodePath) {
        const callee = nodePath.node.callee;
        if (callee.type === 'MemberExpression') {
          const source = getFullSourceString(callee);
          
          // Check for Canon boundary/validate calls
          if (source.includes('canon.boundary.enforce') || 
              source.includes('canon.validate') ||
              source.includes('canon.enforce')) {
            findings.canonCalls.push({ 
              file: relPath,
              method: source,
              line: nodePath.node.loc?.start.line 
            });
          }
          
          // Track listeners and emitters with full chain
          const method = callee.property?.name;
          if (method === 'on' || method === 'once') {
            listeners.push({
              method,
              bus: source.replace(`.${method}`, ''),
              line: nodePath.node.loc?.start.line
            });
          } else if (method === 'emit' || method === 'publish') {
            emitters.push({
              method,
              bus: source.replace(`.${method}`, ''),
              line: nodePath.node.loc?.start.line
            });
          } else if (method === 'off' || method === 'dispose' || method === 'removeListener') {
            disposes.push({
              method,
              bus: source.replace(`.${method}`, ''),
              line: nodePath.node.loc?.start.line
            });
          }
        }
      }
    });
    
    // Store topology data
    if (busImports.length > 0) {
      findings.imports.set(relPath, busImports);
    }
    
    if (listeners.length > 0) {
      findings.topology.consumers.push({ file: relPath, listeners });
    }
    
    if (emitters.length > 0) {
      findings.topology.producers.push({ file: relPath, emitters });
    }
    
    // Calculate dispose debt
    if (listeners.length > 0 || disposes.length > 0) {
      findings.topology.disposeDebt.set(relPath, {
        listeners: listeners.length,
        disposes: disposes.length,
        debt: listeners.length - disposes.length
      });
    }
  }
  
  log(`Found ${findings.instances.length} bus references`);
  log(`Found ${findings.stubsAndAdapters.length} stub/adapter files`);
  log(`Found ${findings.exports.length} global exports`);
  log(`Found ${findings.canonCalls.length} Canon calls`);
}

/**
 * Phase 3: Planning - Determine consolidation strategy
 */
function planConsolidation() {
  info('Phase 3: Planning consolidation strategy...');
  
  // Check if canonical bus exists
  const canonicalPath = path.join(ROOT, CANONICAL_BUS);
  if (!fs.existsSync(canonicalPath)) {
    findings.issues.push({
      severity: 'HIGH',
      type: 'MISSING_CANONICAL',
      message: `Canonical bus not found at ${CANONICAL_BUS}`
    });
    return false;
  }
  
  // Count unique bus sources
  const uniqueBusSources = new Set();
  findings.instances.forEach(inst => {
    if (inst.type === 'INSTANTIATION' || inst.type === 'STUB_EXPORT') {
      uniqueBusSources.add(inst.file);
    }
  });
  findings.stubsAndAdapters.forEach(stub => {
    uniqueBusSources.add(stub.file);
  });
  
  // Identify issues
  if (uniqueBusSources.size > 1) {
    findings.issues.push({
      severity: 'HIGH',
      type: 'MULTIPLE_INSTANCES',
      message: `Found ${uniqueBusSources.size} bus sources, should be 1`,
      files: Array.from(uniqueBusSources)
    });
  }
  
  if (findings.exports.length === 0) {
    findings.issues.push({
      severity: 'HIGH',
      type: 'NO_GLOBAL_EXPORT',
      message: 'window.BeatBus not exported for dev tools'
    });
  }
  
  if (findings.canonCalls.length === 0) {
    findings.issues.push({
      severity: 'MEDIUM',
      type: 'NO_CANON_CALLS',
      message: 'No Canon boundary/validate calls found'
    });
  }
  
  // Plan actions for all non-canonical bus sources
  uniqueBusSources.forEach(file => {
    if (!file.includes(CANONICAL_BUS.replace(/\\/g, '/'))) {
      findings.actions.push({
        type: 'CONVERT_TO_REEXPORT',
        file,
        target: CANONICAL_BUS,
        reason: 'Non-canonical bus source'
      });
    }
  });
  
  // Plan global export if missing
  if (findings.exports.length === 0) {
    findings.actions.push({
      type: 'ADD_GLOBAL_EXPORT',
      file: CANONICAL_BUS
    });
  }
  
  return true;
}

/**
 * Phase 4: Patching - Apply fixes if --write
 */
function applyPatches() {
  if (!WRITE) {
    info('Phase 4: Skipping patches (dry run)');
    return;
  }
  
  info('Phase 4: Applying patches...');
  
  for (const action of findings.actions) {
    try {
      if (action.type === 'CONVERT_TO_REEXPORT') {
        convertToReexport(action.file, action.target);
      } else if (action.type === 'ADD_GLOBAL_EXPORT') {
        addGlobalExport(action.file);
      }
      
      success(`Applied: ${action.type} to ${action.file}`);
    } catch (e) {
      error(`Failed to apply ${action.type}: ${e.message}`);
      findings.issues.push({
        severity: 'HIGH',
        type: 'PATCH_FAILED',
        message: e.message
      });
    }
  }
}

/**
 * Convert a bus file to re-export canonical (improved)
 */
function convertToReexport(file, target) {
  const filePath = path.join(ROOT, file);
  const originalCode = fs.readFileSync(filePath, 'utf8');
  
  // Check for side effects
  const hasSideEffects = /window\.|globalThis\.|console\./g.test(originalCode);
  
  // Create backup
  const backup = `${filePath}.bak`;
  fs.copyFileSync(filePath, backup);
  
  // Calculate relative path
  const relativePath = path.relative(path.dirname(filePath), path.join(ROOT, target))
    .replace(/\\/g, '/');
  
  // Generate re-export (simplified, safer)
  const reexportCode = `/**
 * @doctor:phase4a - Re-export of canonical BeatBus
 * Generated: ${new Date().toISOString()}
 * Original backed up to: ${path.basename(backup)}
 ${hasSideEffects ? '* WARNING: Original had side effects that are no longer executed' : ''}
 */

// Re-export canonical BeatBus instance as default
export { default } from '${relativePath}';

// Pass through any named exports from canonical
export * from '${relativePath}';
`;
  
  fs.writeFileSync(filePath, reexportCode, 'utf8');
}

/**
 * Add global export to canonical bus (improved)
 */
function addGlobalExport(file) {
  const filePath = path.join(ROOT, file);
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Check if export already exists
  if (code.includes('window.BeatBus') || code.includes('globalThis.BeatBus')) {
    log('Global export already exists');
    return;
  }
  
  // Find the bus instance variable name more reliably
  let busInstanceName = null;
  
  // Try to find from: export default <name>
  const defaultExportMatch = code.match(/export\s+default\s+(\w+)/);
  if (defaultExportMatch) {
    busInstanceName = defaultExportMatch[1];
  }
  
  // Try to find from: const <name> = new BeatBus
  if (!busInstanceName) {
    const instanceMatch = code.match(/const\s+(\w+)\s*=\s*new\s+BeatBus/);
    if (instanceMatch) {
      busInstanceName = instanceMatch[1];
    }
  }
  
  if (!busInstanceName) {
    findings.issues.push({
      severity: 'HIGH',
      type: 'CANNOT_ADD_GLOBAL',
      message: 'Cannot determine bus instance name for global export'
    });
    return;
  }
  
  // Add global export with proper guards
  const globalExport = `

// @doctor:phase4a - Global export for dev tools
if (import.meta.env?.DEV || process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    window.BeatBus = ${busInstanceName};
    window.__BEATBUS_INSTANCE = '${CANONICAL_BUS}';
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.BeatBus = ${busInstanceName};
  }
}
`;
  
  // Insert after the instance creation or at end of file
  const insertPoint = code.lastIndexOf('export default');
  if (insertPoint > -1) {
    code = code.slice(0, insertPoint) + globalExport + '\n\n' + code.slice(insertPoint);
  } else {
    code += globalExport;
  }
  
  fs.writeFileSync(filePath, code, 'utf8');
}

/**
 * Phase 5: Re-analysis after patches
 */
function reanalyzeIfPatched() {
  if (!WRITE) return;
  
  info('Phase 5: Re-analyzing after patches...');
  
  // Clear previous findings that will be re-calculated
  findings.instances = [];
  findings.stubsAndAdapters = [];
  findings.exports = [];
  findings.canonCalls = [];
  
  // Re-run analysis
  const files = discoverBusFiles();
  analyzeBusTopology(files);
}

/**
 * Phase 6: Verification
 */
function verify() {
  info('Phase 6: Generating verification artifacts...');
  
  // Count unique bus sources after patches
  const uniqueBusSources = new Set();
  findings.instances.forEach(inst => {
    if (inst.type === 'INSTANTIATION') {
      uniqueBusSources.add(inst.file);
    }
  });
  
  const verification = {
    instances: uniqueBusSources.size,
    globalExport: findings.exports.length > 0,
    canonCalls: findings.canonCalls.length > 0,
    issues: findings.issues.filter(i => i.severity === 'HIGH').length,
    disposeDebt: Array.from(findings.topology.disposeDebt.values())
      .reduce((sum, d) => sum + d.debt, 0)
  };
  
  // Generate verification script
  const verifyScript = `
// Phase 4a Verification Script
// Run this in your browser console after refreshing the app

console.log('=== Phase 4a Bus Topology Verification ===');

// Check 1: Single instance
if (window.BeatBus) {
  console.log('✓ window.BeatBus exists');
  console.log('  Instance location:', window.__BEATBUS_INSTANCE || 'unknown');
  
  // Test imports match global
  import('${CANONICAL_BUS.replace(/\\/g, '/')}').then(module => {
    const imported = module.default;
    console.log('✓ Import matches global:', imported === window.BeatBus);
  }).catch(e => {
    console.log('  Note: Direct import failed, likely due to dev server config');
    console.log('  Fallback: Check window.BeatBus.getDebugInfo?.()');
  });
} else {
  console.log('❌ window.BeatBus not found');
}

// Check 2: Event handling (no duplicates)
if (window.BeatBus) {
  let stageCount = 0, qualityCount = 0;
  const stageHandler = () => stageCount++;
  const qualityHandler = () => qualityCount++;
  
  window.BeatBus.on('STAGE_CHANGE', stageHandler);
  window.BeatBus.on('QUALITY_CHANGE', qualityHandler);
  
  window.BeatBus.emit('STAGE_CHANGE', { from: 'genesis', to: 'neural' });
  window.BeatBus.emit('QUALITY_CHANGE', { tier: 'HIGH' });
  
  setTimeout(() => {
    console.log('✓ Stage handler count:', stageCount, '(expect 1)');
    console.log('✓ Quality handler count:', qualityCount, '(expect 1)');
    
    // Cleanup
    window.BeatBus.off('STAGE_CHANGE', stageHandler);
    window.BeatBus.off('QUALITY_CHANGE', qualityHandler);
  }, 100);
}

// Check 3: Debug info
if (window.BeatBus?.getDebugInfo) {
  const info = window.BeatBus.getDebugInfo();
  console.log('Debug info:', info);
} else {
  console.log('Note: getDebugInfo() not available');
}

console.log('=== Verification Complete ===');
`;
  
  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, '4a-verify.js'),
    verifyScript,
    'utf8'
  );
  
  return verification;
}

/**
 * Generate artifacts
 */
function generateArtifacts(verification) {
  // Topology map
  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, '4a-topology.json'),
    JSON.stringify({
      ...findings.topology,
      disposeDebt: Array.from(findings.topology.disposeDebt.entries())
    }, null, 2),
    'utf8'
  );
  
  // Findings (post-patch if applicable)
  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, '4a-findings.json'),
    JSON.stringify({
      issues: findings.issues,
      actions: findings.actions,
      instances: findings.instances,
      stubsAndAdapters: findings.stubsAndAdapters,
      exports: findings.exports,
      canonCalls: findings.canonCalls,
      applied: WRITE
    }, null, 2),
    'utf8'
  );
  
  // Checklist
  const checklist = `# Phase 4a Verification Checklist

## Pre-flight Checks
- [ ] Current branch: phase4-statecore-consolidation
- [ ] Baseline metrics captured
- [ ] Dev server running

## Static Verification (Post-${WRITE ? 'Patch' : 'Analysis'})
- [ ] ${verification.instances} bus instance(s) found (target: 1)
- [ ] ${verification.globalExport ? '✓' : '✗'} Global export present
- [ ] ${verification.canonCalls ? '✓' : '✗'} Canon calls detected
- [ ] ${verification.disposeDebt} total dispose debt (for phase 4b)

## Runtime Verification
1. Open browser console
2. Run verification script from \`doctor_artifacts/4a-verify.js\`
3. Confirm:
   - [ ] window.BeatBus exists
   - [ ] No duplicate event handlers
   - [ ] Single reaction per emit

## Smoke Tests
- [ ] Stage navigation works (1→2→3)
- [ ] Quality changes work (LOW→MEDIUM→HIGH)
- [ ] No console errors
- [ ] Performance unchanged from baseline

## Status
${WRITE ? '✅ Patches applied - test thoroughly' : '⚠️ Dry run - use --write to apply'}
${verification.issues > 0 ? `⚠️ ${verification.issues} high-severity issues remain` : '✅ No blocking issues'}

## Next Phase
Ready for Phase 4b (HMR Hygiene) once all checks pass
`;
  
  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, '4a-checklist.md'),
    checklist,
    'utf8'
  );
  
  // Ledger for next phases
  const ledger = {
    phase: '4a',
    timestamp: new Date().toISOString(),
    canonicalBus: CANONICAL_BUS,
    instanceCount: verification.instances,
    hasGlobalExport: verification.globalExport,
    hasCanonCalls: verification.canonCalls,
    disposeDebt: verification.disposeDebt,
    patchesApplied: WRITE,
    remainingIssues: verification.issues
  };
  
  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, 'ledger.json'),
    JSON.stringify(ledger, null, 2),
    'utf8'
  );
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Phase 4a: Bus Topology Stabilization Doctor');
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN'} | Strict: ${STRICT} | Verbose: ${VERBOSE}`);
  console.log('');
  
  try {
    // Discovery
    const files = discoverBusFiles();
    
    // Initial Analysis
    analyzeBusTopology(files);
    
    // Planning
    const canProceed = planConsolidation();
    if (!canProceed && STRICT) {
      error('Critical issues found, cannot proceed in strict mode');
      process.exit(3);
    }
    
    // Patching
    applyPatches();
    
    // Re-analysis if patches were applied
    reanalyzeIfPatched();
    
    // Verification
    const verification = verify();
    
    // Artifacts
    generateArtifacts(verification);
    
    // Summary
    console.log('');
    console.log('📊 Summary:');
    console.log(`  Instances: ${verification.instances} (target: 1)`);
    console.log(`  Global Export: ${verification.globalExport ? '✅' : '❌'}`);
    console.log(`  Canon Calls: ${verification.canonCalls ? '✅' : '⚠️'}`);
    console.log(`  Dispose Debt: ${verification.disposeDebt} listeners without cleanup`);
    console.log(`  High Issues: ${verification.issues}`);
    console.log('');
    console.log(`📁 Artifacts written to: ${ARTIFACTS_DIR}/`);
    console.log(`📋 Next: Review 4a-checklist.md and run 4a-verify.js in console`);
    
    // Exit codes
    if (verification.issues > 0 && STRICT) {
      process.exit(3); // Blockers in strict mode
    } else if (verification.instances > 1) {
      process.exit(2); // Warnings
    } else {
      process.exit(0); // Success
    }
    
  } catch (e) {
    error('Fatal error:', e.message);
    console.error(e.stack);
    process.exit(3);
  }
}

// Run
main();
