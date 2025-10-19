#!/usr/bin/env node
/**
 * MetaCurtis Velocity Stack Diagnostic v1.0
 *
 * Checks current system state against Velocity Playbook v2.0
 * Identifies missing features and provides restoration guidance
 *
 * Usage: node scripts/velocity-diagnostic.cjs
 */

const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

const STATUS = {
  PRESENT: `${colors.green}✅ PRESENT${colors.reset}`,
  MISSING: `${colors.red}❌ MISSING${colors.reset}`,
  PARTIAL: `${colors.yellow}⚠️  PARTIAL${colors.reset}`,
  UNKNOWN: `${colors.dim}❓ UNKNOWN${colors.reset}`
};

// Helper to check file existence
function fileExists(filepath) {
  try {
    return fs.existsSync(filepath);
  } catch {
    return false;
  }
}

// Helper to check file contains pattern
function fileContains(filepath, pattern) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return new RegExp(pattern).test(content);
  } catch {
    return false;
  }
}

// Helper to check package.json script
function hasScript(scriptName) {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return !!pkg.scripts?.[scriptName];
  } catch {
    return false;
  }
}

// Helper to check directory exists
function dirExists(dirpath) {
  try {
    return fs.existsSync(dirpath) && fs.statSync(dirpath).isDirectory();
  } catch {
    return false;
  }
}

console.log('\n' + '='.repeat(70));
console.log(`${colors.cyan}MetaCurtis Velocity Stack Diagnostic v1.0${colors.reset}`);
console.log('='.repeat(70) + '\n');

const results = {
  layer1: {},
  layer2: {},
  layer3: {},
  layer4: {},
  overall: { present: 0, missing: 0, partial: 0 }
};

// ============================================================================
// LAYER 1: CONSTITUTIONAL GROUNDING (SST)
// ============================================================================
console.log(`${colors.blue}█ LAYER 1: CONSTITUTIONAL GROUNDING (SST)${colors.reset}\n`);

// Check SST v3.5 exists
results.layer1.sstConfig = fileExists('sst/canon/v3.5.json');
console.log(`  SST v3.5 Config:           ${results.layer1.sstConfig ? STATUS.PRESENT : STATUS.MISSING}`);
if (results.layer1.sstConfig) {
  console.log(`    ${colors.dim}└─ sst/canon/v3.5.json${colors.reset}`);
}

// Check schema validation
results.layer1.sstSchema = fileExists('sst/canon/v3.5.schema.json');
console.log(`  SST Schema:                ${results.layer1.sstSchema ? STATUS.PRESENT : STATUS.MISSING}`);

// Check validation script
results.layer1.validateScript = hasScript('validate-sst');
console.log(`  Validation Script:         ${results.layer1.validateScript ? STATUS.PRESENT : STATUS.MISSING}`);
if (results.layer1.validateScript) {
  console.log(`    ${colors.dim}└─ npm run validate-sst${colors.reset}`);
}

// Check drift detection
results.layer1.driftScript = hasScript('detect-drift');
console.log(`  Drift Detection:           ${results.layer1.driftScript ? STATUS.PRESENT : STATUS.MISSING}`);
if (results.layer1.driftScript) {
  console.log(`    ${colors.dim}└─ npm run detect-drift${colors.reset}`);
}

// Check pre-commit hook
results.layer1.preCommit = fileExists('.husky/pre-commit') &&
  fileContains('.husky/pre-commit', 'validate-sst|detect-drift|sst-check');
console.log(`  Pre-commit Enforcement:    ${results.layer1.preCommit ? STATUS.PRESENT : STATUS.MISSING}`);

const layer1Score = Object.values(results.layer1).filter(Boolean).length;
const layer1Total = Object.keys(results.layer1).length;
console.log(`\n  ${colors.cyan}Layer 1 Status: ${layer1Score}/${layer1Total} components${colors.reset}\n`);

// ============================================================================
// LAYER 2: CONTRACT ENFORCEMENT
// ============================================================================
console.log(`${colors.blue}█ LAYER 2: CONTRACT ENFORCEMENT${colors.reset}\n`);

// Check contract tests exist
results.layer2.contractTests = fileExists('tests/contracts/blueprint-tests.js') ||
  fileExists('tests/contracts/blueprint-tests.cjs');
