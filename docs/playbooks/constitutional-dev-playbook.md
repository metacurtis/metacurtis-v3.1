# Constitutional Development Playbook (CDP + Canon + Patch/Probe)

One-liner: **spec → patch → probes → (optional) visual test → commit**

## 0) Savepoint
```bash
git checkout -b feat/<topic>
git add -A && git commit -m "savepoint: before <topic>"
```

## 1) SPEC (SST is law)

```bash
npm run validate-sst
npm run detect-drift
```

## 2) PATCH (tiny)

Apply unified diff from AI/Kodex only to allowed files.

## 3) PROBES

In DevTools:

```js
await __consciousnessEngine.loadFont();
__consciousnessEngine.clearCache();
window.theaterDirector.forceStart();

probe.draw();                   // draw === active === count
probe.aabb({fitFrac:0.82});     // pass
probe.compareAtmoTarget();       // endpointsDifferent: true
// trace morph via HUD or your morph probe → 1.0 in ≤2.2s
```

## 4) (Optional) Visual tests

```bash
npm run test:visual
```

## 5) COMMIT (atomic)

```bash
git add -A
git commit -m "fix(opening): deterministic 3D text; single-writer; guarded emergence"
```
