#!/usr/bin/env bash
set -euo pipefail

echo ">> Creating directory structure..."
mkdir -p patterns/pattern-s/examples
mkdir -p patterns/pattern-d/examples
mkdir -p patterns/pattern-c/examples
mkdir -p patterns/pattern-e/examples
mkdir -p protocol
mkdir -p tools/pattern-s
mkdir -p tools/shared
mkdir -p templates
mkdir -p docs
mkdir -p .github/workflows

echo ">> Writing root README.md (if missing)..."
if [ ! -f README.md ]; then
cat > README.md << 'EOF'
# AI-Native Engineering Patterns

Deterministic development patterns for teams using AI coding tools.

> Make AI-generated code predictable, safe, and production-grade.

---

## The Problem

Tools like Copilot, Cursor, and Claude make it easy to generate code.
But teams are now dealing with:

- Race conditions
- Regressions
- Architectural drift
- Nondeterministic behavior
- Unstable releases

**Velocity is up. Trust is down.**

---

## The Solution

Four patterns that give AI clear boundaries to work within:

| Pattern | Purpose | Key Deliverable |
|---------|---------|-----------------|
| **[Pattern S](./patterns/pattern-s/)** | Single Writer Governance | OWNERSHIP.md |
| **[Pattern D](./patterns/pattern-d/)** | Deterministic Directives | Directive templates |
| **[Pattern C](./patterns/pattern-c/)** | Contracts & Evidence | Contract tests + probes |
| **[Pattern E](./patterns/pattern-e/)** | Eventguard Ordering | Phase-sequenced events |

---

## Quick Start

### 1. Start with Pattern S

```bash
# Copy the template
cp templates/OWNERSHIP.template.md docs/OWNERSHIP.md
cp templates/pattern-s.config.template.json pattern-s.config.json

# Run initial scan (once you have scripts wired)
npm run pattern-s:scan

# Review violations
cat reports/single-writer-violations.json
```

### 2. Add CI Enforcement

```bash
# Copy GitHub Actions workflow
cp templates/github-workflow.template.yml .github/workflows/pattern-s.yml
```

### 3. Train Your AI Tools

Include ownership rules in your AI directives:

```markdown
## Ownership Rules
- Check docs/OWNERSHIP.md before modifying shared state
- Do not emit events from non-owner files
- Do not write to GPU uniforms outside the designated owner
```

---

## Origin

These patterns were derived from building MetaCurtis — a 15K+ particle WebGL engine running at 60 FPS, built solo using AI-native development workflows.

