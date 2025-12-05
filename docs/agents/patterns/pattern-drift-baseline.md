**Pattern:** *Drift-style “breathing” motion from Canon → Renderer → GLSL*

---

## 1. Problem Signature

You want a **glyph or structure to appear “locked” but subtly alive**—a slow, breathing motion—*after* a morph has completed, without:

* breaking **SST v3.5** contracts,
* introducing new events or writers,
* or re-implementing motion in ad-hoc places.

Concretely, the bug we hit looked like:

* **Pipeline looked correct**:

  * `RENDER_DIRECTIVE` carried a drift-like verb.
  * `uTierMode = [0,0,0,0]` (drift mode on all tiers).
  * `uPostMorphFreeze` was `0`.
* **But particles appeared static** once the glyph formed.

The root cause: the **shader’s morph envelope and freeze logic were zeroing or over-damping movement**, even though drift semantics were present.

This pattern documents how we:

1. **Preserved contracts** (Canon, single-writer, events),
2. **Centralized semantics** (Canon + motionBehaviors),
3. **Verified runtime state** via diagnostics,
4. And ended with a **subtle but real breathing motion** that can be tuned per verb/stage.

---

## 2. Files & Responsibilities

### 2.1 Canon (SST v3.5)

**File:**

* `src/config/canonical/canonicalAuthority.js`

**Key responsibilities:**

* Load SST and expose **Canonical** as read-only.

* Map **visual verbs** → **renderer-ready effects** via:

  ```js
  function translateToRendererDirective(verb, effect = {})
  ```

* Responsibilities for drift-style verbs:

  * Map high-level types/behaviors into **`uMotionMode` + `tierModes`** using `MOTION_MODE_MAP` and `verbKey` heuristics.
  * Derive **`tierParams`** (speed, amplitude, frequency) from `effect.speed`, `effect.amplitude`, `effect.frequency`.

**Relevant behavior:**

* Verbs containing `"drift"` end up with:

  ```js
  translated.tierModes = [0, 0, 0, 0];   // drift motion mode for all tiers
  translated.uMotionMode = 3;           // renderer drift mode enum
  ```

* If no explicit tier params are provided:

  ```js
  const speed = typeof effect.speed === 'number' ? effect.speed : 0.8;
  const amp   = typeof effect.amplitude === 'number' ? effect.amplitude : 0.2;
  const freq  = typeof effect.frequency === 'number' ? effect.frequency : 0.5;
  const params = [speed, amp, freq, 0.0];
  translated.tierParams = [params, params, params, params];
  ```

**Pattern takeaway:**

* **Drift verbs should be modeled canonically** (via `visualEffects` and/or `motionBehaviors`) so that:

  * `translateToRendererDirective` yields a consistent **`tierModes` and `tierParams`** triple.
  * You can tune drift’s strength **at the Canon level** (speed/amp/frequency), not in the shader.

---

### 2.2 Renderer (WebGLBackground sink)

**File:**

* `src/components/webgl/WebGLBackground.jsx`

**Key responsibilities:**

* Serve as the **single writer** for:

  * Geometry (binds buffers on `BLUEPRINT_READY`),
  * Core uniforms (`uMorphProgress`, `uStageProgress`, `uPointSize`, etc.).
* Consume:

  * `BLUEPRINT_READY` → geometry + `uTierMode`/`uTierParams*`
  * `RENDER_DIRECTIVE` → motion and visual verbs
  * `MORPH_PROGRESS` → morph envelope + freeze
* Enforce **Pattern-S single-writer invariants** via `guardUniformWrite`.

**Drift-relevant pieces:**

1. **Shader material uniform layout**:

   The renderer declares the **contract** of uniforms, including drift-related ones:

   ```js
   uniforms: {
     uTime:            { value: 0 },
     uMorphProgress:   { value: 0 },
     uScrollProgress:  { value: 0 },
     uPostMorphFreeze: { value: 0.0 },
     uMoveDampStart:   { value: 0.96 },
     uMoveDampStartY:  { value: 0.9 },
     uTierMode:        { value: new Float32Array([0,0,0,0]) },
     uTierParams0:     { value: new Float32Array([0,0,0,0]) },
     ...
     uDriftAmp:        { value: 0.0 },
     uDriftFreq:       { value: 0.25 },
     // + palettes, grid spacing, etc.
   }
   ```

