// Test BeatBus with Canon Dev-OS integration
console.log('=== Testing BeatBus Contract Integration ===\n');

// Check what contracts are loaded
console.log('Debug info:', window.BeatBus.getDebugInfo());

// Test 1: Emit with old field names (should migrate)
console.log('Test 1: Old field migration');
window.BeatBus.emit('QUALITY_CHANGE', { quality: 'HIGH' });
window.BeatBus.emit('STAGE_CHANGE', { stage: 'discipline' });

// Test 2: Check that Contract-Tap is also working
setTimeout(() => {
  console.log('\nTest 2: Contract-Tap stats');
  const stats = window.CANON_CONTRACT_TAP?.getStats?.();
  if (stats) {
    console.log('Contract validations:', stats);
    console.log('✓ Both BeatBus and Contract-Tap working together');
  }
}, 100);