* **Engine repo:** [https://github.com/metacurtis/metacurtis](https://github.com/metacurtis/metacurtis)
* **Live demo:** [https://metacurtis.com](https://metacurtis.com)

---

## AI-Native Pilot

For teams that want guided implementation:

* 4-week engagement
* Fix one painful engineering problem
* Install deterministic patterns
* Leave reusable workflows

→ [https://curtiswhorton.com](https://curtiswhorton.com)

---

## Protocol

Under [`protocol/`](./protocol/) you'll find the Kodex-Claude Protocol:

* Multi-agent AI workflow
* Evidence-driven debugging
* 10-15× feature velocity
* Deterministic, repeatable development

---

## License

MIT
EOF
else
  echo "   - README.md exists, skipping."
fi

echo ">> Writing FOR-CTOS.md (if missing)..."
if [ ! -f FOR-CTOS.md ]; then
cat > FOR-CTOS.md << 'EOF'

# AI-Native Engineering Patterns — For CTOs

## Executive Summary

Your team is shipping faster with AI coding tools. But you're also seeing:

* More incidents from race conditions and state bugs
* Engineers afraid to modify core systems
* AI-generated "fixes" that break other things
* Debugging that takes hours instead of minutes

These patterns fix that by giving AI clear architectural boundaries.

---

## What You Get

### Pattern S — Single Writer Governance

Every shared resource has exactly one owner. Enforced by CI.

**Result:** Race conditions become structurally harder or impossible.

### Pattern D — Deterministic Directives

Every AI task gets explicit constraints: what to do, where to do it, what not to touch.

**Result:** AI outputs become predictable and safe.

### Pattern C — Contracts & Evidence

Every change must satisfy explicit contracts and provide proof.

**Result:** "Works on my machine" bugs disappear.

### Pattern E — Eventguard Ordering

Events fire in the right order, every time, or they don't fire at all.

**Result:** Timing bugs and event storms are eliminated.

---

## Proven Results (MetaCurtis Case Study)

| Metric                               | Before | After      |
| ------------------------------------ | ------ | ---------- |
| Incidents/week                       | 2–3    | 0          |
| Time to diagnose state bugs          | Hours  | Minutes    |
| Engineers willing to modify renderer | 1      | Full team  |
| AI-generated code requiring rework   | High   | Much lower |

---

## Adoption Path

| Phase                   | Duration  | Investment     |
| ----------------------- | --------- | -------------- |
| Install & baseline      | 1–2 days  | 8–16 eng hours |
| Fix critical violations | 2 weeks   | 1 engineer     |
| Enable CI enforcement   | 1 week    | DevOps support |
| Full rollout            | 2–4 weeks | Team training  |

---

## Engagement Options

### Self-Service (Free)

* Clone this repo
* Follow the adoption guides
* Implement with your team

### Guided Pilot ($15–25K)

* 4-week engagement
* Expert implementation
* One critical problem fixed
* Team trained on patterns

→ [https://curtiswhorton.com](https://curtiswhorton.com)

---

## Technical Requirements

* JavaScript/TypeScript codebase
* Node.js 18+
* CI system (GitHub Actions, GitLab, Jenkins)
* Patterns adaptable to Python, Go, Java

---

## Next Steps

1. Have your tech lead review [Pattern S](./patterns/pattern-s/)
2. Run a baseline scan on your highest-pain codebase
3. Schedule a call to discuss fit

→ [https://curtiswhorton.com](https://curtiswhorton.com)
EOF
else
  echo "   - FOR-CTOS.md exists, skipping."
fi

echo ">> Writing patterns/README.md (if missing)..."
if [ ! -f patterns/README.md ]; then
cat > patterns/README.md << 'EOF'

# AI-Native Engineering Patterns

## Overview

Four patterns that make AI-generated code predictable:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Pattern S (Ownership)                                     │
│       ↓ feeds into                                          │
│   Pattern D (Directives reference ownership rules)          │
│       ↓ requires                                            │
│   Pattern C (Evidence proves directive compliance)          │
│       ↓ enforces                                            │
│   Pattern E (Events respect ownership + contracts)          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Pattern Summaries

### [Pattern S — Single Writer Governance](./pattern-s/)

> One owner writes. Everyone else reads. No exceptions.

* Machine-readable OWNERSHIP.md
* CI enforcement via gates
* AI task blocks that respect ownership

**Start here.** Pattern S is the foundation for the others.

### [Pattern D — Deterministic Directives](./pattern-d/)

> Tell AI exactly what to do, where to do it, and what not to touch.

* Scoped task definitions
* File boundaries in every directive
* Success criteria before implementation

### [Pattern C — Contracts & Evidence](./pattern-c/)

> Don't trust. Verify. Every change needs proof.

* Explicit, testable contracts
* Automated verification
* Runtime probes for observability

### [Pattern E — Eventguard Ordering](./pattern-e/)

> Events fire in the right order, every time, or they don't fire at all.

* Phase-gated event system
* Sequence enforcement
* Blocking and debouncing rules

## Adoption Order

1. **Pattern S first** — establishes who owns what
2. **Pattern D second** — teaches AI the ownership rules
3. **Pattern C third** — verifies compliance
4. **Pattern E fourth** — enforces event discipline

## Quick Start

See [Pattern S Adoption Guide](./pattern-s/ADOPTION-GUIDE.md) to begin.
EOF
else
  echo "   - patterns/README.md exists, skipping."
fi

echo ">> Writing Pattern S executive summary (if missing)..."
if [ ! -f patterns/pattern-s/EXECUTIVE-SUMMARY.md ]; then
cat > patterns/pattern-s/EXECUTIVE-SUMMARY.md << 'EOF'

# Pattern S — Executive Summary

**Goal:** Ensure every shared resource (event, GPU uniform, geometry, bus channel) has exactly one writer, enforced by tooling.

* Single writer per resource
* Machine-readable ownership (`OWNERSHIP.md`)
* CI gates to block violations
* AI workflows that respect ownership

Start with:

1. Generating an ownership map
2. Cleaning up critical multi-writer hot spots
3. Enabling CI gates for core events/uniforms
EOF
else
  echo "   - EXECUTIVE-SUMMARY.md exists, skipping."
fi

echo ">> Writing Pattern S adoption guide (if missing)..."
if [ ! -f patterns/pattern-s/ADOPTION-GUIDE.md ]; then
cat > patterns/pattern-s/ADOPTION-GUIDE.md << 'EOF'

# Pattern S — Adoption Guide (Messy Codebases)

This is the step-by-step playbook for layering Pattern S into an existing system.

## Phase 0 – Baseline Only (No Fails)

1. Generate ownership snapshot (`docs/OWNERSHIP.md`)
2. Run `npm run validate-ownership` locally (no CI integration yet)
3. Tag core events/uniforms (MORPH_PROGRESS, RENDER_DIRECTIVE, STAGE_CHANGE, etc.)

## Phase 1 – Fix the Hot Spots

1. Prioritize:
   * High-frequency events
   * GPU uniforms used every frame
2. Refactor to single writer for those resources
3. Re-run validation and confirm single-writer for core paths

## Phase 2 – CI Gate for Core Resources

1. Configure `pattern-s.config.json` with a `ci-core` profile
2. Add a CI job to run `npm run validate-ownership -- --profile=ci-core`
3. Block PRs that introduce new multi-writer violations for core resources

## Phase 3 – Expand Coverage

* Gradually add more events/uniforms to the enforced set
* Move toward full-repo enforcement when the team is comfortable
EOF
else
  echo "   - ADOPTION-GUIDE.md exists, skipping."
fi

echo ">> Writing Pattern S CI recipes (if missing)..."
if [ ! -f patterns/pattern-s/CI-RECIPES.md ]; then
cat > patterns/pattern-s/CI-RECIPES.md << 'EOF'

# Pattern S — CI Integration Recipes

## GitHub Actions

```yaml
name: Pattern S Ownership Gates

on:
  pull_request:
    branches: [ main, master ]

jobs:
  pattern-s:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Install dependencies
        run: npm ci
      - name: Pattern S - Scan (dev profile)
        run: npm run validate-ownership -- --profile=dev
      - name: Pattern S - Core Gate
        run: npm run validate-ownership -- --profile=ci-core
```

## Generic CI (GitLab / Jenkins / Circle)

```bash
npm ci
npm run validate-ownership -- --profile=ci-core
```

If the command exits non-zero, the build should fail.
EOF
else
  echo "   - CI-RECIPES.md exists, skipping."
fi

echo ">> Writing Pattern S config schema doc (if missing)..."
if [ ! -f patterns/pattern-s/CONFIG-SCHEMA.md ]; then
cat > patterns/pattern-s/CONFIG-SCHEMA.md << 'EOF'

# Pattern S — pattern-s.config.json Schema (Documentation)

This describes the expected shape of `pattern-s.config.json`.
You can enforce it via your own scripts or future tooling.

```json
{
  "profiles": {
    "dev": {
      "failOnOwnershipViolation": false,
      "logOnViolation": true,
      "coreEventsOnly": false
    },
    "ci-core": {
      "failOnOwnershipViolation": true,
      "coreEventsOnly": true
    },
    "ci": {
      "failOnOwnershipViolation": true,
      "coreEventsOnly": false
    }
  },
  "coreEvents": [
    "STAGE_CHANGE",
    "BLUEPRINT_READY",
    "PARTICLES_EMERGED",
    "RENDER_DIRECTIVE",
    "MORPH_PROGRESS"
  ],
  "ignore": {
    "files": [
      "tests/**",
      "**/*.test.*",
      "**/*.spec.*",
      "__tests__/**"
    ],
    "events": []
  }
}
```

* `profiles.*.failOnOwnershipViolation`: if true, violations should make the command exit non-zero.
* `profiles.*.coreEventsOnly`: if true, only enforce ownership on `coreEvents`.
* `coreEvents`: list of critical events for strict enforcement.
* `ignore.files`: glob patterns of files to skip.
* `ignore.events`: events that are allowed to be noisy/multi-emitter (temporarily).
EOF
else
  echo "   - CONFIG-SCHEMA.md exists, skipping."
fi

echo ">> Writing Pattern S AI task blocks (if missing)..."
if [ ! -f patterns/pattern-s/TASK-BLOCKS.md ]; then
cat > patterns/pattern-s/TASK-BLOCKS.md << 'EOF'

# Pattern S — AI Task Blocks

Use these templates when prompting AI tools (ChatGPT, Claude, Kodex, etc.)

## Renderer Uniform Change

```markdown
## Task
[Describe the uniform change]

## Ownership
WebGLBackground.jsx is the sole writer for GPU uniforms (see OWNERSHIP.md).

## Implementation Steps
1. Update renderer directive handling in src/components/webgl/WebGLBackground.jsx
2. If external modules need influence, add fields to RENDER_DIRECTIVE
3. Update relevant presets/configs to emit the directive
4. Run npm run gate:opening

## Do Not
- Write u* uniforms outside WebGLBackground
- Emit MORPH_PROGRESS from non-owner modules
- Bind geometry from other modules

## Validation
- npm run gate:opening
- Attach Pattern S reports to PR
```

## Add / Modify BeatBus Event

```markdown
## Task
[Describe the new event or payload change]

## Ownership
Edit docs/OWNERSHIP.md ([events]) to declare the owner first.

## Implementation Steps
1. Update OWNERSHIP.md with new event owner
2. Implement emitter in owner file only
3. Implement listeners in consumer files
4. Run npm run gate:topology

## Do Not
- Emit the same event from multiple owners
- Skip the OWNERSHIP.md update
```

EOF
else
  echo "   - TASK-BLOCKS.md exists, skipping."
fi

echo ">> Writing example OWNERSHIP template (if missing)..."
if [ ! -f templates/OWNERSHIP.template.md ]; then
cat > templates/OWNERSHIP.template.md << 'EOF'

# [Project Name] Single-Writer Ownership Map v1.0

*Pattern S – Initial Setup*

This file is machine-readable. Scanners treat it as the source of truth.

---

## GPU Uniforms

[uniforms]

# uUniformName = path/to/owner/file.js

# Example:

# uTime = src/renderer/WebGLRenderer.js

# uMorphProgress = src/renderer/WebGLRenderer.js

### Rules

* Owners are the only files allowed to assign `.value` on these uniforms.
* Non-owners must emit events and let the owner apply values.

---

## Event Emitters

[events]

# EVENT_NAME.emitter = path/to/owner/file.js

# Example:

# STAGE_CHANGE.emitter = src/events/emitters.js

# RENDER_FRAME.emitter = src/renderer/RenderLoop.js

### Rules

* Events listed here must be emitted by the owner only.
* Other modules should listen/react, not emit duplicates.

---

## Geometry & Buffer Operations

[geometry]

# operation = path/to/owner/file.js

# Example:

# bind = src/renderer/WebGLRenderer.js

---

## Escape Hatches

* Inline override: `// OWNERSHIP_OVERRIDE: <reason>` (document follow-up task).
* Environment bypass: `SKIP_OWNERSHIP_CHECK=1` for emergency commits.

---

## Known Violations

<!-- Auto-populated by scanner -->

None.

---

Last updated: [DATE] via `npm run pattern-s:generate`
EOF
else
  echo "   - templates/OWNERSHIP.template.md exists, skipping."
fi

echo ">> Writing example pattern-s.config.template.json (if missing)..."
if [ ! -f templates/pattern-s.config.template.json ]; then
cat > templates/pattern-s.config.template.json << 'EOF'
{
  "$schema": "https://metacurtis.com/schemas/pattern-s.config.schema.json",
  "version": "1.0",
  "profile": "dev",
  "profiles": {
    "dev": {
      "failOnViolation": false,
      "warnOnViolation": true,
      "logLevel": "verbose"
    },
    "ci-core": {
      "failOnViolation": true,
      "warnOnViolation": true,
      "logLevel": "normal"
    },
    "ci": {
      "failOnViolation": true,
      "warnOnViolation": true,
      "logLevel": "normal"
    }
  },
  "scope": {
    "include": ["src/**"],
    "exclude": ["**/*.test.*", "**/*.spec.*", "**tests**/**"]
  },
  "ownership": {
    "file": "docs/OWNERSHIP.md",
    "format": "ini"
  },
  "rules": {
    "disallowRawBeatBusEmit": false,
    "unknownCoreEventIsViolation": false,
    "requireOwnerForUniforms": true,
    "requireOwnerForEvents": true
  },
  "coreEvents": [
    "STAGE_CHANGE",
    "BLUEPRINT_READY",
    "PARTICLES_EMERGED",
    "RENDER_DIRECTIVE",
    "MORPH_PROGRESS"
  ],
  "escapeHatches": {
    "inlineOverridePattern": "OWNERSHIP_OVERRIDE:",
    "envBypass": "SKIP_OWNERSHIP_CHECK",
    "maxOverrideAgeDays": 2
  },
  "reports": {
    "outputDir": "reports",
    "formats": ["json"]
  }
}
EOF
else
  echo "   - templates/pattern-s.config.template.json exists, skipping."
fi

echo ">> Writing GitHub workflow template (if missing)..."
if [ ! -f templates/github-workflow.template.yml ]; then
cat > templates/github-workflow.template.yml << 'EOF'
name: Pattern S Ownership Gates

on:
  pull_request:
    branches: [ main, master ]

jobs:
  pattern-s:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Install dependencies
        run: npm ci
      - name: Pattern S - Scan (dev profile)
        run: npm run validate-ownership -- --profile=dev
      - name: Pattern S - Core Gate
        run: npm run validate-ownership -- --profile=ci-core
EOF
else
  echo "   - templates/github-workflow.template.yml exists, skipping."
fi

echo ">> Writing docs/GLOSSARY.md (if missing)..."
if [ ! -f docs/GLOSSARY.md ]; then
cat > docs/GLOSSARY.md << 'EOF'

# Glossary

**Pattern S** — Single Writer Governance; one owner per shared resource.

**Ownership Map (OWNERSHIP.md)** — Machine-readable file mapping resources (events, uniforms, geometry) to their single writer.

**Core Events** — High-impact events that must obey single-writer rules (e.g., STAGE_CHANGE, RENDER_DIRECTIVE, MORPH_PROGRESS).

**Directive** — A structured payload emitted over the bus (e.g., RENDER_DIRECTIVE) that tells the renderer what to do without directly touching its internals.

**AI Task Block** — A template for prompting AI tools with clear boundaries, ownership rules, and validation steps.
EOF
else
  echo "   - docs/GLOSSARY.md exists, skipping."
fi

echo ">> Writing docs/FAQ.md (if missing)..."
if [ ! -f docs/FAQ.md ]; then
cat > docs/FAQ.md << 'EOF'

# FAQ

### Do I have to adopt all patterns at once?

No. Start with **Pattern S** on a single high-pain codebase or subsystem. Once ownership is clear there, you can layer in Patterns D, C, and E.

### Does Pattern S block AI tools?

No. It gives AI tools **clear constraints**:

* Where they are allowed to write
* Where they must emit events instead of writing directly
* What checks must pass before a change is valid

### What if I already have multiple emitters for an event?

Pattern S doesn't require an immediate rewrite. You can:

* Mark current state in OWNERSHIP.md (with `⚠️ multiple` if needed)
* Prioritize critical flows
* Gradually consolidate to single-writer over time

### Can this work outside JavaScript/TypeScript?

Yes. The principle is language-agnostic:

* Single-writer enforced by config + tooling
* Ownership map
* CI gates

This repo ships a JS/TS reference, but you can port the idea to Go, Python, Java, etc.
EOF
else
  echo "   - docs/FAQ.md exists, skipping."
fi

echo ">> Done. Directory structure and key docs are in place."
