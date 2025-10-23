# Shader Motion Audit

## Summary

- Morph-unsafe blocks: 0
- Grid mode without spacing (local): 0
- Grid behavior in SST: YES
- Global spacing missing: YES

## Morph-Unsafe Findings

(none)

## Grid Mode Checks (uMotionMode = 1)

(none)

## Issues

- [ERROR] GRID_BEHAVIOR_NO_SPACING_ANYWHERE @ (global)
  - SST shows grid_* behavior but renderer never sets uGridSpacing
  - hint: Update dispatcher to set uGridSpacing when grid behavior or mode=1 is selected