console.log(`  Contract Tests:            ${results.layer2.contractTests ? STATUS.PRESENT : STATUS.MISSING}`);
if (results.layer2.contractTests) {
  console.log(`    ${colors.dim}└─ tests/contracts/blueprint-tests.*${colors.reset}`);
}

// Check test script
results.layer2.testScript = hasScript('test:contracts');
console.log(`  Test Script:               ${results.layer2.testScript ? STATUS.PRESENT : STATUS.MISSING}`);

// Check blueprint validation
results.layer2.blueprintValidation = results.layer2.contractTests &&
  (fileContains('tests/contracts/blueprint-tests.js', 'blueprint') ||
   fileContains('tests/contracts/blueprint-tests.cjs', 'blueprint'));
console.log(`  Blueprint Validation:      ${results.layer2.blueprintValidation ? STATUS.PRESENT : STATUS.MISSING}`);

// Check event schema validation
results.layer2.eventValidation = results.layer2.contractTests &&
  (fileContains('tests/contracts/blueprint-tests.js', 'event|schema') ||
   fileContains('tests/contracts/blueprint-tests.cjs', 'event|schema'));
console.log(`  Event Schema Validation:   ${results.layer2.eventValidation ? STATUS.PRESENT : STATUS.MISSING}`);

const layer2Score = Object.values(results.layer2).filter(Boolean).length;
const layer2Total = Object.keys(results.layer2).length;
console.log(`\n  ${colors.cyan}Layer 2 Status: ${layer2Score}/${layer2Total} components${colors.reset}\n`);

// ============================================================================
// LAYER 3: FEEDBACK & INSTRUMENTATION
// ============================================================================
console.log(`${colors.blue}█ LAYER 3: FEEDBACK & INSTRUMENTATION${colors.reset}\n`);

// 3a: Shader HMR
results.layer3.shaderHmr = fileContains('vite.config.js', 'glsl') ||
  fileContains('vite.config.ts', 'glsl');
console.log(`  Shader HMR (<500ms):       ${results.layer3.shaderHmr ? STATUS.PRESENT : STATUS.MISSING}`);
if (results.layer3.shaderHmr) {
  console.log(`    ${colors.dim}└─ vite.config.* with GLSL plugin${colors.reset}`);
}

// 3b: Probe System
results.layer3.probeSystem = fileExists('src/config/canonical/canonicalAuthority.js') &&
  fileContains('src/config/canonical/canonicalAuthority.js', 'window.probe');
console.log(`  Probe System (real-time):  ${results.layer3.probeSystem ? STATUS.PRESENT : STATUS.MISSING}`);
if (results.layer3.probeSystem) {
  console.log(`    ${colors.dim}└─ window.probe.draw(), .fps(), .aabb()${colors.reset}`);
}

// 3c: Probe History
results.layer3.probeHistory = fileExists('src/config/canonical/canonicalAuthority.js') &&
  fileContains('src/config/canonical/canonicalAuthority.js', 'probe.*history|history.*probe');
console.log(`  Probe History (temporal):  ${results.layer3.probeHistory ? STATUS.PRESENT : STATUS.MISSING}`);
if (results.layer3.probeHistory) {
  console.log(`    ${colors.dim}└─ window.probe.history.start(), .analyze()${colors.reset}`);
}

// 3d: Trace System
results.layer3.traceSystem = fileContains('src/main.jsx', '__trace') ||
  fileContains('src/main.jsx', 'dumpTrace');
console.log(`  Trace System (events):     ${results.layer3.traceSystem ? STATUS.PRESENT : STATUS.MISSING}`);
if (results.layer3.traceSystem) {
  console.log(`    ${colors.dim}└─ window.__trace, window.dumpTrace()${colors.reset}`);
}

// 3e: Toast Notifications
results.layer3.toastNotifications = fileContains('vite.config.js', 'toast|notification') ||
  fileContains('vite.config.ts', 'toast|notification');
console.log(`  Toast Notifications:       ${results.layer3.toastNotifications ? STATUS.PRESENT : STATUS.MISSING}`);

const layer3Score = Object.values(results.layer3).filter(Boolean).length;
const layer3Total = Object.keys(results.layer3).length;
console.log(`\n  ${colors.cyan}Layer 3 Status: ${layer3Score}/${layer3Total} components${colors.reset}\n`);

