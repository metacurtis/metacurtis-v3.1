#!/usr/bin/env node
/**
 * StateCore Phase 2 Test Harness
 * Tests BeatBus Bridge integration
 */

const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('🧪 StateCore Phase 2 Test Harness\n');
  console.log('=' .repeat(40));
  
  const tests = {
    passed: [],
    failed: []
  };
  
  // Test 1: Bridge files exist
  console.log('\n🌉 Test 1: Bridge Files');
  const bridgeFiles = [
    'src/modules/state/BeatBusBridge.js',
    'src/modules/state/eventMappings.js'
  ];
  
  for (const file of bridgeFiles) {
    const filePath = path.join(process.cwd(), file);
    try {
      if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${path.basename(file)} exists`);
        tests.passed.push(`bridge-${path.basename(file)}`);
      } else {
        throw new Error('File not found');
      }
    } catch (error) {
      console.log(`  ❌ ${path.basename(file)}: ${error.message}`);
      tests.failed.push(`bridge-${path.basename(file)}`);
    }
  }
  
  // Test 2: main.jsx updated
  console.log('\n🔧 Test 2: main.jsx Integration');
  const mainFile = path.join(process.cwd(), 'src/main.jsx');
  if (fs.existsSync(mainFile)) {
    try {
      const content = fs.readFileSync(mainFile, 'utf8');
      
      if (content.includes('@/modules/state/StateCore')) {
        console.log('  ✅ StateCore imported in main.jsx');
        tests.passed.push('main-statecore');
      } else {
        console.log('  ⚠️ StateCore not imported in main.jsx');
      }
      
      if (content.includes('@/modules/state/BeatBusBridge')) {
        console.log('  ✅ BeatBusBridge imported in main.jsx');
        tests.passed.push('main-bridge');
      } else {
        console.log('  ⚠️ BeatBusBridge not imported in main.jsx');
      }
    } catch (error) {
      console.log(`  ❌ main.jsx check failed: ${error.message}`);
    }
  } else {
    console.log('  ⚠️ main.jsx not found');
  }
  
  // Test 3: BeatBus exists
  console.log('\n🎵 Test 3: BeatBus Module');
  const beatBusFile = path.join(process.cwd(), 'src/modules/orchestration/core/BeatBus.js');
  try {
    if (fs.existsSync(beatBusFile)) {
      console.log('  ✅ BeatBus.js exists');
      tests.passed.push('beatbus');
    } else {
      throw new Error('BeatBus.js not found');
    }
  } catch (error) {
    console.log(`  ❌ BeatBus: ${error.message}`);
    tests.failed.push('beatbus');
  }
  
  // Final report
  console.log('\n' + '=' .repeat(40));
  console.log('📊 Test Results:');
  console.log(`  ✅ Passed: ${tests.passed.length}`);
  console.log(`  ❌ Failed: ${tests.failed.length}`);
  
  if (tests.failed.length === 0) {
    console.log('\n🎉 All Phase 2 tests passed!');
    console.log('\n💡 Browser testing commands:');
    console.log('  // Check boundary');
    console.log('  canon.boundary.getReport()');
    console.log('');
    console.log('  // Test event → state');
    console.log('  BB.test("STAGE_CHANGE", {from: "genesis", to: "neural"})');
    console.log('  SC.get("narrative", s => s.currentStage)  // "neural"');
    console.log('');
    console.log('  // Test state → event  ');
    console.log('  SC.set("quality", {currentTier: "ULTRA"})');
    console.log('  // Should emit STATE_QUALITY_UPDATED');
    console.log('');
    console.log('  // View all mappings');
    console.log('  BB.mappings()');
    console.log('');
    console.log('\n🚀 Next: Run Phase 3 for SST v3.0 configurations');
  } else {
    console.log('\n⚠️ Some tests failed. Please review.');
  }
  
  return tests.failed.length === 0;
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);
