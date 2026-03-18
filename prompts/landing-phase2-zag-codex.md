Read AGENTS.md first and follow it as the operating contract.

Role: Architect

Do not edit code.

Read these docs first:
- docs/landing-baseline-summary.md
- docs/landing-experience-brief.md
- docs/landing-phase2-zag-map.md
- docs/landing-decision-log.md

Task:
Produce a targeted Phase 2 ZAG grounding pass for the landing experience.

This is not a repo-wide reset.
This is a focused grounding pass for:
- reveal choreography
- scroll integration
- mist visibility before FORM
- wave/topography reveal
- UI peel integration
- transition quality

Files to inspect:
- src/components/consciousness/ConsciousnessTheater.jsx
- src/components/webgl/WebGLBackground.jsx
- src/shaders/templates/consciousness-vertex.glsl
- src/shaders/templates/consciousness-fragment.glsl
- src/components/ui/*
- any landing preset / directive files that currently control stage-mode landing timing and transitions

Return these sections only:

1. Current reveal choreography path
2. Current scroll integration path
3. Mist visibility control surfaces
4. Wave/topography implementation surfaces
5. UI peel integration surfaces
6. Transition-control surfaces
7. Architecture constraints for Phase 2
8. Smallest safe implementation seams
9. Open uncertainties

Important:
- Do not provide doctrine
- Do not provide diffs
- Do not redesign the system
- Only report what the code actually does
