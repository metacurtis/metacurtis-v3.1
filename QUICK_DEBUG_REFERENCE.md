# MetaCurtis Quick Debug Reference

## 🚨 Emergency: Test Failing?

**1. Identify the layer**
- Config drift? → Layer 1 → `npm run validate-sst`
- Logic/blueprint issue? → Layer 2 → `npm run test:contracts`
- Missing feedback/metrics? → Layer 3 → check browser console
- Visual regression? → Layer 4 → `npm run test:visual`

**2. Run the diagnostic**
```bash
node scripts/velocity-diagnostic.cjs
```

**3. Check the field manual**
- Open `AI_PARTNER_FIELD_MANUAL.md`
- Section 3: map symptom to layer
- Section 4: run diagnostics
- Section 5: apply fix protocol
- Section 7: validation checklist

## 🔍 Quick Checks

```bash
# Full sweep
npm run validate-sst && npm run test:contracts && npm run test:visual

# Targeted spec
npm run test:visual -- -g "keeps genesis morph settled"

# Browser console helpers
window.probe.draw()
window.dumpTrace().length
probe.history.start()
```

## 📖 Full Manual

See `AI_PARTNER_FIELD_MANUAL.md` for complete architecture context, debugging procedures, and rollback guidance.
