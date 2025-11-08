# Particle Event Flow Topology

## BLUEPRINT_READY

**Emitters:** 2
**Listeners:** 8

### Emitters

- `src/engine/ConsciousnessEngine.js:223`
  ```javascript
  BeatBus.emit(EVENTS.BLUEPRINT_READY, payload);
  ```
- `src/engine/ConsciousnessEngine.js:477`
  ```javascript
  BeatBus.emit(EVENTS.BLUEPRINT_READY, { blueprint, ...emergencePayload });
  ```

### Listeners

- `src/theater/controllers/OpeningSequenceController.js:404`
  ```javascript
  console.log('🎬 Opening: Waiting for genesis BLUEPRINT_READY (full)');
  ```
- `src/theater/controllers/OpeningSequenceController.js:405`
  ```javascript
  const blueprintPayload = await this.director._waitForEvent(EVENTS.BLUEPRINT_READY, {
  ```
- `src/theater/controllers/OpeningSequenceController.js:419`
  ```javascript
  console.warn('⚠️ Director: BLUEPRINT_READY (genesis) timed out');
  ```
- `src/theater/controllers/OpeningSequenceController.js:611`
  ```javascript
  const blueprintOff = BeatBus.on(EVENTS.BLUEPRINT_READY, (payload = {}) => {
  ```
- `src/theater/controllers/OpeningSequenceController.js:618`
  ```javascript
  console.log('   Fallback: BLUEPRINT_READY (genesis full) before fencepost');
  ```
- `src/engine/utils/blueprintUtils.js:156`
  ```javascript
  * Build the canonical BLUEPRINT_READY payload.
  ```
- `src/components/webgl/WebGLCanvas.jsx:264`
  ```javascript
  const off = BeatBus.on(EVENTS.BLUEPRINT_READY, handleBlueprint);
  ```
- `src/components/webgl/WebGLBackground.jsx:1605`
  ```javascript
  const off = BeatBus?.on?.(EVENTS.BLUEPRINT_READY, handleBlueprint);
  ```

⚠️ **RACE CONDITION RISK:** Multiple emitters detected

---

## MORPH_PROGRESS

**Emitters:** 2
**Listeners:** 3

### Emitters

- `src/engine/morphProgressChannel.js:2`
  ```javascript
  // Ensures ConsciousnessEngine is the single BeatBus emitter for MORPH_PROGRESS.
  ```
- `src/engine/ConsciousnessEngine.js:216`
  ```javascript
  BeatBus.emit(EVENTS.MORPH_PROGRESS, payload);
  ```

### Listeners

- `src/theater/bus/index.js:6`
  ```javascript
  const BATCH_EVENTS = new Set(['MORPH_PROGRESS', 'SCROLL_PROGRESS']);
  ```
- `src/engine/morphProgressChannel.js:2`
  ```javascript
  // Ensures ConsciousnessEngine is the single BeatBus emitter for MORPH_PROGRESS.
  ```
- `src/components/webgl/WebGLBackground.jsx:1675`
  ```javascript
  const unsubMorph = BeatBus.on(EVENTS.MORPH_PROGRESS, handleMorphProgress);
  ```

⚠️ **RACE CONDITION RISK:** Multiple emitters detected

---

## RENDER_DIRECTIVE

**Emitters:** 1
**Listeners:** 0

### Emitters

- `src/components/narrative/NarrationController.jsx:564`
  ```javascript
  BeatBus.emit?.(EVENTS.RENDER_DIRECTIVE, {
  ```

⚠️ **ORPHANED EVENT:** Emitted but no listeners

---

## STAGE_CHANGE

**Emitters:** 2
**Listeners:** 9

### Emitters

- `src/theater/ScrollOrchestrator.js:330`
  ```javascript
  BeatBus.emit?.(EVENTS.STAGE_CHANGE, {
  ```
- `src/state/commands/StateCommands.js:162`
  ```javascript
  BeatBus.emit(EVENTS.STAGE_CHANGE, payload);
  ```

### Listeners

- `src/theater/UnifiedNavigationAPI.js:196`
  ```javascript
  return BeatBus.on('STAGE_CHANGE', callback);
  ```
- `src/theater/TheaterDirector.js:128`
  ```javascript
  this._stageChangeUnsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, this._handleStageChangeBound);
  ```
- `src/state/commands/StateCommands.js:121`
  ```javascript
  const stageBusSub = BeatBus.on?.(EVENTS.STAGE_CHANGE, (payload = {}) => {
  ```
- `src/state/atoms/qualityAtom.js:155`
  ```javascript
  unsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, (payload) => {
  ```
- `src/components/webgl/WebGLBackground.jsx:786`
  ```javascript
  const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, (p) => {
  ```
- `src/components/webgl/WebGLBackground.jsx:812`
  ```javascript
  const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, () => {
  ```
- `src/components/narrative/NarrationController.jsx:246`
  ```javascript
  narrationDiagnostic.log('AUTO_ADVANCE_ABORT_STAGE_CHANGED', {
  ```
- `src/components/narrative/NarrationController.jsx:940`
  ```javascript
  narrationDiagnostic.log('STAGE_CHANGE_EVENT', {
  ```
- `src/components/narrative/NarrationController.jsx:961`
  ```javascript
  const offStageChange = BeatBus.on?.(EVENTS.STAGE_CHANGE, handleStageChange);
  ```

⚠️ **RACE CONDITION RISK:** Multiple emitters detected

---

## EMERGENCE_START

**Emitters:** 0
**Listeners:** 0

⚠️ **MISSING EMITTER:** No source found

---

## EMERGENCE_COMPLETE

**Emitters:** 0
**Listeners:** 0

⚠️ **MISSING EMITTER:** No source found

---

