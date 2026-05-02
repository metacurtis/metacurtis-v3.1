---
name: outreach-session
description: Use when working on outreach scaffolding, templates, sequences, prospect filtering, personalization, or follow-up logic under outreach/. Keeps the session bounded, avoids WebGL edits, and requires operator review before commit.
---

# Outreach Session

## Pre-Session
1. Confirm the task is inside `outreach/` or is creating outreach scaffolding.
2. Run `git status --short --branch` and classify dirty state.
3. Read `outreach/AGENTS.override.md`.
4. State the one logical unit being changed before editing.

## Rules
- Show proposed edits before applying them.
- Do not touch `src/`, `sst/`, landing probe flows, or WebGL files.
- Do not make targeting or messaging decisions for the operator.
- Keep the change set limited to the outreach task at hand.

## Post-Session
1. Run `git diff`.
2. Run `git status --short --branch`.
3. Confirm no WebGL or landing files were touched.
4. Propose a commit message in the form `[outreach] description`.
5. Report:
   - what changed
   - what the operator should verify before use
   - next recommended step

Do not commit or push unless the operator explicitly instructs it.
