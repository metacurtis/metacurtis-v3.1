// src/config/visual-controls.js
// Visual Controls (Data-first tuning) — sentinel comments mark safe literals

export const VC = {
  // Emergence pacing
  IMPLODE_MS: 1100,      /* VC.IMPLODE_MS */   // 7.7–8.7s (implosion)
  SETTLE_MS:   900,      /* VC.SETTLE_MS  */   // 8.7–9.6s (settle)
  MID_MORPH:   0.88,     /* VC.MID_MORPH  */   // morph target at end of implosion

  // Spawn behind camera
  Z_BACK_MIN:  80,       /* VC.Z_BACK_MIN */
  Z_BACK_MAX: 120,       /* VC.Z_BACK_MAX */

  // Viewport XY cap (world units)
  VIEW_CAP_HALF_W: 40,   /* VC.VIEW_CAP_HALF_W */
  VIEW_CAP_HALF_H: 30,   /* VC.VIEW_CAP_HALF_H */

  // Starfield fit (as fraction of min(viewWidth, viewHeight))
  STARFIELD_SCALE: 0.95, /* VC.STARFIELD_SCALE */
  FIT_FRAC:        0.92, /* VC.FIT_FRAC */
  TIER_RATIOS:     [0.70, 0.12, 0.13, 0.05], /* VC.TIER_RATIOS */ // Heavier Tier-0 scatter; extra Tier-2 density
  // Optional: force a final fit in Genesis even if emergence already fitted.
  // Default false to preserve the emergence band's exact layout.
  FINAL_FIT_GENESIS: false,
  ATMO_SCALE:      1.00, /* VC.ATMO_SCALE     */ // atmospheric XY spread vs target (>1 → implosion feel)
  // Use band sampler for atmospheric spawn (instead of ellipse)
  ATMO_USE_BAND:   true, /* VC.ATMO_USE_BAND */

  // Visual kick (engine directives → renderer uniforms)
  POINT_SIZE_KICK: 1.4,  /* VC.POINT_SIZE_KICK */
  SIGMA_BASE:     2.5,   /* VC.SIGMA_BASE */
  SIGMA_PEAK:     3.8,   /* VC.SIGMA_PEAK */

  // Tier-4 highlight curve
  T4_HI_PEAK:   1.0,     /* VC.T4_HI_PEAK */
  T4_HI_SETTLE: 0.25,    /* VC.T4_HI_SETTLE */

  // Starfield distribution controls (tiers)
  // Percentages still controlled by engine tierRatios; these tune spatial look.
  T0_SIGMA_Y_FLATTEN: 1.0,   /* VC.T0_SIGMA_Y_FLATTEN */ // full viewport scatter
  T0_Z_JITTER:        4,     /* VC.T0_Z_JITTER       */
  T0_BAND_P:          0.25,  /* VC.T0_BAND_P        */ // 25% follow band, 75% scatter (more off-band stars)

  T1_Z_JITTER:        3,     /* VC.T1_Z_JITTER       */
  BAND_T1_P:          0.95,  /* VC.BAND_T1_P        */

  T2_CLUSTER_COUNT:   8,     /* VC.T2_CLUSTER_COUNT  */ // denser core
  T2_CLUSTER_SIGMA:   0.035, /* VC.T2_CLUSTER_SIGMA  */ // tighter clusters around core
  T2_Z_JITTER:        2,     /* VC.T2_Z_JITTER       */
  BAND_T2_P:          0.98,  /* VC.BAND_T2_P        */

  // Constellation anchors (Tier-3)
  USE_T3_TEXT:        false, /* VC.USE_T3_TEXT       */ // use downsampled text if font loaded
  T3_TEXT:            'HELLO CURTIS', /* VC.T3_TEXT */
  T3_TEXT_SCALE:      0.70,  /* VC.T3_TEXT_SCALE     */ // relative to STARFIELD_SCALE
  T3_Z_JITTER:        0.5,   /* VC.T3_Z_JITTER       */
  BAND_T3_P:          1.00,  /* VC.BAND_T3_P        */

  // Band frame controls (Milky Way ribbon mapping)
  BAND_ENABLED:       true,
  BAND_ANGLE_DEG:     0,
  BAND_LENGTH_SCALE:  2.80,
  BAND_CORE_WIDTH:    0.06,
  BAND_FADE_WIDTH:    0.35,
};
