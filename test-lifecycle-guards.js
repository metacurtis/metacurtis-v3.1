// Test Lifecycle Guards
console.log('=== Testing Lifecycle Guards ===\n');

// Test 1: Try to emit emergence twice (should fail)
console.log('Test 1: Double emergence');
window.BeatBus.emit('BUILD_EMERGENCE_BLUEPRINT', { mode: 'test' });
window.BeatBus.emit('BUILD_EMERGENCE_BLUEPRINT', { mode: 'test2' });

// Test 2: Rapid stage changes (should warn)
console.log('\nTest 2: Rapid stage changes');
for (let i = 0; i < 3; i++) {
  window.BeatBus.emit('STAGE_CHANGE', { from: 'stage' + i, to: 'stage' + (i+1) });
}

// Test 3: Check guards report
setTimeout(() => {
  console.log('\nLifecycle Guards Report:');
  const guards = window.lifecycleGuards || window.CANON_CONSOLE?.lifecycleGuards;
  if (guards?.getReport) {
    console.log(guards.getReport());
  }
  
  // Check learning insights
  console.log('\nLearning System Insights:');
  if (window.CANON_LEARNING?.getInsights) {
    console.log(window.CANON_LEARNING.getInsights());
  }
  
  // Check incidents
  const incidents = window.CANON_CONSOLE?.incidents?.get?.() || [];
  const lifecycleIncidents = incidents.filter(i => i.code === 'LIFECYCLE_VIOLATION');
  console.log('\nLifecycle violations detected:', lifecycleIncidents.length);
  lifecycleIncidents.forEach(i => {
    console.log(`  - ${i.message}`);
  });
}, 500);