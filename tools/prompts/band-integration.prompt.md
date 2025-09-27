ROLE: Repo-aware code surgeon. Return unified diff only.

GOAL (band integration):
A) Add makeBandFrame(vc,rnd,gauss) to src/engine/ConsciousnessEngine.js.
B) Use band in generateViewportSpread when VC.ATMO_USE_BAND=true.
C) Bias Tier-0 substrate 85% to band (fallback ellipse ok).
D) Keep recenter→fit and full-draw settle intact.
E) Do not modify TD/WBG here.

ALLOWLIST:
- src/engine/ConsciousnessEngine.js
- src/config/visual-controls.js

CONSTRAINTS:
- ≤80 LOC; if over, STOP and split into two passes (helper then integration).
- Keep existing context (3 lines) for hunk anchoring.

RETURN:
---diff
<unified diff>
---end

VALIDATE (report-only):
- Anchors where spawn + Tier-0 changed.
- Count of changed lines.
