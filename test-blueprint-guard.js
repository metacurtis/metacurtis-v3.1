// Test Blueprint Guard V2
console.log('=== Testing Blueprint Guard V2 ===');

// Wait for everything to load
setTimeout(() => {
  // Test 1: Check if guard is loaded
  if (window.CANON_CONSOLE?.loaded?.blueprintGuard) {
    console.log('✓ Blueprint Guard loaded');
  } else {
    console.log('✗ Blueprint Guard not loaded');
  }
  
  // Test 2: Emit bad blueprint
  if (window.BeatBus && window.EVENTS?.BLUEPRINT_READY) {
    window.BeatBus.emit(window.EVENTS.BLUEPRINT_READY, {
      stage: 'test',
      quality: 'HIGH',
      blueprint: { particleCount: 100 } // Missing required fields
    });
    console.log('✓ Bad blueprint emitted');
    
    // Check for incidents
    setTimeout(() => {
      const incidents = window.CANON_CONSOLE?.incidents?.get?.() || [];
      const found = incidents.filter(i => 
        i.code === 'BLUEPRINT_INVALID' || 
        i.code === 'BLUEPRINT_FALLBACK_APPLIED'
      );
      
      if (found.length > 0) {
        console.log('✓ Blueprint Guard working! Incidents:', found);
      } else {
        console.log('⚠ No Blueprint Guard incidents yet');
      }
    }, 500);
  }
}, 1000);