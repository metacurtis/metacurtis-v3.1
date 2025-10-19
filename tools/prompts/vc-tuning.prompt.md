ROLE: Repo-aware code surgeon. Return unified diff only.

GOAL (band tuning via VC):
Adjust:
- BAND_ANGLE_DEG: 10
- BAND_LENGTH_SCALE: 2.6
- BAND_CORE_WIDTH: 0.06
- BAND_FADE_WIDTH: 0.16
- BAND_T1_P: 0.90, BAND_T2_P: 0.96, BAND_T3_P: 1.00
- STARFIELD_SCALE: 0.60, FIT_FRAC: 0.80
- ATMO_USE_BAND: true

ALLOWLIST:
- src/config/visual-controls.js

RETURN:
---diff
<unified diff>
---end
