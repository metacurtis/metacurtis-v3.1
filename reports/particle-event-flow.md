# Particle Event Flow Topology

## BLUEPRINT_READY

**Emitters:** 3
**Listeners:** 5

### Emitters

- `src/engine/ConsciousnessEngine.js:433`
  ```javascript
  BeatBus.emit(EVENTS.BLUEPRINT_READY, { blueprint, ...emergencePayload });
  ```
- `src/engine/utils/blueprintUtils.js:156`
  ```javascript
  * Emit the canonical BLUEPRINT_READY payload through BeatBus.
  ```
- `src/engine/utils/blueprintUtils.js:166`
  ```javascript
  BeatBus.emit(EVENTS.BLUEPRINT_READY, payload);
  ```

### Listeners

- `src/theater/controllers/OpeningSequenceController.js:606`
  ```javascript
  const blueprintOff = BeatBus.on(EVENTS.BLUEPRINT_READY, (payload = {}) => {
  ```
- `src/theater/controllers/OpeningSequenceController.js:613`
  ```javascript
  console.log('   Fallback: BLUEPRINT_READY (genesis full) before fencepost');
  ```
- `src/engine/utils/blueprintUtils.js:156`
  ```javascript
  * Emit the canonical BLUEPRINT_READY payload through BeatBus.
  ```
- `src/components/webgl/WebGLCanvas.jsx:264`
  ```javascript
  const off = BeatBus.on(EVENTS.BLUEPRINT_READY, handleBlueprint);
  ```
- `src/components/webgl/WebGLBackground.jsx:1598`
  ```javascript
  const off = BeatBus?.on?.(EVENTS.BLUEPRINT_READY, handleBlueprint);
  ```

⚠️ **RACE CONDITION RISK:** Multiple emitters detected

---

## MORPH_PROGRESS

**Emitters:** 7
**Listeners:** 2

### Emitters

- `src/theater/ScrollOrchestrator.js:116`
  ```javascript
  BeatBus.emit?.(EVENTS.MORPH_PROGRESS, {
  ```
- `src/theater/controllers/MorphAnimationController.js:332`
  ```javascript
  BeatBus.emit(EVENTS.MORPH_PROGRESS, payload);
  ```
- `src/state/commands/StateCommands.js:44`
  ```javascript
  BeatBus.emit(EVENTS.MORPH_PROGRESS || 'MORPH_PROGRESS', payload);
  ```
- `src/engine/modules/MorphController.js:273`
  ```javascript
  BeatBus.emit(EVENTS.MORPH_PROGRESS, payload);
  ```
- `src/engine/modules/ClimaxController.js:249`
  ```javascript
  BeatBus.emit(EVENTS.MORPH_PROGRESS, morphPayload);
  ```
- `src/components/webgl/WebGLBackground.jsx:412`
  ```javascript
  BeatBus.emit?.(EVENTS.MORPH_PROGRESS, { value: 1, source });
  ```
- `src/components/webgl/WebGLBackground.jsx:1333`
  ```javascript
  BeatBus.emit?.(EVENTS.MORPH_PROGRESS, { value: 0 });
  ```

### Listeners

- `src/theater/bus/index.js:6`
  ```javascript
  const BATCH_EVENTS = new Set(['MORPH_PROGRESS', 'SCROLL_PROGRESS']);
  ```
- `src/components/webgl/WebGLBackground.jsx:1668`
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

- `src/theater/ScrollOrchestrator.js:332`
  ```javascript
  BeatBus.emit?.(EVENTS.STAGE_CHANGE, {
  ```
- `src/state/commands/StateCommands.js:167`
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
- `src/state/commands/StateCommands.js:126`
  ```javascript
  const stageBusSub = BeatBus.on?.(EVENTS.STAGE_CHANGE, (payload = {}) => {
  ```
- `src/state/atoms/qualityAtom.js:155`
  ```javascript
  unsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, (payload) => {
  ```
- `src/components/webgl/WebGLBackground.jsx:779`
  ```javascript
  const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, (p) => {
  ```
- `src/components/webgl/WebGLBackground.jsx:805`
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

