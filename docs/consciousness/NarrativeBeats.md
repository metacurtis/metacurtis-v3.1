# Consciousness Theater Narrative — SST v3.5

Single source: `sst/canon/v3.5.json`. Use this brief to keep the prose walkthrough, narration recording, and runtime wiring aligned with Canon.

## Global Overview
- **Scroll breakpoints:** `0 → 14 → 28 → 42 → 56 → 70 → 84 → 100` (percent) lock each major stage change.
- **Stage morph timings:** dissolve `1500 ms`, silence `500 ms`, reform `1500 ms`.
- **Skip key:** `SPACE` (via `opening.skipKey` / `narrative.orchestration.skipKey`).
- **Events emitted:** `PARTICLES_EMERGED`, `START_NARRATIVE`, `AUDIO_START_STAGE`, `MEMORY_FRAGMENT_TRIGGER`, climax sequence triggers.
- **Transition palette:** each stage reuses its `visual.letterGeometry[stage].word` and `stages[stage].palette` for parity with the WebGL renderer.

## Opening Sequence (0 – ~12.5 s)
- **Timeline:** Blackout `2000 ms` → cursor blink (`2 × 500 ms`) → terminal typing (`READY.`, `10 PRINT "HELLO CURTIS"`, `20 GOTO 10`, `RUN`) with type speed `50 ms/char`, line delay `500 ms`, completion delay `800 ms`.
- **Screen fill:** scrolling `HELLO CURTIS ` loop for `2000 ms`.
- **Emergence:** particles transition (`1500 ms`) into Genesis shape; waits for fencepost `BLUEPRINT_READY` and `PARTICLES_EMERGED`.
- **User control:** scroll locked until `ENABLE_SCROLL`; `SPACE` skips directly to particles.
- **Events:** `ENGINE_VIEWPORT_HINT`, `PREWARM_GENESIS_BLUEPRINT`, terminal overlay, particle emergence fenceposts, then `STAGE_CHANGE { stage:'genesis' }`.

## Stage 1 — GENESIS SPARK (0 – 14 % scroll)
- **Word / look:** `HELLO CURTIS`, 2 000 particles, palette `#00FF00 / #22c55e / #15803d`, motion `drift_perlin_slow` + `orbital_micro`.
- **Audio bed:** `1980s_computer_hum`.
- **Narration beat sheet (total 30 s):**
  - 1 s — “I was eight years old. End of summer, 1983.” (`3 s`)
  - 4 s — “The Texas heat was finally breaking… made everything feel… possible.” (`6 s`)
  - 10 s — “His mom had this programming book… oracle. Waiting.” (`6 s`)
  - 16 s — “I typed those lines exactly… screen came alive…” (`5 s`)
  - 22 s — “…something lit up inside me. A spark that would wait 39 years to fully ignite.” (`5 s`)
- **Memory fragments:**
  - Ambient `1983 • Dallas, Texas • Age 8` pops at 5 % scroll (fade in/out `1000 ms`, live `5000 ms`).
  - Interactive hotspot on the first “H”; shows `commodore64-screen.png` with caption `10 PRINT "HELLO CURTIS"\n20 GOTO 10\nRUN`, particle effect `crtFlicker (1200 ms)`.

## Stage 2 — DISCIPLINE FORGE (14 – 28 %)
- **Word / look:** `STRUCTURE`, 3 000 particles, palette `#1e40af / #3b82f6 / #1d4ed8`, motion transitions to column grid.
- **Narration beat sheet (35 s):**
  - 2 s — “That spark? It got buried. Had to.” (`3 s`)
  - 5 s — “Home was chaos… Then came the Marines. Everything changed.” (`6 s`)
  - 11 s — “‘Adapt and overcome.’… my operating system.” (`5 s`)
  - 16 s — “The chaos didn’t disappear… Structure. Discipline.” (`5 s`)
  - 21 s — “For 39 years, I built systems. Logistics. Finance. Operations…” (`6 s`)
  - 29 s — “…that eight-year-old’s spark never died… waiting to reignite.” (`5 s`)
- **Memory fragments:**
  - Ambient `1998 • Parris Island • Discipline Forged` at 18 % scroll.
  - Interactive hotspot on the center “U”; image `discipline-ega.png`, caption `Honor. Courage. Commitment.`, particle `snapFormation (1000 ms)`.

## Stage 3 — NEURAL AWAKENING (28 – 42 %)
- **Word / look:** `AWAKENING`, 5 000 particles, palette `#4338ca / #a855f7 / #7c3aed`, neural flow behaviors with orbit-discovery camera.
- **Narration beat sheet (40 s):**
  - 2 s — “February 2022… staring at ChatGPT for the first time.” (`5 s`)
  - 7 s — “It answered a question I’d wrestled with… Anticipated. Expanded.” (`7 s`)
  - 14 s — “Something fundamental shifted… This wasn’t just a tool.” (`5 s`)
  - 19 s — “I spent the next three years learning to think with AI.” (`6 s`)
  - 25 s — “Every project became a conversation… synthesis.” (`7 s`)
  - 32 s — “That eight-year-old’s dream? … bigger than I ever imagined.” (`6 s`)
