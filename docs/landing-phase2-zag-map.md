# Landing Phase 2 ZAG Map
Targeted grounding map for the next phase of work

## Purpose

Phase 2 is no longer primarily about:
- atlas ontology
- particle-law repair
- FORM basic readability

Phase 2 is about:
- experience staging
- reveal choreography
- wave/topography timing
- scroll integration
- UI peel integration
- mist visibility before reveal

This ZAG map exists to inspect only the code surfaces relevant to those problems.

## Files to inspect

### Primary
- `src/components/consciousness/ConsciousnessTheater.jsx`
- `src/components/webgl/WebGLBackground.jsx`
- `src/shaders/templates/consciousness-vertex.glsl`
- `src/shaders/templates/consciousness-fragment.glsl`

### Secondary
- `src/components/ui/*`
- any landing preset / runtime config files that influence landing stages, beat timing, or scroll behavior
- any directive emission or transition surfaces currently used by the landing sequence

## Questions this ZAG must answer

### 1. Reveal choreography
- How is the current reveal staged?
- Which file owns beat sequencing?
- Which values control when FORM becomes visible?
- Which values control when drift / hold begins?

### 2. Scroll integration
- How does scroll currently affect the landing scene?
- What existing hooks already exist for scroll -> render behavior?
- Is scroll currently driving visual progression, camera, directives, or only page navigation?

### 3. Mist visibility before FORM
- What shader or directive surfaces currently control pre-reveal mist visibility?
- Where is the clearest seam to increase mist visibility before the word appears?
- Is the current pre-reveal state intentionally suppressed, or just under-tuned?

### 4. Wave/topography reveal
- Where in the current code path could atmospheric bands/waves be staged to become more apparent after reveal?
- Which tier(s) already own structured atmospheric motion?
- What controls could be used to intensify that motion only after FORM becomes established?

### 5. UI peel integration
- What current UI components or navigation surfaces exist?
- Where is the best seam to tie UI emergence to the hero progression?
- Can UI state respond to the same scroll/phase model as the hero, or would it need separate orchestration?

### 6. Transition quality
- Which surfaces currently control transitions between beats?
- Are transitions still snapping anywhere?
- Which transitions are directive-driven vs shader-driven vs camera-driven?

### 7. Architecture boundaries
- Which component still owns sequencing?
- Which component still owns renderer state?
- Which files must remain untouched if Phase 2 is to stay architecture-safe?

## Expected output format from the ZAG pass

The ZAG response should return these sections only:

1. Current reveal choreography path
2. Current scroll integration path
3. Mist visibility control surfaces
4. Wave/topography implementation surfaces
5. UI peel integration surfaces
6. Transition-control surfaces
7. Architecture constraints for Phase 2
8. Smallest safe implementation seams
9. Open uncertainties

## Important rule

Phase 2 ZAG should not produce doctrine, implementation diffs, or redesign ideas.

It should only report:
**what the code actually does and where Phase 2 can safely attach.**