2. **Canonical → uniforms via BLUEPRINT_READY:**

   On `EVENTS.BLUEPRINT_READY`, the renderer:

   * Binds core attribute buffers (`position`, `atmosphericPosition`, `text3DPosition`, etc.).
   * Writes **tier modes/params** from `raw.metadata.motionBehaviors` using `mapBehaviorToMode(behavior)` into:

     ```js
     uniforms.uTierMode.value   = modeArray;      // drift, grid, flow, etc.
     uniforms.uTierParams0.value = paramsArrays[0];
     ...
     ```

   This is where Canonical’s idea of “drift” gets converted into concrete **motion modes** and **per-tier parameter vectors** for the shader.

3. **Visual verb drift hook (`applyVisualVerbDirective`):**

   When `handleDirective` receives `RENDER_DIRECTIVE`, it calls:

   ```js
   applyVisualVerbDirective(payload, uniforms, origin);
   ```

   For the drift verb:

   ```js
   case 'gentle_drift':
     setUniform('uDriftAmp',  clamp1(directive?.amplitude ?? 0.25, 0.25));
     setUniform('uDriftFreq', Math.max(0.05, directive?.frequency ?? 0.15));
     break;
   ```

   This lets Canon (or the spec) override default drift amplitude/frequency while respecting the **renderer single-writer guard**.

4. **MORPH_PROGRESS & freeze policy:**

   * `handleMorphProgress` updates `uMorphProgress`, the morph envelope uniforms, and **conditionally sets `uPostMorphFreeze`** when emergence completes.
   * For Genesis we gated auto-freeze via current stage: **Genesis narration is not auto-frozen**, so drift can continue as long as `uPostMorphFreeze` stays `0`.

**Pattern takeaway:**

* The renderer is responsible for:

  * Mapping **global state & verbs** into shader uniforms, not for inventing new motion logic.
  * Enforcing that **only it** writes motion-critical uniforms (`uMotionMode`, `uMorphProgress`, `uStageProgress`, `uPointSize`, etc.).
* Drift-style verbs should plug in via:

  * Canonical tier modes/params,
  * A focused verb hook in `applyVisualVerbDirective`,
  * And stage-aware freeze policy in `handleMorphProgress` (Genesis allowed to stay unfrozen).

---

### 2.3 GLSL (vertex shader: consciousness-vertex.glsl)

**File:**

* `src/shaders/templates/consciousness-vertex.glsl`

**Key responsibilities:**

* Compute **per-vertex position** based on:

  * Morph (`uMorphProgress`),
  * Tiered motion (`uTierMode` + `uTierParamsX`),
  * Global controls (`uFlowTurbulence`, `uStreakIntensity`, `uSpreadFactor`, etc.),
  * Freeze (`uPostMorphFreeze`).

**Drift path:**

1. **Mode/tier lookup:**

   ```glsl
   vec4 getTierParams(int t) {
     if (t == 0) return uTierParams0;
     if (t == 1) return uTierParams1;
     if (t == 2) return uTierParams2;
     return uTierParams3;
   }

   float getTierMode(int t) {
     return (t >= 0 && t < 4) ? uTierMode[t] : 0.0;
   }
   ```

2. **Tier-based movement (`applyTierMovement`):**

   ```glsl
   vec3 applyTierMovement(vec3 basePos, int tierIndex) {
     float mode = getTierMode(tierIndex);
     vec4 params = getTierParams(tierIndex);
     float taper = clamp(1.0 - uMorphProgress, 0.0, 1.0);
     vec3 offset = vec3(0.0);

     if (mode < 0.5) { // DRIFT
       float speed = max(0.1, params.x);
       float amplitude = params.y;
       float freq = max(0.1, params.z);
       float signal = sin(dot(basePos.xy, vec2(freq)) + uTime * speed);
       offset = vec3(signal, -signal, 0.0) * amplitude;
     } else if (mode < 1.5) {
       // grid lock
     } else if (mode < 2.5) {
       // flow
     } else if (mode < 3.5) {
       // streaks
     } else {
       // orbit
     }

     return basePos + offset * taper;
   }
   ```

