# Phase 4b HMR Hygiene Verification Checklist

## Summary
- Files analyzed: 111
- Total listeners: 33
- Captured unsubs: 6
- Uncaptured: 27
- DOM listeners: 18
- Total debt: 28
- Bridge debt: 2
- Patches applied: 13

## Top Leaky Files
- src/components/theater/OpeningSequence.jsx: debt=8
- src/engine/ConsciousnessEngine.js: debt=4
- src/components/consciousness/ConsciousnessTheater.jsx: debt=3
- src/bootstrap/wireSSTv3.js: debt=2
- src/canon-guard/runtime/GuardRuntimeInject.js: debt=2

## Verification Steps
1. [ ] Run dev server: `npm run dev`
2. [ ] Open browser console
3. [ ] Paste and run: `doctor_artifacts/4b-verify.js`
4. [ ] Trigger HMR by saving a file
5. [ ] Run: `verifyHMR1()`
6. [ ] Trigger HMR again
7. [ ] Run: `verifyHMR2()`
8. [ ] Confirm: PASS result

## Acceptance Criteria
- [ ] Listener count stable across 2 HMR cycles
- [ ] Test events fire exactly once
- [ ] No console errors
- [ ] Stage/quality changes still work

## Status
✅ Patches applied
⚠️ Bridge debt: 2
⚠️ Total debt: 28

## Next Phase
Review remaining debt before proceeding
