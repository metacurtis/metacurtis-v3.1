# MetaCurtis - FORM Illuminates Mist Reference Plan

## Purpose
This document is the grounded handoff spine between the creative, ontology, particle, and renderer capsules for the current landing slice.

It is based on the actual connected worktree, not a generic particle-system model.

It is a reference implementation plan, not a claim that every change below is currently approved for direct landing-slice edits under `AGENTS.md`.

## Grounded repo facts
- Live landing orchestration: `src/components/consciousness/ConsciousnessTheater.jsx`
- Live GPU-state bridge: `src/components/webgl/WebGLBackground.jsx`
- Live motion law: `src/shaders/templates/consciousness-vertex.glsl`
- Live appearance law: `src/shaders/templates/consciousness-fragment.glsl`
- Live atlas generator: `src/components/webgl/consciousness/PointSpriteAtlas.js`
- Active engine authoring file: `src/engine/modules/BlueprintGenerator.js`

Important correction:
- `src/engine/BlueprintGenerator.js` is not the active file in this repo. The active file is `src/engine/modules/BlueprintGenerator.js`.

## Creative target
The landing scene must read as:

`mist -> latent structure -> resolved structure -> FORM`

The field should be perceived first as luminous density, not as a cloud of symbolic sprites.
FORM should gain authority through coherence, stability, and hierarchy, not through brute brightening.

## Current blocker summary
The live system is now blocked primarily by visual ontology and remaining material identity, not by orchestration or renderer ownership.

Current confirmed blockers:
- Low-tier atlas identity still carries too much recognisable geometry unless explicitly softened.
- Mid/high-tier atlas identity still preserves ring and symbolic structure more than true mist continuity allows.
- Fragment suppression and vertex hierarchy corrections help, but they can only hide bad raw material up to a point.
- The landing architecture itself is currently sound enough that upstream visual primitives now matter.

## Ownership map

### Upstream authorship
File: `src/engine/modules/BlueprintGenerator.js`

Current ownership:
- tier assignment
- atlas band assignment
- size multiplier authoring
- opacity authoring
- FORM particle selection via `pickTextParticleIndices(...)`

Future responsibility if scope is widened:
- author `formWeight`
- author `illuminationAffinity`
- narrow tier-band atlas selection if more control over transitional structure is needed

Current hard boundary:
- this file is outside the current landing edit allowlist in `AGENTS.md`

### Orchestration
File: `src/components/consciousness/ConsciousnessTheater.jsx`

Current ownership:
- stage-mode landing detection
- landing beat sequencing
- render-directive scheduling
- deterministic landing pose

Future responsibility:
- pass any stage-level field intent only if a new uniform truly belongs at the director layer

Must not own:
- particle classification
- atlas authorship
- GPU writes

### Renderer bridge
File: `src/components/webgl/WebGLBackground.jsx`

Current ownership:
- attribute binding
- atlas upload
- material creation
- uniform binding
- draw range and active count
- directive application

Future responsibility:
- bind new attributes/uniforms only
- remain the single GPU-state writer

Must not own:
- visual primitive authorship
- FORM membership logic
- tier policy

### Motion law
File: `src/shaders/templates/consciousness-vertex.glsl`

Current ownership:
- atmospheric -> text morph
- tier motion application
- glyph-zone damping
- freeze/post-morph stabilisation
- point-size calculation
- `vGlyphInfluence`

Recent grounded changes:
- low-tier render-side size dominance was reduced by correcting `tierSizeBoost`
- glyph-adjacent damping exists and is already part of the live contract

Future responsibility:
- local FORM influence propagation
- spatial calm near FORM
- final point-size hierarchy tuning if fragment-only work is insufficient

### Appearance law
File: `src/shaders/templates/consciousness-fragment.glsl`

Current ownership:
- atlas sampling
- alpha discard
- tier colour mixing
- glow and band tint
- shimmer/twinkle
- pointer-local tint and alpha lift
- final alpha resolution

Recent grounded changes:
- low-tier sprite readability is partially suppressed
- low-tier opacity boosting was replaced with softer hierarchy
- pointer aura weights were reduced

Future responsibility:
- convert local FORM influence into soft atmospheric illumination
- preserve field continuity while increasing perceptual hierarchy

### Visual primitive source
File: `src/components/webgl/consciousness/PointSpriteAtlas.js`

Current ownership:
- 16-slot `4x4` atlas layout
- sprite identity per slot
- texture generation

Recent grounded changes:
- low-tier slots `0-7` were rewritten from explicit symbols toward soft density carriers
- deterministic cleanup removed `Math.random()` from `drawBurst`

Remaining blocker:
- transitional and resolved slots still preserve recognisable ring/spiral/symbolic identity more than the creative target allows

## File-by-file reference changes

### 1. `src/components/webgl/consciousness/PointSpriteAtlas.js`
Target outcome:
- one material universe
- variation by density, asymmetry, elongation, and centre weighting
- no symbolic geometry in Tier 0-1

