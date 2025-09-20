// Test SST v3.3 Contract Validation
console.log('=== Testing SST v3.3 Contracts ===\n');

// Test 1: Valid events
console.log('Test 1: Valid events');
window.BeatBus.emit('CURSOR_BLINK', { count: 2, interval: 250 });
window.BeatBus.emit('ENGINE_VIEWPORT_HINT', { width: 1920, height: 1080 });
console.log('✓ Valid events emitted\n');

// Test 2: Migration (quality -> tier)
setTimeout(() => {
  console.log('Test 2: Field migration');
  window.BeatBus.emit('QUALITY_CHANGE', { quality: 'HIGH' });
  console.log('Should auto-migrate quality -> tier\n');
}, 500);

// Test 3: Missing required fields
setTimeout(() => {
  console.log('Test 3: Missing required field');
  window.BeatBus.emit('STAGE_CHANGE', { from: 'genesis' }); // Missing 'to'
  console.log('Should show violation\n');
}, 1000);

// Test 4: Invalid constraint
setTimeout(() => {
  console.log('Test 4: Constraint violation');
  window.BeatBus.emit('MORPH_PROGRESS', { value: 1.5 }); // > 1
  console.log('Should show constraint violation\n');
}, 1500);

// Test 5: Check results
setTimeout(() => {
  console.log('=== Results ===');
  console.log('Contract stats:', window.CANON_CONTRACT_TAP?.getStats?.());
  
  const incidents = window.CANON_CONSOLE?.incidents?.get?.() || [];
  const contractIncidents = incidents.filter(i => 
    i.code === 'CONTRACT_VIOLATION' || 
    i.code === 'DEPRECATED_FIELD'
  );
  
  if (contractIncidents.length > 0) {
    console.log('\nContract incidents detected:');
    contractIncidents.forEach(i => {
      console.log(`  - ${i.code}: ${i.message}`);
    });
  }
  
  console.log('\n✓ Contract validation active!');
}, 2000);