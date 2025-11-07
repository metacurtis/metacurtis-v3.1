# MetaCurtis Navigation Architecture (Phase 6)

**Visual representation of the unified orchestration pipeline**

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER/SYSTEM INPUTS                           │
│                                                                 │
│  Keyboard    Narration    Sidebar    Programmatic              │
│  (WASD/↑↓)   Auto-Advance  Clicks    API Calls                 │
└────┬───────────┬──────────┬──────────┬─────────────────────────┘
     │           │          │          │
     └───────────┴──────────┴──────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   unifiedNav API     │  ← Single Entry Point
         │  (unified wrapper)   │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   NavigationGate     │  ← Validation Layer
         │  (checks readiness)  │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  ScrollOrchestrator  │  ← Coordination Layer
         │  (manages timing)    │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   StateCommands      │  ← Single Writer
         │  (mutation layer)    │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │     stageAtom        │  ← State Storage
         │  (pure state)        │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   Event Emission     │  ← Notification Layer
         │  (STAGE_CHANGE, etc) │
         └──────────────────────┘
```

---

## Entry Point Details

### Keyboard Input
```javascript
// src/orchestration/navigation/keyboardNavigation.js

onKeyPress('ArrowDown' | 'KeyS') → unifiedNav.navigateNext()
onKeyPress('ArrowUp' | 'KeyW')   → unifiedNav.navigatePrev()
onKeyPress('KeyF')               → unifiedNav.jumpToStage(target)
```

### Narration Auto-Advance
```javascript
// src/orchestration/navigation/narrativeNavigation.js

onNarrationComplete() → {
  if (isAutoAdvanceEnabled()) {
    unifiedNav.navigateNext({ origin: 'narration' })
  }
}
```

### Sidebar UI
```javascript
// src/components/ui/navigation/SidebarNavigation.jsx

onClick(stageName) → unifiedNav.jumpToStage(stageName, {
  origin: 'sidebar',
  behavior: 'smooth'
})
```

### Programmatic API
```javascript
// Console or other components

window.stageControls.jumpToStage('velocity')
  ↓
Proxies to: unifiedNav.jumpToStage('velocity', { origin: 'api' })
```

---

## Orchestration Layers

### Layer 1: unifiedNav (Entry Point)
**File:** `src/orchestration/navigation/UnifiedNavigationAPI.js`

**Responsibilities:**
- Normalize all input sources
- Provide consistent API surface
- Route to NavigationGate

**Methods:**
```javascript
navigateNext(options)    // Move to next stage
navigatePrev(options)    // Move to previous stage
jumpToStage(slug, opts)  // Jump to specific stage
```

---

### Layer 2: NavigationGate (Validation)
**File:** `src/orchestration/navigation/NavigationGate.js`

**Responsibilities:**
- Check if navigation is allowed
- Validate stage exists
- Ensure no conflicts

**Validation:**
```javascript
if (narrationPlaying && !options.force) return false;
if (openingSequenceActive) return false;
if (!isValidStage(targetStage)) return false;
return true;  // ✅ Allow
```

---

### Layer 3: ScrollOrchestrator (Coordination)
**File:** `src/orchestration/scroll/ScrollOrchestrator.js`

**Responsibilities:**
- Coordinate scroll + state change
- Handle timing/animation
- Manage transitions

**Flow:**
```javascript
calculateScrollTarget(stage)
  ↓
scrollTo(target, { behavior: 'smooth' })
  ↓
onScrollComplete() → StateCommands.jumpToStage(stage)
```

---

### Layer 4: StateCommands (Mutation)
**File:** `src/state/commands/StateCommands.js`

**Responsibilities:**
- **ONLY** layer that writes to stageAtom
- Emit events after mutation
- Validate mutations

**Critical Rule:**
```javascript
// ✅ ONLY StateCommands can do this:
stageAtom.setState({ currentStage: newStage });

// ❌ NO OTHER FILE can write to stageAtom
```

---

### Layer 5: stageAtom (Storage)
**File:** `src/state/atoms/stageAtom.js`

**Responsibilities:**
- Store current stage
- Store auto-advance state
- Expose read-only getters

**Read-only Operations:**
```javascript
stageAtom.getState()           // Get current state
stageAtom.getCurrentStage()    // Get current stage
stageAtom.isAutoAdvanceEnabled() // Check auto-advance
```

**Write Operations:**
```javascript
// ❌ Only callable from StateCommands
stageAtom.setState({ ... })
```

---

## Event Flow

```
StateCommands.jumpToStage('velocity')
    ↓
stageAtom.setState({ currentStage: 'velocity' })
    ↓
BeatBus.emit(EVENTS.STAGE_CHANGE, {
  ev: 'STAGE_CHANGE',
  stage: 'velocity',
  origin: 'unified_nav'
})
    ↓
Listeners react:
  - TheaterDirector updates
  - UI components re-render
  - Narration controller resets
```

---

## Enforcement Mechanisms

### 1. Sentinel Tests
**File:** `tests/contracts/event-centralization.spec.mjs`

```javascript
✅ Enforces: START_NARRATIVE only from TheaterDirector
✅ Enforces: No narrativeAtom bypass helpers
✅ Fails: If violations introduced
```

### 2. Evidence Scanners
**Files:** `scripts/scan-*.mjs`

```bash
npm run scan-navigation       # Find all entry points
node scripts/scan-legacy-apis.mjs  # Find bypasses
```

### 3. Pre-commit Hooks
**File:** `.husky/pre-commit`

```bash
npm run validate-sst
npm run detect-drift
npm run test:contracts
```

---

## Violation Prevention

### ❌ What You CAN'T Do
```javascript
// Direct mutation (BLOCKED by architecture)
stageAtom.setState({ currentStage: 'velocity' })

// Bypass orchestration (REMOVED in Phase 5)
narrativeAtom.jumpToStage('velocity')

// Emit events directly (DETECTED by sentinel tests)
BeatBus.emit(EVENTS.START_NARRATIVE, { ... })
```

### ✅ What You SHOULD Do
```javascript
// Use unified API
unifiedNav.jumpToStage('velocity', { origin: 'my-component' })

// Or use stateCommands directly
stateCommands.stage.jump('velocity', { origin: 'my-component' })
```

---

## Golden State Protection

### Capture Current State
```bash
./scripts/git-forensics/capture-golden-state.sh
# Creates: golden/navigation-arch-YYYYMMDD-HHMMSS
```

### Compare to Golden
```bash
npm run build-evidence
```

---

## Success Metrics

**Before Architecture**
- Entry points: 12+
- Mutation writers: 5+
- Event emitters: 3+
- Bypass helpers: 4
- Enforcement: none

**After Architecture**
- Entry points: 1 (unified)
- Mutation writers: 1 (StateCommands)
- Event emitters: 1 (TheaterDirector)
- Bypass helpers: 0
- Enforcement: Sentinel tests + evidence scanners

---

**Architecture Status:** ✅ PRODUCTION-READY  
**Last Validated:** 2025-01-11  
**Next Review:** 2025-02-11