3. **Morph & freeze application in `main`:**

   ```glsl
   vec3 basePos = mix(atmoPos, textPos, morph);
   int tierIndex = int(clamp(floor(tierData + 0.5), 0.0, 3.0));
   vec3 tierAdjusted = applyTierMovement(basePos, tierIndex);

   // Add movement
   vec3 movement = tierAdjusted - basePos;

   float freeze = (uPostMorphFreeze > 0.5) ? 0.0 : 1.0;
   float moveGain = 1.0 - smoothstep(uMoveDampStart, 1.0, morph);
   float moveGainY = 1.0 - smoothstep(uMoveDampStartY, 1.0, morph);

   movement.x *= moveGain * freeze;
   movement.y *= moveGainY * freeze;
   movement.z *= moveGain * freeze;

   if (morph >= 0.985 || uPostMorphFreeze > 0.5) {
     movement = vec3(0.0);
   }

   vec3 finalPos = basePos + movement;
   ...
   ```

In the historical state captured here, **morph-based damping and the `morph >= 0.985` kill** were the key reasons drift disappeared once the glyph formed. The pattern that emerged is: **drift must either be exempt from that damping, or the taper must carry a non-zero floor and the morph kill must be removed or stage-gated**.

**Pattern takeaway:**

* The shader is the final arbiter of drift:

  * Use `uTierMode`/`uTierParamsX` for **which motion**,
  * Use `uMorphProgress` for **how much**,
  * Use `uPostMorphFreeze` as the only final hard-stop (when you truly want zero motion).

---

## 3. Pattern: “Drift-style breathing motion” (Canon → Renderer → GLSL)

### 3.1 Conceptual flow

1. **Canon / SST:**

   * Define a drift verb (`gentle_drift` or similar) with:

     * `behavior` / type mapped to drift (`drift_perlin`, includes "drift" in name).
     * Sensible `speed` / `amplitude` / `frequency`.
   * Ensure `translateToRendererDirective`:

     * Maps it to `uMotionMode` and `tierModes` (drift branch).
     * Derives `tierParams` values encoding drift speed/amp/freq.

2. **Renderer (WebGLBackground):**

   * On `BLUEPRINT_READY`:

     * Write `uTierMode` and `uTierParams*` using canonical `motionBehaviors`.
   * On `RENDER_DIRECTIVE`:

     * For drift verbs, set `uDriftAmp` / `uDriftFreq` (optionally overriding Canonical defaults).
   * On `MORPH_PROGRESS`:

     * Let morph drive `uMorphProgress` and envelopes.
     * Keep `uPostMorphFreeze` at zero in stages where drift is meant to continue (e.g., Genesis narration).

3. **GLSL:**

   * Use tier modes (`uTierMode`) to select the drift branch in `applyTierMovement`.
   * Use tier params (`uTierParams`) and drift uniforms (`uDriftAmp/Freq`) to compute a **small, bounded** offset over time.
   * Apply the morph envelope and freeze:

     * Morph may damp non-drift motion.
     * `uPostMorphFreeze` is the final hard-stop; when high, *everything* stops.

---

## 4. Checklist: Debugging / Validating a Drift Verb

This is the practical “how to know it’s working” checklist.

### 4.1 Canonical / Directive-level

1. **Inspect Canonical resolution logs in dev console:**

   * Look for:

     ```text
     🎨 [Canonical] Resolved visual verb: "gentle_drift" → { ... }
     ```

   * Verify the resolved payload for your drift verb includes:

     * `verb: "gentle_drift"` (or equivalent),
     * `uMotionMode` set to a drift-compatible value,
     * `tierModes` containing `0` for tiers you expect to drift,
     * `tierParams` with non-trivial values (esp. amplitude, frequency).

2. **If using motionBehaviors in blueprints:**

   * Make sure the relevant `motionBehaviors.tierX.behavior` includes `"drift"` or `"perlin"` so `mapBehaviorToMode` selects **drift mode**.