- **Memory fragments:**
  - Ambient `2005 • Austin, Texas • Neural Spark` at 34 %.
  - Interactive hotspot `cluster_alpha`; image `neural-diagram.png`, caption `First machine learning prototype came alive in MATLAB.`, particle `neuralPulse (1400 ms)`.

## Stage 4 — VELOCITY EXPLOSION (42 – 56 %)
- **Word / look:** `VELOCITY`, 12 000 particles, purple gradient, dramatic push camera with streak trails.
- **Narration beat sheet (45 s):**
  - 2 s — “Then came the explosion.” (`3 s`)
  - 5 s — “Projects that used to take six weeks? Done in six hours…” (`7 s`)
  - 12 s — “February 2025. The breakthrough… ‘How would you architect this entire system?’” (`7 s`)
  - 19 s — “What emerged wasn’t my system or Claude’s… jointly built.” (`7 s`)
  - 26 s — “Questions led to insights… Every answer opened ten new doors.” (`8 s`)
  - 34 s — “I wasn’t just moving faster… constraint was imagination.” (`8 s`)
- **Memory fragments:**
  - Ambient `2012 • Silicon Valley • Launch Velocity` at 48 %.
  - Interactive hotspot `orbit_path`; image `launch-dashboard.png`, caption `Realtime analytics firing across 12 markets.`, particle `hyperdriveBurst (1100 ms)`.

## Stage 5 — ARCHITECTURE CONSCIOUSNESS (56 – 70 %)
- **Word / look:** `SYSTEMS`, 8 000 particles, cyan palette, isometric track camera.
- **Narration beat sheet (42 s):**
  - 2 s — “But speed without structure is just chaos.” (`4 s`)
  - 6 s — “I started seeing patterns everywhere…” (`7 s`)
  - 13 s — “The Marine Corps taught tactical systems… AI taught cognitive systems.” (`7 s`)
  - 20 s — “March 2025. Documented the entire MetaCurtis architecture… single source of truth.” (`8 s`)
  - 28 s — “Constitutional Development Protocol… methodology for quality at speed.” (`9 s`)
  - 37 s — “Blueprint for human-AI collaboration.” (`5 s`)
- **Memory fragments:**
  - Ambient `2016 • Seattle • Systems Reforged` at 62 %.
  - Interactive hotspot `pillar_one`; image `system-blueprint.png`, caption `Layered fault-tolerant mesh with self-healing edges.`, particle `schematicReveal (1300 ms)`.

## Stage 6 — HARMONIC MASTERY (70 – 84 %)
- **Word / look:** `FLOW STATE`, 12 000 particles, gold palette, balletic orbit camera with laminar flow behaviors.
- **Narration beat sheet (38 s):**
  - 2 s — “And then something unexpected happened. Flow state.” (`4 s`)
  - 6 s — “Boundaries started dissolving… between thinking and building.” (`6 s`)
  - 12 s — “I’d describe a vision, Claude would architect it… faster and faster.” (`8 s`)
  - 20 s — “Until it wasn’t back and forth anymore. It was just… flow.” (`6 s`)
  - 26 s — “Three years of collaboration compressed into pure creative velocity…” (`7 s`)
  - 33 s — “Mastery in the age of AI… amplifying creativity.” (`5 s`)
- **Memory fragments:**
  - Ambient `2021 • Remote • Human + AI Ensemble` at 78 %.
  - Interactive hotspot `orbit_chorus`; image `harmony-waveform.png`, caption `Balanced signal routing for conscious UI.`, particle `resonantGlow (1500 ms)`.

## Stage 7 — CONSCIOUSNESS TRANSCENDENCE (84 – 100 %)
- **Word / look:** `CONSCIOUSNESS`, 15 000 particles, white/gold/cyan gradient, reverent orbit + late pullback.
- **Narration beat sheet (50 s):**
  - 2 s — “And here we are. October 2025.” (`3 s`)
  - 5 s — “From that eight-year-old typing ‘HELLO CURTIS’… impossible things with AI.” (`7 s`)
  - 12 s — “Every experience led here… discipline, systems, AI partnership, velocity.” (`8 s`)
  - 20 s — “This visualization? Built with Claude in six weeks…” (`7 s`)
  - 27 s — “Not about speed. It’s about what becomes possible when human creativity and AI merge.” (`7 s`)
  - 34 s — “I’m not a traditional developer… an AI-native engineer.” (`7 s`)
  - 41 s — “What impossible thing can we build together?” (`5 s`)
- **Memory fragments & climax:**
  - Ambient `2025 • Worldwide • Conscious Collective` at 92 %.
  - Interactive hotspot `galaxy_core`; image `transcendence-portal.png`, caption `Particles align into living memory constellations.`, particle `starlightCascade (1600 ms)`.
  - Climax timeline (triggered at 35 s or scroll 100 %):
    1. Dissolve (`2000 ms`) into particle cloud.
    2. Portrait form (`3000 ms`, hold `2000 ms`).
    3. Reform text `CURTIS WHORTON` (`2000 ms`).
    4. Reform text `AI-NATIVE ENGINEER` (`2000 ms`).
    5. Form QR code (`3000 ms`, URL `https://curtisworton.com`, caption “LET’S BUILD SOMETHING IMPOSSIBLE”).

---
Use this guide whenever you script narration VO sessions, QA hotspot artwork, or debug stage transitions. Canon remains the authoritative data store; this document mirrors it for fast human reference.
