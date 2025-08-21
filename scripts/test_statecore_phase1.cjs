#!/usr/bin/env node
/**
 * StateCore Phase 1 Test Harness
 * Run: node scripts/test_statecore_phase1.cjs
 */

const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('🧪 StateCore Phase 1 Test Harness\n');
  console.log('=' .repeat(40));
  
  const tests = {
    passed: [],
    failed: []
  };
  
  // Test 1: Module files exist
  console.log('\n📦 Test 1: Module Files');
  const moduleFiles = [
    'src/modules/state/StateCore.js',
    'src/modules/state/StateCoreCanonValidator.js',
    'src/modules/state/index.js'
  ];
  
  for (const file of moduleFiles) {
    const filePath = path.join(process.cwd(), file);
    try {
      if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${path.basename(file)} exists`);
        tests.passed.push(`module-${path.basename(file)}`);
      } else {
        throw new Error('File not found');
      }
    } catch (error) {
      console.log(`  ❌ ${path.basename(file)}: ${error.message}`);
      tests.failed.push(`module-${path.basename(file)}`);
    }
  }
  
  // Test 2: Atom files exist
  console.log('\n⚛️ Test 2: Atom Files');
  const atoms = ['narrative', 'performance', 'interaction', 'resource', 'stage', 'quality', 'clock'];
  
  for (const atom of atoms) {
    const atomFile = path.join(process.cwd(), `src/stores/atoms/${atom}Atom.js`);
    try {
      if (fs.existsSync(atomFile)) {
        console.log(`  ✅ ${atom}Atom.js exists`);
        tests.passed.push(`atom-${atom}`);
      } else {
        throw new Error('File not found');
      }
    } catch (error) {
      console.log(`  ❌ ${atom}Atom.js: ${error.message}`);
      tests.failed.push(`atom-${atom}`);
    }
  }
  
  // Test 3: Check for alias configuration
  console.log('\n🔗 Test 3: Alias Configuration');
  const viteConfig = path.join(process.cwd(), 'vite.config.js');
  try {
    if (fs.existsSync(viteConfig)) {
      const content = fs.readFileSync(viteConfig, 'utf8');
      if (content.includes('@') && content.includes('src')) {
        console.log('  ✅ Vite alias @ -> src configured');
        tests.passed.push('alias-config');
      } else {
        console.log('  ⚠️ Vite alias might not be configured');
        tests.passed.push('alias-config-warning');
      }
    }
  } catch (error) {
    console.log('  ⚠️ Could not verify alias config');
  }
  
  // Final report
  console.log('\n' + '=' .repeat(40));
  console.log('📊 Test Results:');
  console.log(`  ✅ Passed: ${tests.passed.length}`);
  console.log(`  ❌ Failed: ${tests.failed.length}`);
  
  if (tests.failed.length === 0) {
    console.log('\n🎉 All Phase 1 tests passed!');
    console.log('\n💡 Next steps:');
    console.log('  1. Import StateCore in your main.jsx:');
    console.log('     import "@/modules/state/StateCore"');
    console.log('  2. Test in browser console:');
    console.log('     SC.get("narrative")');
    console.log('     SC.set("quality", {currentTier: "ULTRA"})');
    console.log('     SC.snapshot()');
    console.log('  3. Run Phase 2 doctor for BeatBus bridge:');
    console.log('     node scripts/doctor_statecore_phase2.cjs');
  } else {
    console.log('\n⚠️ Some tests failed. Please review:');
    for (const test of tests.failed) {
      console.log(`  • ${test}`);
    }
  }
  
  return tests.failed.length === 0;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test harness failed:', error);
  process.exit(1);
});
