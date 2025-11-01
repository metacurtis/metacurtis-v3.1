# CDP v2.0 Quick Reference

## Daily Commands

```bash
# Start work (automatic savepoint + spec baseline)
npm run cdp:start feat/topic

# Validation helpers
npm run cdp:check        # Spec only (validate-sst + detect-drift)
npm run cdp:probe        # Probes only (requires dev server)
npm run cdp:validate     # Spec + probes

# Commit with enforcement
npm run cdp:commit "message"

# Emergency escapes (audit logged)
npm run cdp:commit --skip-probes "message"
npm run cdp:commit --skip-all "message"
```

## Savepoint Management

```bash
npm run cdp:savepoint:list          # Show savepoints
npm run cdp:savepoint "description" # Manual savepoint
npm run cdp:rollback <tag>          # Reset to savepoint
npm run cdp:rollback --last         # Reset to previous tag
```

## Validation Coverage

- ✅ SST schema validation (`validate-sst`)
- ✅ Drift detection (`detect-drift`)
- ✅ Probe assertions via Playwright
- ⚠️ Visual triggers → warning (use `npm run test:visual`)

## Manual Utilities

```bash
npm run validate-sst   # Schema only
npm run detect-drift   # Hardcoded value scan
npm run cdp:probe      # Structured probes (headless)
npm run test:visual    # Visual regression suite
```

## Probe Schema (`.cdp/probe-schema.json`)

```json
{
  "probes": {
    "probeName": {
      "context": "const data = window.probe.draw();",
      "assertion": "data.active === data.draw",
      "required": true,
      "timeout": 5000,
      "errorMessage": "Particle count mismatch"
    }
  }
}
```

## Visual Test Triggers

Run `npm run test:visual` when staged changes touch:

- `src/shaders/**/*.glsl`
- `src/components/webgl/**`
- `src/engine/**`

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Probes fail | `cat .cdp/probe-results/latest.json` |
| Savepoints missing | `npx husky install` and retry |
| Spec commands missing | Add `validate-sst` / `detect-drift` to package scripts |
| Dev server unreachable | Run `npm run dev` and verify `config.probes.url` |

## Configuration (`.cdp/config.json`)

```json
{
  "automation": {
    "savepoints": { "enabled": true, "autoCreate": true },
    "validation": { "specCheck": "always", "probes": "pre-commit" }
  },
  "enforcement": {
    "blockOnSpecFail": true,
    "blockOnProbeFail": true
  }
}
```

## Metrics Targets

- Validation cycle < **5s**
- Probe pass rate ≥ **95%**
- Drift incidents = **0**

---

**Full docs:** [CDP v2.0 Playbook](./Constitutional_Development_Protocol_v2.0.md)
