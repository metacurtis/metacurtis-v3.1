// Pilot Open Guard (DEV): hold Pilot Auto OFF until __OPENING_DONE__, then restore
(function(){
  if (import.meta.env?.PROD) return;
  if (globalThis.__PILOT_OPEN_GUARD__) return;
  globalThis.__PILOT_OPEN_GUARD__ = true;

  let savedAuto = null;
  function forceOff() {
    try {
      const s = globalThis.CANON_PILOT?.getStatus?.();
      if (savedAuto === null && s && typeof s.auto === 'boolean') savedAuto = s.auto;
      globalThis.CANON_PILOT?.setAuto?.(false);
      // noisy only first few times
    } catch {}
  }
  function restore() {
    try {
      const target = (savedAuto === null) ? true : !!savedAuto;
      globalThis.CANON_PILOT?.setAuto?.(target);
      console.log('✅ Pilot Auto restored after opening:', target);
    } catch {}
  }

  // Enforce OFF until opening completes, check frequently to beat loader races
  const iv = setInterval(() => {
    if (!globalThis.__OPENING_DONE__) {
      forceOff();
    } else {
      clearInterval(iv);
      restore();
    }
  }, 200);

  // Also apply immediately and once after load
  setTimeout(forceOff, 0);
  window.addEventListener('load', forceOff, { once:true });

  console.log('⏹ Pilot Auto hold engaged (until opening complete)');
})();