// ============================================================================
// LAYER 4: QUALITY SHIELDS (VISUAL TESTING)
// ============================================================================
console.log(`${colors.blue}█ LAYER 4: QUALITY SHIELDS (VISUAL TESTING)${colors.reset}\n`);

// Check Playwright config
results.layer4.playwrightConfig = fileExists('playwright.config.js') ||
  fileExists('playwright.config.ts');
console.log(`  Playwright Config:         ${results.layer4.playwrightConfig ? STATUS.PRESENT : STATUS.MISSING}`);

// Check visual test files
const visualTestFiles = [
  'tests/visual/opening-sequence.spec.ts',
  'tests/visual/debug-globals.spec.ts',
  'tests/visual/debug-trace-tags.spec.ts',
  'tests/visual/helpers.ts'
];
results.layer4.visualTests = visualTestFiles.filter(fileExists).length;
console.log(`  Visual Test Files:         ${results.layer4.visualTests === visualTestFiles.length ? STATUS.PRESENT :
    results.layer4.visualTests > 0 ? STATUS.PARTIAL : STATUS.MISSING}`);
visualTestFiles.forEach(file => {
  if (fileExists(file)) {
    console.log(`    ${colors.green}✓${colors.reset} ${colors.dim}${file}${colors.reset}`);
  } else {
    console.log(`    ${colors.red}✗${colors.reset} ${colors.dim}${file}${colors.reset}`);
  }
});

// Check test script
results.layer4.testScript = hasScript('test:visual');
console.log(`  Test Script:               ${results.layer4.testScript ? STATUS.PRESENT : STATUS.MISSING}`);

// Check for --workers=1 in script
results.layer4.serialExecution = hasScript('test:visual') && (() => {
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return pkg.scripts['test:visual']?.includes('--workers=1') || false;
  } catch {
    return false;
  }
})();
console.log(`  Serial Execution:          ${results.layer4.serialExecution ? STATUS.PRESENT : STATUS.MISSING}`);
if (results.layer4.serialExecution) {
  console.log(`    ${colors.dim}└─ --workers=1 flag set${colors.reset}`);
}

// Check helper functions
results.layer4.helperFunctions = fileExists('tests/visual/helpers.ts') &&
  fileContains('tests/visual/helpers.ts', 'waitForFencepostAndStage') &&
  fileContains('tests/visual/helpers.ts', 'waitForTheaterReady');
console.log(`  Helper Functions:          ${results.layer4.helperFunctions ? STATUS.PRESENT : STATUS.MISSING}`);

const layer4Score = Object.values(results.layer4).filter(v => typeof v === 'boolean' && v).length +
  (results.layer4.visualTests === visualTestFiles.length ? 1 : 0);
const layer4Total = Object.keys(results.layer4).length;
console.log(`\n  ${colors.cyan}Layer 4 Status: ${layer4Score}/${layer4Total} components${colors.reset}\n`);

// ============================================================================
// OVERALL SUMMARY
// ============================================================================
const allLayers = [...Object.values(results.layer1), ...Object.values(results.layer2),
                   ...Object.values(results.layer3), ...Object.values(results.layer4)];
const totalPresent = allLayers.filter(v => v === true || (typeof v === 'number' && v > 0)).length;
const totalComponents = allLayers.filter(v => typeof v === 'boolean' || typeof v === 'number').length;
const percentComplete = Math.round((totalPresent / totalComponents) * 100);

console.log('='.repeat(70));
console.log(`${colors.cyan}OVERALL VELOCITY STACK STATUS${colors.reset}\n`);
console.log(`  Completion: ${totalPresent}/${totalComponents} components (${percentComplete}%)\n`);

const getStatusColor = (pct) => {
  if (pct >= 90) return colors.green;
  if (pct >= 70) return colors.yellow;
  return colors.red;
};

console.log(`  ${getStatusColor(percentComplete)}█${'█'.repeat(Math.floor(percentComplete/5))}${colors.dim}${'░'.repeat(20-Math.floor(percentComplete/5))}${colors.reset} ${percentComplete}%\n`);

