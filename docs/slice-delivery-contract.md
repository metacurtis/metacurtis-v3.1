# Slice Delivery Contract

## Purpose
Define what a delivered landing slice package must include to be considered production-ready.

## Required technical artifacts
1. Latest probe JSON
2. Latest screenshot manifest
3. Latest contact sheet
4. Formation audit report
5. UI-anchor audit report
6. UI-runtime audit report
7. UI-consumer audit report
8. Gate output (`PASS`)

## Required conditions
- `schemaViolationCount = 0`
- `singleWriterViolationCount = 0`
- gate status = `PASS`
- runtime anchor payload version = `1.0`
- source scenario id = `target_scale_up_1_6` (or explicitly promoted successor)

## Delivery checklist
- Visual baseline branch/tag identified
- Scenario lineage documented
- Current package manifest passed by `audit:slice:package`
- Handoff notes include known limits and next-safe change lane

## Out of scope by default
- Beat-sheet exploration
- Renderer ownership model changes
- New rendering subsystems
- Unbounded UI redesign
