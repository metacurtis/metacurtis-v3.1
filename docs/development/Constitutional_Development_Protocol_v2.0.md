# Constitutional Development Protocol v2.0 (CDP v2.0)

> **Mission:** Deliver spec-driven changes with zero drift, automated validation, and near-instant feedback.

CDP v2.0 replaces the manual “spec → patch → probe” checklist with a scripted workflow backed by the `@metacurtis/cdp-tools` package. The protocol guarantees that every change originates from the SST specification, is validated through reproducible probes, and is captured in atomic savepoints.

---

## 1. Principles

| Pillar | Description | Guarantee |
| --- | --- | --- |
| **Spec First** | CDP reads SST metadata before any patch. | No change ships without schema alignment. |
| **Automated Savepoints** | Git tags + logs capture the working tree at every start/stop. | Rollback is instant, manual snapshots disappear. |
| **Probe Contracts** | Structured probes live in `.cdp/probe-schema.json`. | Renderer/engine drift is detected in <5 seconds. |
| **Enforced Validation** | Git hooks block commits unless spec/probes pass. | 100% compliance with zero ritual. |
| **Targeted Visual Tests** | Visual suites run only when high-impact files change. | Keeps iteration fast while guarding critical paths. |

---

## 2. Installation

```bash
npm install --save-dev @metacurtis/cdp-tools
npx cdp init
```

`npx cdp init` creates the `.cdp/` directory, installs Husky hooks, and injects all CDP scripts into `package.json`.

---

## 3. Daily Workflow

```text
start → patch → cdp:validate → cdp:commit → repeat
```

### 3.1 Start a Work Session

```bash
npm run cdp:start feat/your-topic
```

Actions performed:

1. Creates/updates branch
2. Captures savepoint tag (`cdp-savepoint-<timestamp>`)
3. Runs spec validation + probes baseline
4. Prints TODO checklist

### 3.2 While Coding

| Command | Purpose |
| --- | --- |
| `npm run cdp:check` | SST validation + drift detection only |
| `npm run cdp:probe` | Run probes without spec checks |
| `npm run cdp:validate` | Full validation suite |

The recommended loop is `cdp:validate` every time a feature branch reaches a natural checkpoint.

### 3.3 Committing

```bash
npm run cdp:commit "feat: improve renderer probe"
```

CDP Commit Protocol:

1. SST validation (`validate-sst`)
2. Drift detection (`detect-drift`)
3. Probe execution via Playwright (headless)
4. Visual trigger inspection (warns if shader/WebGL/engine paths changed)
5. Git commit with metadata block appended to message

**Emergency bypasses**

```bash
npm run cdp:commit --skip-probes "message"   # Skip probes only
npm run cdp:commit --skip-all "message"     # Skip spec + probes (last resort)
```

Every bypass is logged in `.cdp/savepoints.log` for audit.

### 3.4 Savepoints & Rollbacks

| Command | Result |
| --- | --- |
| `npm run cdp:savepoint "context"` | Manual savepoint + git tag |
| `npm run cdp:savepoint:list` | JSON list of existing savepoints |
| `npm run cdp:rollback <id>` | Hard reset to the selected savepoint |
| `npm run cdp:rollback --last` | Quick reset to previous tag |

Old tags are pruned automatically once the configurable limit (default 10) is exceeded.

---

## 4. Automation Layout

```
.cdp/
  config.json           # CDP runtime configuration
  probe-schema.json     # Probe definitions
  probe-results/        # Historical probe runs (JSON)
  savepoints.log        # Savepoint manifest
```

### 4.1 `config.json`

Key sections:

```json
{
  "version": "2.0.0",
  "automation": {
    "savepoints": { "enabled": true, "autoCreate": true },
    "validation": { "specCheck": "always", "probes": "pre-commit" },
    "hooks": { "preCommit": true, "postCommit": true }
  },
  "visualTests": {
    "mode": "optional",
    "mandatoryTriggers": [
      "src/shaders/**/*.glsl",
      "src/components/webgl/**",
      "src/engine/**"
    ]
  }
}
```

Teams can opt-in to strict visual enforcement by flipping `visualTests.mode` to `required`.

### 4.2 `probe-schema.json`

Probes contain `context` (setup code), `assertion`, `timeout`, and optional `errorMessage`. Example:

```json
{
  "particleCount": {
    "context": "const result = window.probe.draw();",
    "assertion": "result.active === result.draw",
    "required": true,
    "timeout": 5000,
    "errorMessage": "Particle draw count mismatch"
  }
}
```

Probes execute inside a Playwright-controlled page pointed at the running dev server.

---

## 5. Visual Validation

Visual tests stay optional by default but are **recommended** whenever:

- GLSL shaders change (`src/shaders/**/*.glsl`)
- WebGL renderer components change (`src/components/webgl/**`)
- Engine morph/blueprint logic changes (`src/engine/**`)

Run the suite manually via:

```bash
npm run test:visual
```

CDP warns after `cdp:commit` if the staged files match a trigger pattern.

---

## 6. Metrics & Reporting

CDP persists a JSON payload for each validation cycle at `.cdp/probe-results/<timestamp>.json`. Key fields include:

| Field | Description |
| --- | --- |
| `passed`, `failed`, `skipped` | Probe counts |
| `duration` | Total runtime (ms) |
| `probes.*.actual` | Context dump from the page |

These results feed into velocity dashboards and allow rapid regression triage.

---

## 7. Migration Checklist (from CDP v1)

1. Remove legacy documentation and manual scripts.
2. Install `@metacurtis/cdp-tools` and run `npx cdp init`.
3. Migrate legacy probes into `.cdp/probe-schema.json`.
4. Delete custom git hooks that duplicate CDP steps.
5. Onboard the team with `docs/development/CDP_Quick_Reference.md`.

---

## 8. FAQ

**Q: Can I bypass savepoints for spike branches?**

A: Yes. Run `npm run cdp:start --no-savepoint spike/foo`. The config ensures spikes don’t pollute the main savepoint log.

**Q: How do I add a new probe?**

1. Define it in `.cdp/probe-schema.json`.
2. (Optional) Write a helper in `window.probe.*`.
3. Run `npm run cdp:probe` to validate.

**Q: CI Usage?**

Use `npm run cdp:check` for spec enforcement and optionally `npm run cdp:probe -- --headless` in the pipeline.

---

## 9. References

- [CDP v2.0 Implementation Guide](./CDP_v2_Implementation_Guide.md)
- [CDP Quick Reference](./CDP_Quick_Reference.md)
- [AI Partner Field Manual](../AI_PARTNER_FIELD_MANUAL.md)
- [Velocity Playbook](../velocity/VELOCITY_PLAYBOOK.md)