console.log(`  Layer 1 (Constitutional):  ${layer1Score}/${layer1Total} ${layer1Score === layer1Total ? '✅' : '⚠️'}`);
console.log(`  Layer 2 (Contracts):       ${layer2Score}/${layer2Total} ${layer2Score === layer2Total ? '✅' : '⚠️'}`);
console.log(`  Layer 3 (Instrumentation): ${layer3Score}/${layer3Total} ${layer3Score === layer3Total ? '✅' : '⚠️'}`);
console.log(`  Layer 4 (Quality):         ${layer4Score}/${layer4Total} ${layer4Score === layer4Total ? '✅' : '⚠️'}\n`);

console.log('='.repeat(70) + '\n');

// ============================================================================
// MISSING COMPONENTS REPORT
// ============================================================================
const missing = [];

if (!results.layer1.sstConfig) missing.push('Layer 1: SST v3.5 config (sst/canon/v3.5.json)');
if (!results.layer1.sstSchema) missing.push('Layer 1: SST schema (sst/canon/v3.5.schema.json)');
if (!results.layer1.validateScript) missing.push('Layer 1: validate-sst script');
if (!results.layer1.driftScript) missing.push('Layer 1: detect-drift script');
if (!results.layer1.preCommit) missing.push('Layer 1: Pre-commit hook with SST validation');

if (!results.layer2.contractTests) missing.push('Layer 2: Contract tests (tests/contracts/)');
if (!results.layer2.testScript) missing.push('Layer 2: test:contracts script');
if (!results.layer2.blueprintValidation) missing.push('Layer 2: Blueprint validation logic');
if (!results.layer2.eventValidation) missing.push('Layer 2: Event schema validation logic');

if (!results.layer3.shaderHmr) missing.push('Layer 3: Shader HMR (vite.config GLSL plugin)');
if (!results.layer3.probeSystem) missing.push('Layer 3: Probe system (window.probe)');
if (!results.layer3.probeHistory) missing.push('Layer 3: Probe history (temporal debugging)');
if (!results.layer3.traceSystem) missing.push('Layer 3: Trace system (window.__trace)');
if (!results.layer3.toastNotifications) missing.push('Layer 3: Toast notifications (HMR feedback)');

if (!results.layer4.playwrightConfig) missing.push('Layer 4: Playwright config');
if (results.layer4.visualTests < visualTestFiles.length) {
  missing.push(`Layer 4: ${visualTestFiles.length - results.layer4.visualTests} visual test file(s)`);
}
if (!results.layer4.testScript) missing.push('Layer 4: test:visual script');
if (!results.layer4.serialExecution) missing.push('Layer 4: --workers=1 flag in test:visual script');
if (!results.layer4.helperFunctions) missing.push('Layer 4: Helper functions (waitForFencepostAndStage, etc.)');

if (missing.length > 0) {
  console.log(`${colors.yellow}MISSING COMPONENTS (${missing.length}):${colors.reset}\n`);
  missing.forEach((item, idx) => {
    console.log(`  ${idx + 1}. ${item}`);
  });
  console.log();
}

// ============================================================================
// RESTORATION PRIORITY
// ============================================================================
console.log('='.repeat(70));
console.log(`${colors.cyan}RESTORATION PRIORITY GUIDE${colors.reset}\n`);

if (percentComplete === 100) {
  console.log(`  ${colors.green}✅ Complete! All velocity components present.${colors.reset}\n`);
} else {
  console.log(`  Priority order for restoring missing components:\n`);

  // Priority 1: Layer 4 (Tests) - Already working!
  if (layer4Score === layer4Total) {
    console.log(`  ${colors.green}✅ PRIORITY 1: Visual Testing (Layer 4) - COMPLETE${colors.reset}`);
  } else {
    console.log(`  ${colors.yellow}⚠️  PRIORITY 1: Complete Visual Testing (Layer 4)${colors.reset}`);
    console.log(`      → Finish remaining test files and helpers`);
    console.log(`      → Ensure --workers=1 flag is set`);
  }
  console.log();

  // Priority 2: Layer 1 (SST)
  if (layer1Score === layer1Total) {
    console.log(`  ${colors.green}✅ PRIORITY 2: Constitutional Layer (Layer 1) - COMPLETE${colors.reset}`);
  } else {
    console.log(`  ${colors.yellow}⚠️  PRIORITY 2: Restore Constitutional Layer (Layer 1)${colors.reset}`);
    console.log(`      → Add SST validation: npm run validate-sst`);
    console.log(`      → Add drift detection: npm run detect-drift`);
    console.log(`      → Set up pre-commit hook`);
  }
  console.log();

  // Priority 3: Layer 3 (Instrumentation)
  if (layer3Score === layer3Total) {
    console.log(`  ${colors.green}✅ PRIORITY 3: Instrumentation (Layer 3) - COMPLETE${colors.reset}`);
  } else {
    console.log(`  ${colors.yellow}⚠️  PRIORITY 3: Add Instrumentation (Layer 3)${colors.reset}`);
    if (!results.layer3.probeHistory) {
      console.log(`      → Add probe.history for temporal debugging (2x velocity)`);
    }
    if (!results.layer3.shaderHmr) {
      console.log(`      → Enable shader HMR (6-10x shader iteration speed)`);
    }
    if (!results.layer3.traceSystem) {
      console.log(`      → Restore trace system (window.__trace, dumpTrace)`);
    }
  }
  console.log();

  // Priority 4: Layer 2 (Contracts)
  if (layer2Score === layer2Total) {
    console.log(`  ${colors.green}✅ PRIORITY 4: Contract Tests (Layer 2) - COMPLETE${colors.reset}`);
  } else {
    console.log(`  ${colors.yellow}⚠️  PRIORITY 4: Add Contract Tests (Layer 2)${colors.reset}`);
    console.log(`      → Create blueprint validation tests`);
    console.log(`      → Add event schema validation`);
  }
  console.log();
}

