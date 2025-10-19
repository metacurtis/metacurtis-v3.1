# Dev-OS Quick Ops (Minimal Day-to-Day)
**Goal:** Max velocity, low complexity.

## Loop (5 steps)
1) `npm run dev` → HUD (Alt+`) → **Run Opening Macro** → **Verify FPS**
2) Tune **Director** offsets; renderer only **lerps**; overlay stays **dumb**
3) `npm run validate:opening` (STRICT)  •  If iterating: `SST_RELAXED=1 npm run validate:opening`
4) (Optional) `npm run ci:fencepost` for opening changes
5) Commit when green

## Helpers
```js
await window.CANON_INJECTOR?.ready?.();
window.CANON_CONSOLE.stats();           // flags + bus counts + mode
window.theaterDirector?.forceStart?.(); // kick opening
window.hotdors?.selfverifyATS?.();      // event order
CANON_CONSOLE?.runStep?.('set_draw_range_from_uniforms');
```

## Keep it simple
- One injector • One writer • One contract • One fencepost.
