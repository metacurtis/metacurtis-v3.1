#!/usr/bin/env node
// scripts/ci/opening-fencepost-check.mjs
// Enhanced CI fencepost check with Canon Dev-OS integration

const TIMEOUT_MS = 15000;
const DEFAULT_URL = process.env.CANON_DEV_URL || process.argv[2] || 'http://localhost:5173';

(async () => {
  let pw;
  try {
    pw = await import('playwright');
  } catch {
    console.error('❌ Playwright not installed. Run: npx playwright install');
    process.exit(3);
  }

  const { chromium } = pw;
  const browser = await chromium.launch({ 
    headless: process.env.CI || true,
    timeout: 30000 
  });
  
  const page = await browser.newPage();
  
  try {
    console.log(`🔍 Testing fencepost at: ${DEFAULT_URL}`);
    
    // Navigate with retry logic
    let connected = false;
    for (let i = 0; i < 3; i++) {
      try {
        await page.goto(DEFAULT_URL, { 
          waitUntil: 'domcontentloaded', 
          timeout: 10000 
        });
        connected = true;
        break;
      } catch (e) {
        console.log(`  Attempt ${i + 1}/3 failed, retrying...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    if (!connected) {
      throw new Error(`Could not connect to ${DEFAULT_URL}`);
    }

    // Configure Canon Dev-OS for testing
    await page.evaluate(() => {
      localStorage.setItem('canonHud:visible', 'true');
      localStorage.setItem('canonBusMode', 'TELEMETRY');
      localStorage.setItem('canonSingleWriter', 'warn'); // Don't fail on GPU writes
    });
    
    await page.reload({ waitUntil: 'domcontentloaded' });
    
    // Wait for Canon Dev-OS
    console.log('  Waiting for Canon Dev-OS...');
    await page.waitForFunction(
      () => window.CANON_INJECTOR && typeof window.CANON_INJECTOR.ready === 'function',
      { timeout: 5000 }
    );
    
    await page.evaluate(() => window.CANON_INJECTOR.ready());
    
    // Use your new OPENING_FENCEPOST playbook!
    console.log('  Running OPENING_FENCEPOST playbook...');
    const result = await page.evaluate(async ({ timeout }) => {
      // Try to use the Canon playbook first
      if (window.CANON_PLAYBOOKS_EXTRA?.OPENING_FENCEPOST) {
        console.log('[CI] Using Canon OPENING_FENCEPOST playbook');
        const result = await window.CANON_PLAYBOOKS_EXTRA.OPENING_FENCEPOST({ 
          timeoutMs: timeout 
        });
        return {
          ok: result.success,
          method: 'playbook',
          duration: result.dt,
          details: result
        };
      }
      
      // Fallback to manual approach
      console.log('[CI] Using manual fencepost check');
      return new Promise(resolve => {
        let done = false;
        const start = performance.now();
        
        const timeoutId = setTimeout(() => {
          if (!done) {
            done = true;
            resolve({ 
              ok: false, 
              method: 'manual',
              duration: performance.now() - start,
              reason: 'timeout'
            });
          }
        }, timeout);
        
        const off = window.BeatBus?.on?.('PARTICLES_EMERGED', () => {
          if (!done) {
            done = true;
            clearTimeout(timeoutId);
            resolve({ 
              ok: true, 
              method: 'manual',
              duration: performance.now() - start
            });
          }
        });
        
        // Force start the director
        if (window.theaterDirector?.forceStart) {
          window.theaterDirector.forceStart();
        } else {
          console.warn('[CI] No theaterDirector.forceStart available');
          resolve({ 
            ok: false, 
            method: 'manual',
            reason: 'no director'
          });
        }
      });
    }, { timeout: TIMEOUT_MS });
    
    // Get Canon Dev-OS stats for debugging
    const canonStats = await page.evaluate(() => {
      return {
        stats: window.CANON_CONSOLE?.stats?.(),
        violations: window.__gpuViolations || [],
        incidents: window.CANON_CONSOLE?.incidents?.get?.() || []
      };
    });
    
    await browser.close();
    
    // Report results
    if (result.ok) {
      console.log(`✅ Fencepost OK (${result.duration}ms via ${result.method})`);
      if (canonStats.violations?.length > 0) {
        console.log(`  ⚠️  GPU violations detected: ${canonStats.violations.length}`);
      }
      process.exit(0);
    } else {
      console.error(`❌ Fencepost TIMEOUT (${result.reason || 'unknown'})`);
      if (canonStats.incidents?.length > 0) {
        console.error(`  Incidents: ${canonStats.incidents.map(i => i.code).join(', ')}`);
      }
      process.exit(2);
    }
    
  } catch (e) {
    await browser.close();
    console.error('❌ Fencepost ERROR:', e.message || e);
    process.exit(2);
  }
})();