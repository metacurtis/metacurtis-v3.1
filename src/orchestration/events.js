// src/orchestration/events.js
// Event constants for BeatBus

export const Events = Object.freeze({
  // Stage events
  StageChange: 'stage/change',
  StageProgress: 'stage/progress',

  // Narrative events
  NarrativeStart: 'narrative/start',
  NarrativeSegment: 'narrative/segment',
  NarrativeEnd: 'narrative/end',

  // Fragment events
  FragmentShow: 'fragment/show',
  FragmentDismiss: 'fragment/dismiss',
  FragmentComplete: 'fragment/complete',

  // Shader events
  ShaderUniform: 'shader/uniform',
  ShaderPulse: 'shader/pulse',
  FusionTrigger: 'fusion/trigger',

  // Camera events
  CameraMove: 'camera/move',
  CameraPreset: 'camera/preset',

  // Performance events
  QualityChange: 'quality/change',
  PerformanceAlert: 'performance/alert',
});
