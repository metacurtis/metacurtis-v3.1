# CDP v2.0 Implementation Guide

This guide walks through a greenfield integration of the Constitutional Development Protocol v2.0 (`@metacurtis/cdp-tools`) into any MetaCurtis project.

---

## 1. Preconditions

- Node.js ≥ 18
- Git initialized repository
- SST configuration (`sst/canon/*.json`) present
- Playwright installed (bundled with tools package)

---

## 2. Install the Tooling

```bash
npm install --save-dev @metacurtis/cdp-tools
npx cdp init
```

`npx cdp init` prompts for:

| Prompt | Suggested Value |
| --- | --- |
| Project name | Auto-detected from folder |
| SST path | `sst/canon/v3.5.json` |
| SST schema | `sst/canon/v3.5.schema.json` |
| Auto-savepoints | **Yes** |
| Install git hooks | **Yes** |

After the wizard finishes you will find:

- `.cdp/config.json`
- `.cdp/probe-schema.json`
- `.cdp/probe-results/`
- `.cdp/savepoints.log`
- Husky hook stubs inside `.husky/`

---

## 3. Verify Scripts

`package.json` gains the following entries:

```json
"scripts": {
  "cdp": "node scripts/cdp-quick.mjs",
  "cdp:start": "node scripts/cdp-start.mjs",
  "cdp:check": "npm run validate-sst && npm run detect-drift",
  "cdp:probe": "node scripts/cdp-probe.mjs",
  "cdp:validate": "npm run cdp:check && npm run cdp:probe",
  "cdp:commit": "node scripts/cdp-commit.mjs",
  "cdp:savepoint": "node scripts/cdp-savepoint.mjs",
  "cdp:savepoint:list": "node scripts/cdp-savepoint.mjs --list",
  "cdp:rollback": "node scripts/cdp-rollback.mjs"
}
```

Confirm they run:

```bash
npm run cdp:check
npm run cdp:probe          # Requires dev server running on http://localhost:5173
npm run cdp:savepoint:list
```

---

## 4. Configure Probes

1. Open `.cdp/probe-schema.json`.
2. Review the default probes (`particleCount`, `geometryBounds`).
3. Add additional probes as needed. Example:

```json
"morphProgress": {
  "description": "Morph progress reaches 1.0 within 2.2s",
  "context": "const tracker = window.probe.morph();",
  "assertion": "tracker.final >= 0.99 && tracker.duration <= 2200",
  "timeout": 3000,
  "required": true
}
```

4. Run `npm run cdp:probe` to validate.

---

## 5. Customize Savepoints

Update `.cdp/config.json` → `automation.savepoints`:

```json
"savepoints": {
  "enabled": true,
  "autoCreate": true,
  "prefix": "cdp-savepoint",
  "maxSavepoints": 20
}
```

To disable auto-savepoints for experimental branches run:

```bash
npm run cdp:start -- --no-savepoint spike/my-experiment
```

---

## 6. Visual Test Strategy

1. Define trigger patterns inside `config.visualTests.mandatoryTriggers`.
2. Optionally set `visualTests.mode` to `required` to block commits when visual suites fail.
3. Keep visual runners fast by scoping Playwright projects according to the trigger list.

---

## 7. Migration from CDP v1.x

1. Remove any manual scripts (`docs/playbooks/constitutional-dev-playbook.md`, custom shell helpers).
2. Delete legacy git hooks that call `validate-sst` or `detect-drift` directly.
3. Move any ad-hoc probes into `.cdp/probe-schema.json`.
4. Onboard the team with the CDP Quick Reference card.
5. Archive old documentation inside `/archive/` if needed for posterity.

---

## 8. CI Integration

Add the following to the pipeline configuration:

```bash
npm run cdp:check
npm run cdp:probe -- --headless --url $PREVIEW_URL
```

Optional push gating:

```bash
npm run cdp:commit "ci: validation" --skip-probes
```

This reuses the same runner logic while allowing CI to skip interactive probes when headless mode is unavailable.

---

## 9. Troubleshooting

| Symptom | Action |
| --- | --- |
| `Probe system not found` | Ensure dev server is running and accessible at `config.probes.url`. |
| `Savepoint creation fails` | Verify git clean status and permission to create annotated tags. |
| `Husky not installed` | Run `npx husky install`. |
| `validate-sst` missing` | Add/restore command in root `package.json`. |

---

## 10. Next Steps

- Share the [CDP Quick Reference](./CDP_Quick_Reference.md) with the team.
- Schedule a short “CDP in 5 minutes” live demo.
- Monitor `.cdp/probe-results/latest.json` during the first week to ensure pass rates stay above 95%.

---

**See Also:**

- [CDP v2.0 Playbook](./Constitutional_Development_Protocol_v2.0.md)
- [Velocity Playbook](../velocity/VELOCITY_PLAYBOOK.md)
- [AI Partner Field Manual](../AI_PARTNER_FIELD_MANUAL.md)

