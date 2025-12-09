# MetaCurtis Orchestration Versions – v3.0 → v3.6

This document defines the evolution of the MetaCurtis multi-agent orchestration system from **v3.0** to **v3.6**.

The goal is to make the orchestration **deterministic, repo-grounded, and reusable**, so any AI agent (ChatGPT, Claude, Codex, etc.) can run flows with minimal human decision overhead.

---

## 1. v3.0 – Deterministic Reasoning

### 1.1 Core Idea

v3.0 was the first **deterministic multi-agent system**:

- Agents are **fixed roles** with contracts.
- Flows are **explicit JSON** sequences of steps.
- Each step:  
  `inputs → agent prompt → structured output → next step`.
- Same flow + same repo snapshot + same human goal ⇒ **replayable**.

### 1.2 Canonical Agent Lane (v3.0)

Logical lane:

> **A → B → C → D → E**

- **A – Architect**  
  Turns the human goal into a **spec**:
  - target behavior,
  - allowed change surfaces,
  - success criteria (visual, timeline, contracts).

- **B – Critic**  
  Stress tests A’s spec:
  - calls out risks and contradictions,
  - shrinks change surface,
  - enforces Pattern-S and single-writer constraints.

- **C – Implementer**  
  Produces initial concrete code changes / patches.

- **D – Systems Optimizer**  
  Refines C’s patches:
  - centralizes semantics,
  - reduces complexity,
  - produces test/trace plan.

- **E – Historian**  
  Captures **what happened** as a reusable pattern:
  - context,
  - what changed,
  - why it worked,
  - checklist for “next time”.

### 1.3 Determinism Principles in v3.0

1. **Single lane, fixed order**  
   Flows define an ordered list of steps.  
   No parallel “second Architect” or duplicate B/D/E chains.

2. **Structured IO**  
   Each agent has a defined **input → output schema** (Spec, Critique, PatchPlan, PatternDoc).

3. **Declared change surface**  
   A (and B) must name **which files/modules can change**.  
   C/D must stay inside those surfaces.

4. **Contract awareness**  
   Agents must respect:
   - Renderer as single GPU/uniform writer.
   - Engine as single blueprint author.
   - Director as event-only orchestrator.
   - Downstream contracts/tests (SST, render directives, etc.)

5. **Replayability**  
   All steps are captured as “tiles”:
   - step id,
   - agent id,
   - inputs,
   - outputs.

**Limitations of v3.0:**

- File selection was still somewhat **manual/implicit**.
- No formal **file map** contract.
- No explicit **repo-native ground truth agent** (everything relied on the LLM’s memory of code snippets).
- Execution (applying diffs, running tests) was conceptually present but not formalized as a dedicated agent.

---

## 2. v3.6 – Deterministic Reasoning + Ground Truth + Execution

v3.6 keeps all v3.0 principles and adds:

1. A formal **file mapping system**.
2. A **Meta Agent F** used twice:
   - **F₁ – repo diagnostic (early)**.
   - **F₂ – patch executor + test runner (late)**.

### 2.1 Canonical Agent Lane (v3.6)

The canonical lane for any real fix:

> **A → F (diagnostic) → B → D → F (executor) → E**

Also written as:

> **A → F₁ → B → D → F₂ → E**

- **A – Architect**  
  Same as v3.0, but:
  - Must name **fileGroups** and **canonical paths** from the file map.
  - Produces a Spec + initial change surface.

- **F₁ – Meta Agent (diagnostic mode)**  
  Repo-aware, **read-only**:
  - Uses the file map + file groups from A.
  - Opens real files in the repo.
  - Returns:
    - confirmed facts,
    - wiring/structure,
    - obvious smells/constraints,
    - suggested extra files to include.

- **B – Critic**  
  Same role as v3.0, but now:
  - Critiques A’s spec **against F₁’s ground truth**.
  - Shrinks the change surface to a **minimal safe set** of files.
  - Flags any attempt to touch files outside the file map or to violate contracts.

- **D – Systems Optimizer**  
  Same core role, but with stronger constraints:
  - Generates **precise diffs/patches** for only the minimal safe surface from B.
  - Produces a concrete **test plan** (commands to run).
  - Does not apply patches itself.

- **F₂ – Meta Agent (executor mode)**  
  Repo-aware, **mutating**:
  - Applies D’s patches to the real repo.
  - Runs D’s test commands.
  - Returns:
    - applied patches (what actually changed),
    - test results/logs,
    - new diagnostics (errors, stack traces),
    - optional repo state summary.

- **E – Historian**  
  Same responsibility, but now includes:
  - File groups touched (from the file map),
  - F₂’s execution/test results,
  - Pattern for reuse.

### 2.2 File Map – Spine of v3.6

New core contract:

- A global **file map** (e.g. `docs/file-map.json`) defines:
  - **fileGroups** (functional clusters, e.g. `"opening_sequence"`, `"drift_pipeline"`),
  - **canonical paths** for each group.

Rules:

- Every flow **must** start with one or more fileGroups.
- All file references inside the orchestration come from this map.
- No agent may “invent” paths:
  - A must pick from the map.
  - B can only shrink/change within the map.
  - D may only generate patches for mapped files.
  - F must **refuse** to touch unmapped files.

This closes a subtle v3.0 gap where flows could wander into the wrong parts of the repo.

### 2.3 Agent F – Two Modes

**Diagnostic mode (F₁):**

- Read-only.
- Opens repo files, summarizes behavior, confirms facts.
- Feeds “reality” into B.

**Executor mode (F₂):**

- Mutating.
- Applies patches and runs tests.
- Feeds real outcomes (pass/fail/errors) into E and back to the human.

### 2.4 Retry / Feedback Loop

v3.6 also formalizes retries:

- If tests fail or the behavior is still wrong:
  - F₂’s execution result (errors, logs) is fed back into F₁ (diagnostic mode),
  - New mini-cycle A → F₁ → B → D → F₂ → E is run with updated ground truth.

No “ad-hoc debugging” outside the system; retries are themselves flows.

---

## 3. Summary: v3.0 vs v3.6

| Concern              | v3.0                                             | v3.6                                                                 |
|----------------------|--------------------------------------------------|----------------------------------------------------------------------|
| Deterministic lane   | A → B → C → D → E                                | A → F₁ → B → D → F₂ → E                                              |
| File selection       | Ad-hoc / implicit                                | Formal file map (`fileGroups` + canonical paths)                    |
| Ground truth         | LLM memory + pasted snippets                     | Repo-native diagnostic agent (F₁)                                   |
| Execution            | Implicit “apply + test” by human or loose agent | Dedicated executor agent (F₂) with structured test results          |
| Contracts            | Pattern-S awareness via B/D                      | Pattern-S + file-map + F modes enforced across the entire flow      |
| Retries              | Manual / ad-hoc                                  | Explicit retry policy: test failure → new F₁ diagnostic → new cycle |
| Reuse                | Per-flow patterns via E                          | Per-flow patterns + shared fileGroups + shared v3.6 flow template   |

v3.6 is **v3.0 plus**: file-map spine, ground-truth diagnostics, deterministic execution, and explicit retry loops.

