# MetaCurtis Orchestration – Issue Description Template (v3.7)

This template defines the **minimum deterministic information** required to run a
v3.7 multi-agent flow.  
Fill this out before generating a flow using `run-flow-v3.7.mjs`.

---

## 1. Symptom (Observable Behavior Only)
Describe **exactly what you see**.  
Do NOT include theories, causes, or guesses.

Examples:
- “QR tile shows a blank white square during the climax.”
- “Narration overlay flickers between Genesis beats.”
- “Particles freeze after emergence.”

**Your description:**


(Write here)


---

## 2. Expected Behavior
Describe what *should* happen.

Examples:
- “QR tile should show crisp QR modules.”
- “Narration overlay should stay mounted with text transitioning smoothly.”
- “Particles should drift continuously with no stalls.”

**Your description:**


(Write here)


---

## 3. Reproduction Steps (Deterministic)
List exact steps to reproduce the issue.

Example:
1. Run `npm run dev`
2. Navigate Opening → Genesis → Discipline → … → Transcendence
3. At climax, QR tile appears blank

**Your steps:**


---

## 4. Frequency / Determinism
How often does it occur?

- Always
- Sometimes
- After refresh
- Only in dev / only in production preview

**Your answer:**


(Write here)


---

## 5. Impact
Why must this be fixed now?

Examples:
- Blocks video recording
- Affects stage reveal timing
- Breaks contract in Pattern-S (visual determinism)

**Your answer:**


(Write here)


---

## 6. Attachments (Optional but Useful)
- Console logs
- Screenshots
- Short screen capture
- Code snippet (only if directly requested by Architect)

Add below:


(Write here)


---

## 7. Flow to Run
Specify the v3.7 flow you intend to run.

Examples:
- `fix_narration_pipeline_v1`
- `fix_qr_tile`
- `debug_drift_pipeline`
- `tighten_opening_sequence`

**Flow name:**


(Write here)


---

# Submission Checklist
Before running the flow generator:

- [ ] Symptom described with **no theories**
- [ ] Expected behavior declared
- [ ] Deterministic reproduction steps included
- [ ] Frequency noted
- [ ] Impact understood
- [ ] Attachments added if useful
- [ ] Flow name chosen

Once complete, run:

```bash
node scripts/run-flow-v3.7.mjs <flowName>
```

Paste each generated step into ChatGPT/Codex in order.

End of Template

---

# ✅ Your Next Step
Just place this file into your repo:

```
docs/orchestration/ISSUE_TEMPLATE.md
```

From now on, every time you want to fix something with v3.7:

1. Fill out this template  
2. Run:  
   ```bash
   node scripts/run-flow-v3.7.mjs <flowName>
   ```

Paste agent steps one by one into ChatGPT/Codex.

This standardizes the entire debugging and development workflow, makes the system deterministic, and prevents drift.
