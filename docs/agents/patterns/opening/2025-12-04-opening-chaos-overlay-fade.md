# Agent E Pattern — Opening chaos overlay fade

**Date:** 2025-12-04  
**Category:** opening  
**Flow:** tune_opening_sequence  

---

[CONTEXT]  
We’re in the **Opening Sequence subsystem** (TheaterDirector + OpeningSequence overlay + WebGLBackground + ConsciousnessEngine). “Good” means: after terminal fill, the overlay fades and we see **particles in chaos → coalesce → settle**, then a **breathing glyph** (drift), *not* an instant, static “Hello Curtis” glyph.

[WHAT CHANGED]

* Integrated **Codex as a meta agent** to read the repo and map the opening event/phase wiring.
* Updated **OpeningSequence.jsx** so the terminal overlay fade-out is triggered when `PARTICLE_PHASE` fires with `name: 'chaos'`, not only when `PARTICLES_START_EMERGING` / `OPENING_COMPLETE` fire.
* The fade logic for `PARTICLE_PHASE('chaos')` reuses the same fade path we already had for `PARTICLES_START_EMERGING` (no new event types, just an earlier listener).

[CURRENT STATE]

* ✅ Terminal fill still plays; then **overlay fades as chaos begins**, so the particle field is now visible during chaos/coalesce/settle instead of hidden.
* ✅ Opening phases (chaos/coalesce/settle) **do run** and morph progresses as expected; we no longer visually “teleport” straight from fill to the Hello Curtis glyph.
* ⚠️ The **visual feel** of chaos/coalesce/settle is still “off” — the motion/envelope doesn’t clearly separate the phases; it feels more like a quick morph into a static glyph than a designed arc.
* ⚠️ The **initial opening narrative text/terminal experience** is no longer presented exactly as before; the overlay now fades earlier, so the text + particle reveal relationship has changed and needs intentional redesign.

[DIAGNOSED ROOT CAUSE]

* Codex found that **chaos/coalesce/settle were always running**, but they were **completely hidden behind the OpeningSequence overlay**.
* The overlay only faded on **emergence completion** (e.g., `PARTICLES_START_EMERGING` / `PARTICLES_EMERGED` / `OPENING_COMPLETE`), so by the time the user saw anything, the glyph was already in its **locked state**.
* The user experience was therefore a **visual “jump”**: terminal → faded overlay → fully formed Hello Curtis glyph, with the intermediate morph phases never visible.

[INVARIANTS TO RESPECT]

* **MORPH_PROGRESS single-writer**: only `MorphAnimationController` emits `MORPH_PROGRESS` on the bus.
* **Director owns opening phases + RENDER_DIRECTIVE** during opening (no new emitters for `RENDER_DIRECTIVE` in other modules).
* **Renderer/WebGLBackground remains a passive sink** for directives and the **sole emitter of `PARTICLES_EMERGED`**.
* No new event types; we only **listen to existing events** (`PARTICLE_PHASE`, `PARTICLES_START_EMERGING`, `OPENING_COMPLETE`, etc.).
* Changes to opening visuals must **not break existing canon contracts/tests** (SST 3.5 schema, visual audit, single-writer checks).

[OPEN QUESTIONS / NEXT STEPS]

* 🎛 **Tune the morph envelopes in WebGLBackground** so chaos, coalesce, and settle each have distinct motion/shape signatures (e.g., more turbulence in chaos, tightening convergence in coalesce, subtle “breathing” in settle).
* 🎨 **Redesign the narrative overlay rhythm**: decide how much terminal text should overlap with early chaos, and whether we want a staggered fade (text first, then frame) instead of a single fade.
* 🧪 Add a **dev “opening lab”** mode/scene to preview the chaos→coalesce→settle arc without narration/audio, for faster tuning.
* 🧷 Confirm and document **when opening is considered “done”** (flag reset + events), so narration/drift baselines (like `gentle_drift`) can safely take over after the opening sequence.
