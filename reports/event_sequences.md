# Event Sequence Analysis
Generated: Fri Oct 31 10:00:47 CDT 2025

## Operation: Stage Change
Starting with: STAGE_CHANGE

### Event Chain:
1. **STAGE_CHANGE** emitted in theater/ScrollOrchestrator.js:332
2. **STAGE_CHANGE** emitted in theater/controllers/OpeningSequenceController.js:637
   → EVENTS.START_NARRATIVE (line 651)
   → EVENTS.ENABLE_SCROLL (line 665)
3. **STAGE_CHANGE** emitted in state/commands/StateCommands.js:151
   → EVENTS.QUALITY_CHANGE (line 188)

---

## Operation: Opening Sequence Start
Starting with: OPENING_START

### Event Chain:
(no emitters found for OPENING_START)

---

## Operation: Morph Update
Starting with: MORPH_PROGRESS

### Event Chain:
1. **MORPH_PROGRESS** emitted in theater/ScrollOrchestrator.js:116
2. **MORPH_PROGRESS** emitted in theater/controllers/MorphAnimationController.js:332
3. **MORPH_PROGRESS** emitted in engine/modules/ClimaxController.js:249
4. **MORPH_PROGRESS** emitted in engine/modules/MorphController.js:273
5. **MORPH_PROGRESS** emitted in components/webgl/WebGLBackground.jsx:412

---

## Operation: Quality Change
Starting with: QUALITY_CHANGE

### Event Chain:
1. **QUALITY_CHANGE** emitted in state/atoms/qualityAtom.js:198
2. **QUALITY_CHANGE** emitted in state/commands/StateCommands.js:188

---