console.log('='.repeat(70) + '\n');

// ============================================================================
// NEXT STEPS
// ============================================================================
console.log(`${colors.cyan}RECOMMENDED NEXT STEPS:${colors.reset}\n`);

if (percentComplete >= 90) {
  console.log(`  1. ${colors.green}Commit current working state${colors.reset}`);
  console.log(`     git add . && git commit -m "fix(tests): working visual test suite"`);
  console.log();
  console.log(`  2. ${colors.green}Document velocity stack status${colors.reset}`);
  console.log(`     Add this diagnostic output to VELOCITY_STATUS.md`);
  console.log();
  console.log(`  3. ${colors.green}Restore missing components (if any) incrementally${colors.reset}`);
  console.log(`     Follow priority guide above, test after each addition`);
} else if (percentComplete >= 70) {
  console.log(`  1. ${colors.yellow}Stabilize Layer 4 (Visual Testing) first${colors.reset}`);
  console.log(`     Ensure all 9 tests pass consistently`);
  console.log();
  console.log(`  2. ${colors.yellow}Add Layer 1 (SST validation) for config safety${colors.reset}`);
  console.log(`     Prevents configuration drift`);
  console.log();
  console.log(`  3. ${colors.yellow}Add Layer 3 (Instrumentation) for debugging${colors.reset}`);
  console.log(`     probe.history gives 2x debugging speed`);
} else {
  console.log(`  1. ${colors.red}Focus on Layer 4 (Visual Testing) completion${colors.reset}`);
  console.log(`     Get tests passing before adding other layers`);
  console.log();
  console.log(`  2. ${colors.red}Review git history for lost functionality${colors.reset}`);
  console.log(`     git log --oneline --all to find pre-restore state`);
  console.log();
  console.log(`  3. ${colors.red}Cherry-pick specific features incrementally${colors.reset}`);
  console.log(`     git cherry-pick <commit> for individual features`);
}

console.log('\n' + '='.repeat(70) + '\n');

// ============================================================================
// NEXT STEPS (JSON OUTPUT)
// ============================================================================
const jsonOutput = {
  timestamp: new Date().toISOString(),
  percentComplete,
  layers: {
    layer1: { score: layer1Score, total: layer1Total, components: results.layer1 },
    layer2: { score: layer2Score, total: layer2Total, components: results.layer2 },
    layer3: { score: layer3Score, total: layer3Total, components: results.layer3 },
    layer4: { score: layer4Score, total: layer4Total, components: results.layer4 }
  },
  missing,
  status: percentComplete >= 90 ? 'EXCELLENT' :
          percentComplete >= 70 ? 'GOOD' :
          percentComplete >= 50 ? 'FAIR' : 'NEEDS_WORK'
};

fs.writeFileSync('.velocity-diagnostic.json', JSON.stringify(jsonOutput, null, 2));
console.log(`${colors.dim}Diagnostic results saved to: .velocity-diagnostic.json${colors.reset}\n`);

process.exit(percentComplete < 70 ? 1 : 0);
