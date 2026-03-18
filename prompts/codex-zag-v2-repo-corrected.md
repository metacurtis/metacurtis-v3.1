# ZAG v2 — Diagnostic First Repo Inspection Prompt

## PROJECT

MetaCurtis

## MISSION

Inspect the existing codebase and determine the true root cause of the current landing visual issue.

Do not assume the solution is a minimal shader tweak.

First determine whether the issue is:

1. localized visual tuning
2. shader-level behavior
3. upstream particle authoring logic
4. propagation / ownership breakdown across the rendering pipeline
5. renderer contract violation
6. fundamental landing slice architecture problem

After diagnosing the root cause category, propose the least-invasive valid fix consistent with that diagnosis.

## ZERO-ASSUMPTION GROUNDING

Do not guess.

Do not infer architecture from generic React/WebGL patterns.

All conclusions must be grounded in actual code inspection of this repository.

If something cannot be verified, explicitly state which file must be inspected next.

## VERIFIED REPO FACTS YOU MUST RESPECT

- `src/components/consciousness/ConsciousnessTheater.jsx` exists and is part of the live velocity landing path.
- `src/components/webgl/WebGLBackground.jsx` imports the live shaders from:
  - `src/shaders/templates/consciousness-vertex.glsl`
  - `src/shaders/templates/consciousness-fragment.glsl`
- `ConsciousnessTheater.jsx` blocks `runVisualDemo()` for the velocity landing key and uses stage-mode landing instead.
- Landing beat timing is relative to `[ConsciousnessTheater] Landing stage mode started`, not page navigation.
- For the current stage-mode velocity landing route, the live ownership path is:
  - `ConsciousnessTheater.jsx`
  - `src/state/commands/StateCommands.js`
  - `STAGE_CHANGE`
  - `src/engine/ConsciousnessEngine.js`
  - `src/engine/modules/BlueprintGenerator.js`
  - `src/components/webgl/WebGLBackground.jsx`
  - `src/shaders/templates/consciousness-vertex.glsl`
  - `src/shaders/templates/consciousness-fragment.glsl`
- `ConsciousnessEngine.js` also contains a separate emergence builder path via `buildEmergenceBlueprint()`. Do not conflate that path with the live stage-mode velocity landing route unless the inspected code proves it is active for the route under analysis.

## CORE ARCHITECTURE TRUTH

The renderer is a single-writer GPU-state bridge.

Renderer owner:

`src/components/webgl/WebGLBackground.jsx`

The renderer should answer:

What do I send to the GPU right now?

Not:

What should the scene mean?

## RENDERER RESPONSIBILITIES

`WebGLBackground.jsx` should only:

- bind geometry attributes authored upstream
- bind shader uniforms
- upload atlas texture
- set draw ranges / active counts
- pass runtime values decided elsewhere
- remain the single writer of GPU state

## RENDERER MUST NOT DECIDE

The renderer must not decide:

- which particles are FORM
- particle identity classification
- tier policy
- blueprint generation logic
- stage meaning
- beat sequencing
- creative visual policy
- particle reclassification

Any such logic inside the renderer indicates policy leakage.

## SYSTEM RESPONSIBILITY SPLIT

### ConsciousnessTheater / Director Layer

Responsible for:

- stage-mode orchestration
- landing beat sequencing
- timing
- render directives / intent

Primary file to inspect first:

`src/components/consciousness/ConsciousnessTheater.jsx`

### Engine / Blueprint Authoring Layer

Files to inspect:

- `src/engine/ConsciousnessEngine.js`
- `src/engine/modules/BlueprintGenerator.js`

Responsibilities:

- particle identity
- tier distribution
- text particle selection
- authored arrays
- blueprint emission into the renderer path

Generated authored arrays may include:

- `tierData`
- `atlasIndices`
- `sizeMultipliers`
- `opacityData`
- `text3DPositions`
- `atmosphericPositions`

Important:

- For the current stage-mode velocity landing route, inspect `BlueprintGenerator.buildStage()` first.
- Do not assume every blueprint path uses the same FORM-selection or atlas-assignment contract.

### Renderer

File:

`src/components/webgl/WebGLBackground.jsx`

Responsibilities:

- bind attributes
- bind uniforms
- upload atlas texture
- set draw ranges
- pass runtime values
- maintain stable GPU contract

### Vertex Shader

File:

`src/shaders/templates/consciousness-vertex.glsl`

Responsibilities:

- particle motion law
- positional shaping
- tier movement attenuation
- glyph influence propagation

### Fragment Shader

File:

`src/shaders/templates/consciousness-fragment.glsl`

Responsibilities:

- appearance law
- glow
- mist shaping
- alpha shaping
- pointer response
- FORM readability and authority

## PARTICLE ENGINE CAPSULE

Engine surfaces to verify:

