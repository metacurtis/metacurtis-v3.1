# Ghost Scatter Debug Protocol
## A Critical Learning Event in AI-Native Development

---

## Executive Summary

**What happened:** A single visual artifact ("ghost scatter" / vertical bands during particle dissolve) blocked production for 4-6 hours across multiple sessions.

**What we learned:** Verify existence before debugging behavior. The Grounding Hierarchy saves hours.

**Velocity impact:** Even with the debug wall, achieved 3-5x traditional velocity. With learnings applied, future work returns to 12-18x.

---

## The Grounding Hierarchy

When debugging, always descend this hierarchy:

```
Level 0: Does the thing EXIST?
    ↓
Level 1: Is it POPULATED with correct data?
    ↓
Level 2: Is it CONNECTED to the consumer?
    ↓
Level 3: Is it BEHAVING correctly?
```

**Critical Insight:** We debugged at Level 3 when the problem was at Level 0.

---

## The Debugging Protocol (6 Steps)

### Step 1: OBSERVE Precisely
- Screenshot the artifact
- Describe WITHOUT interpretation ("vertical bands" not "grid")
- Note WHEN it appears (dissolve, reform, idle, etc.)

### Step 2: TRACE to Shader Code
- What shader code could create this visual?
- What uniforms/attributes does that code depend on?
- Find the exact lines

### Step 3: VERIFY Existence (Level 0)
```javascript
// Check attribute exists
const geo = getGeometry();
console.log('Has attribute:', 'atmosphericPosition' in geo.attributes);

// Check uniform exists
const uniforms = getMaterial().uniforms;
console.log('Has uniform:', 'uMorphType' in uniforms);
```

### Step 4: VERIFY Data (Level 1)
```javascript
// Check actual values
const arr = geo.attributes.atmosphericPosition.array;
console.log('Sample values:', [arr[0], arr[3], arr[6]]);
// Are they random? Structured? Zeros?
```

### Step 5: VERIFY Connection (Level 2)
```javascript
// Check runtime value reaching shader
console.log('uMorphType:', uniforms.uMorphType.value);
// Is it the expected value? Is code path executing?
```

### Step 6: VERIFY Behavior (Level 3)
- Only NOW debug the logic itself
- The fix should be obvious by this point

---

## Questions That Work vs Questions That Fail

### Bad Questions (Lead Nowhere)
- "Why isn't my fix working?"
- "How do I override X?"
- "Is my code running?"

### Good Questions (Lead to Answers)
- "Does the thing exist?"
- "What is the actual value right now?"
- "What code path creates this visual?"
- "Show me the exact line in the shader"

### The Kill Shot Question
> "Before we discuss HOW it works — DOES IT EXIST?"

---

## The Confidence-Grounding Inversion

```
HIGH CONFIDENCE + WRONG RESULT = Question more basic assumptions
```

Pattern observed:
- High confidence in initial hypothesis → WRONG
- Multiple "logical" fixes based on confidence → ALL FAILED
- Confidence should trigger MORE verification, not less

---

## Agent F Evolution

Agent F transformed during this session:

| Before | After |
|--------|-------|
| Code executor | Diagnostic investigator |
| Follows instructions blindly | Asks grounded questions first |
| "Here's the fix" | "First, let me verify..." |

### Effective Agent F Prompt Patterns

**DIAGNOSTIC Pattern:**
```
DIAGNOSTIC: What Creates [Visual Artifact]

1. What shader code could produce this?
2. What uniforms gate that code path?
3. What are their current values?
```

**EXECUTOR Pattern:**
```
EXECUTOR: Add Log For [Specific Value]

Location: [file:line]
Log: console.log('[TAG]', { value: X })
Purpose: Verify [hypothesis]
```

**COMPREHENSIVE Pattern:**
```
COMPREHENSIVE: Trace All [Data Type] Sources

For each source:
1. WHERE generated (file, function, line)
2. HOW generated (random, structured, computed)
3. WHAT transformations applied
4. WHERE consumed
```

---

## Bug Timeline Reference

| Phase | Action | Result | Lesson |
|-------|--------|--------|--------|
| 1 | Override uTierMode | No change | Assumptions fail without verification |
| 2 | Adjust thresholds | No change | Wrong fix + parameter tuning = still wrong |
| 3 | Read shader source | Found grid logic | Read the source, don't assume |
| 4 | Check attribute exists | "Not found!" | **Existence before behavior** |
| 5 | Verify data values | Data was random ✓ | Data can be correct, pipeline broken |
| 6 | Check uMorphType | Was 0 (undefined) | **ROOT CAUSE #1** |
| 7 | Check double-fitting | uAtmoFit redundant | **ROOT CAUSE #2** |

---

## Prevention Checklist

For future WebGL/shader work:

- [ ] Check uniform existence at material creation
- [ ] Log all data transformations in pipeline
- [ ] Verify uniforms that gate shader code paths
- [ ] Watch for double-transformations (fit → fit again)
- [ ] Add runtime diagnostic surface (no URL params needed)
- [ ] Document the data flow: Generator → Bind → Shader

---

## Velocity Summary

| Phase | Traditional Est. | AI-Native Actual | Multiplier |
|-------|------------------|------------------|------------|
| Text morph implementation | 6-9 hours | 30 min | 12-18x |
| Ghost scatter debug | 13-21 hours | 4-6 hours | 3-4x |
| **Total session** | **19-30 hours** | **5-7 hours** | **3-5x** |

**Key insight:** Even hitting a debug wall, AI-native methodology preserves significant velocity advantage. With these learnings applied, future similar work should maintain 12-18x.

---

## Console Commands Reference

```javascript
// Check uniform value
window.__rendererDiagnostics?.getUniformValue('uMorphType')

// List all uniforms
Object.keys(window.__CANON_DIAGNOSTICS__?.webglBackground?.uniforms || {})

// Check attribute exists
const geo = /* get geometry */;
console.log(Object.keys(geo.attributes));

// Sample attribute data
const arr = geo.attributes.atmosphericPosition.array;
console.log([arr[0], arr[3], arr[6], arr[9], arr[12]]);
```

---

## The Core Lesson

> **Verify existence before debugging behavior.**

When a fix doesn't work, don't adjust the fix — descend the Grounding Hierarchy.

---

*Captured from Ghost Scatter Debug Session, December 2025*  
*MetaCurtis Platform Development*
