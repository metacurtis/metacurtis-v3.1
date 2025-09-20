// Test Contract Validation
console.log('=== Testing Contract Validation ===');

// Test 1: Emit with deprecated field
console.log('Test 1: Deprecated field (quality -> tier)');
window.BeatBus.emit('QUALITY_CHANGE', { quality: 'HIGH' });

// Test 2: Missing required field
setTimeout(() => {
  console.log('Test 2: Missing required fields');
  window.BeatBus.emit('STAGE_CHANGE', { from: 'genesis' }); // Missing 'to'
}, 500);

// Test 3: Invalid value
setTimeout(() => {
  console.log('Test 3: Invalid tier value');
  window.BeatBus.emit('QUALITY_CHANGE', { tier: 'SUPER' }); // Invalid tier
}, 1000);

// Test 4: Check stats
setTimeout(() => {
  console.log('Test 4: Contract validation stats:');
  console.log(window.CANON_CONTRACT_TAP?.getStats?.());
  
  // Check incidents
  const incidents = window.CANON_CONSOLE?.incidents?.get?.() || [];
  const contractIncidents = incidents.filter(i => 
    i.code === 'CONTRACT_VIOLATION' || 
    i.code === 'DEPRECATED_FIELD'
  );
  
  console.log('Contract incidents:', contractIncidents);
}, 1500);