---

### 4.2 Renderer-level (WebGLBackground)

3. **On first full Genesis bind**, call:

   ```js
   window.getRendererSnapshot()
   ```

   Expect:

   * `morph` ≈ 1 after emergence.
   * `freeze` (`uPostMorphFreeze`) == `0` during your “breathing” window.
   * `drawCount` > 0.

4. **Inspect tier modes / params:**

   ```js
   window.__rendererDiagnostics?.getUniformValue('uTierMode')
   // Should show e.g. Float32Array [0, 0, 0, 0] for fully drift tiers

   window.__rendererDiagnostics?.getUniformValue('uTierParams0')
   // Should show [speed, amplitude, frequency, ...]
   ```

   Confirm:

   * Mode 0 is used for tiers that should drift.
   * Amplitude is non-zero (and big enough to see).

5. **Validate drift-specific uniforms:**

   ```js
   window.__rendererDiagnostics?.getUniformValue('uDriftAmp')
   window.__rendererDiagnostics?.getUniformValue('uDriftFreq')
   ```

   These should reflect your desired drift settings when the drift verb is active.

6. **Check directives hitting the renderer:**

   * Logs from `handleDirective`:

     ```text
     [WBG] handleDirective {
       source: 'beat_visual',
       phase: 'narration',
       verb: 'gentle_drift' | <drift-verb>,
       keys: [...]
     }
     ```

   If you never see a drift-like verb here, the issue is upstream (Director / Canon not emitting it for that beat).

---

### 4.3 Shader-level (GLSL)

7. **Ensure drift branch is used:**

   * Tier index for the glyph should map to `uTierMode[tierIndex] == 0.0`.
   * `applyTierMovement` drift branch is therefore active for those particles.

8. **Check morph & freeze behavior:**

   * For the “breathing” beat, assert:

     * `uMorphProgress` ≈ 1.0.
     * `uPostMorphFreeze` == 0 (no hard freeze).
   * If `movement` is still zero, inspect:

     * Taper logic (`taper` / morph-based damping),
     * Any morph≥threshold kill switches in the shader.

---

## 5. Contracts & Guardrails Respected

Throughout the drift work, the following invariants remained intact:

* **Single-writer uniforms:**

  * Renderer is the only writer for `uMotionMode`, `uFlowTurbulence`, `uMorphProgress`, `uStageProgress`, `uPointSize`.
  * Enforced in JS by `guardUniformWrite` and the `RENDERER_SINGLE_WRITER_UNIFORMS` set.

* **Event set unchanged:**

  * No new core event types were introduced (no changes to `MORPH_PROGRESS`, `RENDER_DIRECTIVE`, `BLUEPRINT_READY`, `PARTICLES_EMERGED`, etc.).
  * All changes happened inside existing listeners.

* **Canonical as source of truth:**

  * Drift-style behavior is modeled via SST and `visualEffects`/`motionBehaviors`, not by hard-coding special cases in the renderer or shader.

* **Renderer remains a sink:**

  * WebGLBackground never emits new semantic events; it only consumes events and updates geometry/uniforms.

---

## 6. How to Reuse This Pattern

When you introduce **new drift-like verbs** (e.g., `neural_breathe`, `cosmic_drift`, `halo_shimmer`), follow this pattern:

1. **Define it canonically** with type/behavior and motion parameters.
2. **Ensure `translateToRendererDirective` + motionBehaviors** map it to:

   * Drift mode in `uTierMode`,
   * Reasonable `tierParams` (speed, amplitude, frequency).
3. **Add a verb hook in `applyVisualVerbDirective`** only if you need extra per-verb control (e.g., `uDriftAmp/Freq` overrides).
4. **Confirm with diagnostics:**

   * `getRendererSnapshot`,
   * `__rendererDiagnostics.getUniformValue('uTierMode')`, `uTierParams0`, `uDriftAmp/Freq`.
5. **Tune amplitude/frequency** at Canon level until the motion matches the desired “breathing” feel.

This gives you a repeatable, testable way to wire *any* drift-style visual from Canon → specs → renderer → GLSL without breaking Pattern-S or SST contracts.
