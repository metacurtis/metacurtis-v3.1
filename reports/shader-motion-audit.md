# Shader Motion Audit

## Summary

- Morph-unsafe blocks: 0
- Grid mode without spacing (local): 1
- Grid behavior in SST: YES
- Global spacing missing: YES

## Morph-Unsafe Findings

(none)

## Grid Mode Checks (uMotionMode = 1)

- `src/components/webgl/WebGLBackground.jsx:987` spacingFound=false

## Issues

- [ERROR] GRID_MODE_NO_SPACING @ src/components/webgl/WebGLBackground.jsx
  - uMotionMode=1 set at line 987 without uGridSpacing assignment in ±60 lines
  - hint: Set material.uniforms.uGridSpacing.value = vec2(x,y) before or near mode=1 assignment
- [ERROR] GRID_BEHAVIOR_NO_SPACING_ANYWHERE @ (global)
  - SST shows grid_* behavior but renderer never sets uGridSpacing
  - hint: Update dispatcher to set uGridSpacing when grid behavior or mode=1 is selected
