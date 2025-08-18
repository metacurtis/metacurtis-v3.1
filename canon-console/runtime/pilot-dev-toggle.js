// DEV: turn Pilot Auto OFF to avoid interference during sequencing debug
setTimeout(()=>{ try { globalThis.CANON_PILOT?.setAuto?.(false); console.log('⏹ Pilot Auto OFF (DEV)'); } catch {} }, 0);