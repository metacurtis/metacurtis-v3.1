
// Phase 4a Verification Script
// Run this in your browser console after refreshing the app

console.log('=== Phase 4a Bus Topology Verification ===');

// Check 1: Single instance
if (window.BeatBus) {
  console.log('✓ window.BeatBus exists');
  console.log('  Instance location:', window.__BEATBUS_INSTANCE || 'unknown');
  
  // Test imports match global
  import('src/src/modules/orchestration/core/BeatBus.js').then(module => {
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
