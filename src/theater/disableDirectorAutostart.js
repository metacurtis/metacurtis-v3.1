// src/theater/disableDirectorAutostart.js
//
// Ensures TheaterDirector auto-start logic stays disabled when
// ConsciousnessTheater orchestrates start-up sequencing manually.
//
// Also detects demo mode via URL param for isolated demo rendering.

if (typeof globalThis !== 'undefined') {
  globalThis.__DISABLE_DIRECTOR_AUTOSTART__ = true;
}

// Demo mode detection (browser only)
if (typeof window !== 'undefined') {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const demoKey = urlParams.get('demo');
    
    if (demoKey) {
      globalThis.__DEMO_MODE__ = true;
      globalThis.__DEMO_KEY__ = demoKey;
      console.log(`[DisableAutostart] Demo mode enabled: ${demoKey}`);
    }
  } catch (e) {
    // Silent fail if URL parsing fails (edge cases)
  }
}
