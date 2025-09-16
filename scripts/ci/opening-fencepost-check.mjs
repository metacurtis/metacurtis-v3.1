#!/usr/bin/env node
const TIMEOUT_MS = 15000;
(async()=>{ let pw; try{ pw = await import('playwright'); }catch{ console.log('Playwright not installed. Run: npx playwright install'); process.exit(3); }
  const { chromium } = pw; const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    const url = process.env.CANON_DEV_URL || 'http://localhost:5173';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.evaluate(()=>{ localStorage.setItem('canonHud:visible','true'); localStorage.setItem('canonBusMode','TELEMETRY'); });
    await page.reload({ waitUntil:'domcontentloaded' });
    await page.waitForFunction(()=>window.CANON_INJECTOR&&window.CANON_INJECTOR.ready, { timeout: 5000 });
    await page.evaluate(()=>window.CANON_INJECTOR.ready());
    const ok = await page.evaluate(({timeout})=>new Promise(res=>{
      let done=false; const to=setTimeout(()=>{ if(!done) res(false); }, timeout);
      const off = window.BeatBus?.on?.('PARTICLES_EMERGED', ()=>{ if(!done){ done=true; clearTimeout(to); res(true);} });
      window.theaterDirector?.forceStart?.();
    }), { timeout: TIMEOUT_MS });
    await browser.close(); if(ok){ console.log('Fencepost OK'); process.exit(0); }
    console.error('Fencepost TIMEOUT'); process.exit(2);
  } catch(e) { await browser.close(); console.error('Fencepost ERROR:', e&&e.message||e); process.exit(2); }
})();