Reference plan:
- Tier 0 slots: gaussian haze, diffuse blobs, elongated fog wisps, asymmetric bloom
- Tier 1 slots: denser haze, directional mist carriers, soft clustered density
- Tier 2 slots: compressed luminous kernels, layered density ridges, non-symbolic transitional structure
- Tier 3 slots: compact coherent density clusters, soft resolved cores

Must preserve:
- atlas size
- slot count
- slot indexing
- renderer upload contract

### 2. `src/shaders/templates/consciousness-vertex.glsl`
Target outcome:
- atmosphere cannot win spatial attention over FORM
- resolved tiers feel calmer and more grounded

Reference plan:
- keep Tier 0-1 slightly smaller under distance attenuation
- keep Tier 2-3 modestly favoured, not theatrical
- propagate FORM-zone influence through varyings only

Must preserve:
- deterministic freeze behaviour
- existing attribute contract
- existing renderer uniform contract unless a new uniform is truly required

### 3. `src/shaders/templates/consciousness-fragment.glsl`
Target outcome:
- atmospheric particles read as field density
- FORM reads as the most coherent state of the same material

Reference plan:
- suppress sprite silhouette readability for low tiers
- treat pointer interaction as revelation, not activation
- convert FORM influence into local clarity and calm headroom
- reduce decorative competition before increasing brightness

Must preserve:
- current renderer -> shader contract
- pointer safety in deterministic mode

### 4. `src/components/webgl/WebGLBackground.jsx`
Target outcome:
- no new authorship
- only bridge/runtime plumbing

Reference plan:
- only bind new attributes like `formWeight` or `illuminationAffinity` if upstream scope is widened and those attributes are actually authored
- do not move atlas or tier policy into React

### 5. `src/components/consciousness/ConsciousnessTheater.jsx`
Target outcome:
- stage-mode timing remains the authority for when reveal beats happen

Reference plan:
- if field intent needs to vary by beat, pass it as directive intent only
- keep timing relative to `[ConsciousnessTheater] Landing stage mode started`

### 6. `src/engine/modules/BlueprintGenerator.js`
Target outcome:
- upstream authored hierarchy if renderer/shader work is no longer enough

Reference plan if scope is widened:
- author `formWeight` as a stable particle-level measure of FORM affinity
- author `illuminationAffinity` as a particle-level response coefficient for field reveal
- narrow tier-local atlas slot ranges if Tier 2-3 still carry too much symbolic identity

Current note:
- this is the first true upstream escalation point, not the first place to edit

## Shader math direction

### Vertex layer
Preferred meaning:
- `vGlyphInfluence` = proximity to resolved FORM zone
- optional future `formWeight` = authored particle authority

Use:
- motion damping near FORM
- point-size discipline
- calmness propagation

### Fragment layer
Preferred meaning:
- atmospheric brightness should come from density and coherence, not symbolic marks
- local FORM influence should gently illuminate nearby mist rather than ignite it

Use:
- alpha shaping
- colour restraint
- local clarity around resolved structure
- reduced aura-like activation under pointer

## Attribute and uniform plan

### Already in live contract
- `tierData`
- `atlasIndex`
- `sizeMultiplier`
- `opacityData`
- `text3DPosition`
- `atmosphericPosition`
- `uOpacityMin`
- `uOpacityMax`
- `uPointerActive`
- `uPointerIntensity`
- `uPointerNdc`
- `uGlyphTargetActive`
- `uGlyphTargetCenter`
- `uGlyphTargetRadius`
- `uGlyphPulseIntensity`
- `vGlyphInfluence`

### Future expansion only if needed
- `formWeight`
- `illuminationAffinity`

Rule:
- these should be authored upstream first, then bound in the renderer, then consumed in shaders

## Capsule handoff workflow
Use the capsules in this order:

1. Creative Doctrine Capsule
Purpose:
- define emotional truth and success criteria

2. Visual Ontology Capsule
Purpose:
- define valid visual primitives and reject symbolic atlas identity

3. Particle Engine Capsule
Purpose:
- confirm whether authored hierarchy supports the doctrine

4. Renderer Capsule
Purpose:
- determine the smallest safe rendering correction

5. Implementer / Verifier workflow
Purpose:
- apply the smallest diff
- run probe/screens/schema/single-writer validation

## Acceptance criteria
The reference plan is satisfied only when:
- the viewer sees atmospheric field first, not sprite shapes
- low tiers no longer dominate through size or symbolic identity
- FORM reads as the most coherent state of the same material
- pointer interaction reveals latent structure without spectacle
- deterministic mode remains intact
- single-writer rules remain intact
- validation artifacts confirm the change rather than taste alone

## Current best next move
Within the current live system, the next highest-signal work is:
- continue simplifying transitional atlas slots `8-11`
- then re-evaluate the fragment path only after the atlas stops feeding symbolic geometry into the field

Why:
- the renderer is no longer the first-order blocker
- the atlas is now the clearest remaining source of perceptual mismatch
