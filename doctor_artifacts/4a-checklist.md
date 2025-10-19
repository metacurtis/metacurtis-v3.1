# Phase 4a Verification Checklist

## Pre-flight Checks
- [ ] Current branch: phase4-statecore-consolidation
- [ ] Baseline metrics captured
- [ ] Dev server running

## Static Verification (Post-Patch)
- [ ] 1 bus instance(s) found (target: 1)
- [ ] ✓ Global export present
- [ ] ✓ Canon calls detected
- [ ] 18 total dispose debt (for phase 4b)

## Runtime Verification
1. Open browser console
2. Run verification script from `doctor_artifacts/4a-verify.js`
3. Confirm:
   - [ ] window.BeatBus exists
   - [ ] No duplicate event handlers
   - [ ] Single reaction per emit

## Smoke Tests
- [ ] Stage navigation works (1→2→3)
- [ ] Quality changes work (LOW→MEDIUM→HIGH)
- [ ] No console errors
- [ ] Performance unchanged from baseline

## Status
✅ Patches applied - test thoroughly
✅ No blocking issues

## Next Phase
Ready for Phase 4b (HMR Hygiene) once all checks pass