- `src/engine/ConsciousnessEngine.js`
- `src/engine/modules/BlueprintGenerator.js`

Target particle count for the landing route is expected to be in the high-thousands to ~15000 range depending on quality. Verify the actual count in code and artifacts rather than assuming the count alone explains the issue.

## STAGE-BUILD CONTRACTS TO VERIFY

The following are verified in `BlueprintGenerator.buildStage()` and should be treated as stage-build-path facts, not universal engine truths:

- FORM text particle assignment uses `pickTextParticleIndices()`
- selection is biased toward higher tiers first
- `atlasIndices` are assigned with tier-based slot bands via:
  - `floor(rng() * 4) + tier * 4`

Do not assume those exact rules apply to other blueprint paths unless the relevant file confirms it.

## PARTICLE TIERS

Tier roles to verify in code:

- Tier 0: background field
- Tier 1: supporting atmosphere
- Tier 2: readable particles
- Tier 3: FORM-adjacent particles

Do not trust these labels unless the authored arrays, motion rules, and fragment treatment actually produce this separation.

## POINTER CONTRACT

Pointer uniforms to verify:

- `uPointerActive`
- `uPointerIntensity`
- `uPointerNdc`

Pointer state is injected by the renderer path and visualized in shader code. Confirm exactly where each step happens.

## FORM ZONE SIGNAL

Verify whether the current vertex shader computes:

- `vGlyphInfluence`

Then verify where that signal is created, what inputs it uses, and where it is consumed.

## MOTION RULE

Determine whether the current code actually enforces:

- FORM particles move less than atmosphere particles

Do not assume this is true. Verify it in the motion path.

## DETERMINISTIC MODE

Deterministic runs must freeze:

- `uTime`
- pointer inputs

Any proposed fix must preserve deterministic-safe behavior.

## ZAG VERIFICATION RULES

Always verify:

1. where particle attributes originate
2. how they propagate to geometry attributes
3. how they propagate to shaders
4. which tier controls which visual role
5. whether the live stage-mode route uses `buildStage()` or another blueprint path

## ANALYSIS TASK

Trace the actual landing render pipeline and determine the true cause of the landing visual issue.

Your goal is to determine whether the problem is:

- visual tuning
- shader logic
- upstream particle authoring
- propagation breakdown
- renderer policy leakage
- fundamental landing slice architecture problem

## INVESTIGATION STEPS

1. Trace the real ownership path from:
   - `ConsciousnessTheater.jsx`
   - `StateCommands.js`
   - `ConsciousnessEngine.js`
   - `BlueprintGenerator.js`
   - `WebGLBackground.jsx`
   - vertex shader
   - fragment shader
2. Confirm which files control:
   - FORM particle selection
   - tier behavior
   - pointer response
   - glyph influence propagation
   - motion attenuation
   - readability / dominance / mist separation
3. Identify whether any policy currently exists inside the renderer.
4. Determine whether particle attributes propagate correctly from engine to geometry to shaders.
5. Determine whether Tier 2 and Tier 3 behavior diverge correctly from Tier 0 and Tier 1.
6. Determine where FORM stability is actually governed.
7. Identify any ownership misplacement across layers.
8. Explicitly distinguish:
   - what is true for the current live stage-mode velocity landing route
   - what is only true for other blueprint paths

## OUTPUT FORMAT

### 0. DIAGNOSTIC CLASSIFICATION

Classify the root cause as one of:

- localized visual tuning issue
- shader behavior issue
- upstream particle authoring issue
- propagation / ownership breakdown
- renderer policy leakage
- landing slice structural problem

State explicitly:

Does this require a fundamental architectural fix?

### 1. CURRENT VISUAL PATH

List the actual files and responsibilities in order from orchestration to GPU.

### 2. VERIFIED OWNERSHIP MAP

For each concern, list the file currently responsible:

- FORM selection
- tier policy
- particle identity
- attribute generation
- uniform binding
- draw range / active counts
- motion law
- appearance law
- pointer response
- glyph influence

### 3. RENDERER CONTRACT CHECK

Evaluate `WebGLBackground.jsx`.

State:

- what it does correctly
- what it should continue doing
- whether any policy leakage exists

### 4. INSERTION POINTS

Identify safest locations for a fix.

For each insertion point provide:

- file
- responsibility layer
- architectural justification
- risk level

### 5. MINIMAL IMPLEMENTATION PLAN

If the issue is not structural, propose the smallest fix sequence.

For each step specify:

- file
- change
- reasoning
- what must not be modified

### 6. RISKS

List:

- architecture risks
- visual risks
- deterministic-mode risks

### 7. FINAL RECOMMENDATION

One paragraph:

Where should the fix live and why that layer is correct.

## IMPORTANT

Do not produce generic WebGL advice.

Do not assume architecture.

Base every statement on actual repository inspection.

If uncertain, say which file must be inspected next.
