
// Phase 4b HMR Verification Script
// Automated stability test

console.log('=== Phase 4b HMR Hygiene Verification ===');

const results = {
  initial: null,
  afterHMR1: null,
  afterHMR2: null,
  testHandlerCount: 0
};

// Helper to get listener count
const getListenerCount = () => {
  if (!window.BeatBus?.getDebugInfo) {
    return { total: 'N/A', details: 'Debug info not available' };
  }
  const info = window.BeatBus.getDebugInfo();
  if (typeof info === 'object' && info.listeners) {
    return { 
      total: Object.values(info.listeners).reduce((sum, arr) => sum + arr.length, 0),
      details: info.listeners 
    };
  }
  return { total: info, details: null };
};

// Capture initial state
results.initial = getListenerCount();
console.log('Initial listeners:', results.initial.total);

// Test handler
const testHandler = () => results.testHandlerCount++;
window.BeatBus?.on('HMR_TEST_4B', testHandler);

// Instructions for manual HMR test
console.log('\n📝 Manual steps required:');
console.log('1. Save any source file to trigger HMR');
console.log('2. Run: verifyHMR1()');
console.log('3. Save again for second HMR');  
console.log('4. Run: verifyHMR2()');

// First HMR check
window.verifyHMR1 = () => {
  results.afterHMR1 = getListenerCount();
  console.log('After HMR 1:', results.afterHMR1.total);
  
  // Test event
  results.testHandlerCount = 0;
  window.BeatBus?.emit('HMR_TEST_4B', {});
  console.log('Test handler fired', results.testHandlerCount, 'times (expect 1)');
  
  if (results.afterHMR1.total > results.initial.total) {
    console.error('❌ FAIL: Listener count grew after HMR!');
    console.log('Delta:', results.afterHMR1.total - results.initial.total);
  } else {
    console.log('✅ PASS: Listener count stable after first HMR');
  }
};

// Second HMR check
window.verifyHMR2 = () => {
  results.afterHMR2 = getListenerCount();
  console.log('After HMR 2:', results.afterHMR2.total);
  
  // Final verdict
  const stable = results.initial.total === results.afterHMR1.total && 
                 results.afterHMR1.total === results.afterHMR2.total;
  
  if (stable) {
    console.log('✅ PASS: HMR cleanup working correctly!');
  } else {
    console.error('❌ FAIL: Listener leak detected');
    console.log('Progression:', results.initial.total, '→', 
                results.afterHMR1.total, '→', results.afterHMR2.total);
  }
  
  // Cleanup
  window.BeatBus?.off('HMR_TEST_4B', testHandler);
  
  return stable ? 'PASS' : 'FAIL';
};

console.log('=== Setup Complete ===');
