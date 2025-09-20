#!/usr/bin/env node

const fs = require('fs').promises;

async function main() {
  console.log('=== Fixing BlueprintGuard Integration ===\n');
  
  // Read the current injector
  const injectorPath = 'canon-console/browser/inject.js';
  const content = await fs.readFile(injectorPath, 'utf8');
  
  // Check if already integrated
  if (content.includes('blueprint-guard-v2')) {
    console.log('✓ Blueprint Guard V2 already integrated');
    return;
  }
  
  // Find a better insertion point - after violation-tap
  const marker = "imp('runtime/violation-tap.js', 'vtap')";
  const insertIndex = content.indexOf(marker);
  
  if (insertIndex === -1) {
    console.log('✗ Could not find violation-tap marker');
    console.log('Trying alternate approach...');
    
    // Try after pilot
    const altMarker = "imp('agent/pilot.js', 'pilot'";
    const altIndex = content.indexOf(altMarker);
    
    if (altIndex === -1) {
      console.log('✗ Cannot find suitable insertion point');
      return;
    }
    
    // Find the end of that promise chain
    const endOfChain = content.indexOf('})', altIndex) + 2;
    const injection = `
      .then(function () {
        // Install Blueprint Guard V2
        return imp('runtime/blueprint-guard-v2.js', 'blueprintGuard', function (m) {
          try {
            const BeatBus = w.BeatBus || w.theaterBus?.bus;
            const incidentCollector = w.CANON_CONSOLE?.incidents || { add: console.warn };
            
            // Get EVENTS dynamically
            return tryImport('/src/theater/events.js').then(function(evMod) {
              if (evMod && evMod.EVENTS && m.default) {
                m.default.install(BeatBus, incidentCollector, evMod.EVENTS);
                L.blueprintGuard = true;
                console.log('Blueprint Guard V2 installed');
              }
            });
          } catch (e) { 
            errors.push(e); 
            console.warn('Blueprint Guard V2 error:', e);
          }
        });
      })`;
    
    const updated = content.slice(0, endOfChain) + injection + content.slice(endOfChain);
    await fs.writeFile(injectorPath, updated);
    console.log('✓ Injector updated with Blueprint Guard V2');
    
  } else {
    // Insert after violation-tap
    const lineEnd = content.indexOf(';', insertIndex) + 1;
    const injection = `
      .then(function () {
        // Install Blueprint Guard V2
        return imp('runtime/blueprint-guard-v2.js', 'blueprintGuard', function (m) {
          try {
            const BeatBus = w.BeatBus || w.theaterBus?.bus;
            const incidentCollector = w.CANON_CONSOLE?.incidents || { add: console.warn };
            
            // Get EVENTS dynamically
            return tryImport('/src/theater/events.js').then(function(evMod) {
              if (evMod && evMod.EVENTS && m.default) {
                m.default.install(BeatBus, incidentCollector, evMod.EVENTS);
                L.blueprintGuard = true;
                console.log('Blueprint Guard V2 installed');
              }
            });
          } catch (e) { 
            errors.push(e); 
            console.warn('Blueprint Guard V2 error:', e);
          }
        });
      })`;
    
    const updated = content.slice(0, lineEnd) + injection + content.slice(lineEnd);
    await fs.writeFile(injectorPath, updated);
    console.log('✓ Injector updated with Blueprint Guard V2');
  }
  
  // Create test script
  const testScript = `// Test Blueprint Guard V2
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
}, 1000);`;

  await fs.writeFile('test-blueprint-guard.js', testScript);
  console.log('✓ Test script created\n');
  
  console.log('=== Next Steps ===');
  console.log('1. npm run dev');
  console.log('2. Press F2 to show HUD');
  console.log('3. Copy test-blueprint-guard.js to console');
  console.log('4. Check HUD incidents panel\n');
  
  console.log('Session 1 Complete! ✓');
}

main().catch(console.error);
