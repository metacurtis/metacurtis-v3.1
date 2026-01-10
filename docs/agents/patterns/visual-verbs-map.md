# Visual Effects Verb Map (v3.5)

Sources:
- sst/canon/v3.5.json (visualEffects.particleEffects)
- src/config/canonical/visualEffects.js (VERB_UNIFORM_MAP)
- src/components/webgl/WebGLBackground.jsx (renderer verb overrides)

## Morph-setting verbs (renderer overrides)
These verbs set uMorphProgress inside the renderer and will conflict with external morph control.

- pullIn (default uMorphProgress=0.97)
- morph (default uMorphProgress=0.96)
- sparkDrift (default uMorphProgress=0.96)
- bloomPulse (default uMorphProgress=0.98)

## Demo verbs (VERB_UNIFORM_MAP)

| verb | uniforms (renderer fields) | morph-setting |
| --- | --- | --- |
| bloomPulse | uMotionMode=0, uFlowTurbulence=0.2, uParticleFlash=0.8, uEffectIntensity=0.12, uBloomIntensity=0.25, uBloomShape=rampThenFade, uColor=#A37CFF | yes |
| breathing_rhythm | uMotionMode=0, uParticleFlash=0.25, uOpacityMin=0.45, uOpacityMax=0.85 | no |
| chaos | uMotionMode=3, uFlowTurbulence=1, uParticleFlash=0.8, uOpacityMin=0.4, uOpacityMax=1 | no |
| coalesce | uMotionMode=1, uFlowTurbulence=0.35, uParticleFlash=0.5, uOpacityMin=0.5, uOpacityMax=0.9 | no |
| endCard | uFadeToBlack=1, uEndCardAlpha=1, uEndCardColor=#FFFFFF | no |
| flicker_fade_back_to_blue | uMotionMode=0, uParticleFlash=0.35, uOpacityMin=0.4, uOpacityMax=0.9 | no |
| gentle_drift | uMotionMode=3, uFlowTurbulence=0.2, uOpacityMin=0.5, uOpacityMax=0.8 | no |
| morph | uMotionMode=1, uFlowTurbulence=0.45, uParticleFlash=0.55, uEffectIntensity=0.22, uBloomIntensity=0.1, uColor=#19F4C7 | yes |
| particles_begin_columns | none | no |
| pullIn | uMotionMode=1, uFlowTurbulence=0.5, uParticleFlash=0.6, uEffectIntensity=0.18, uBloomIntensity=0.08, uColor=#00A4FF | yes |
| reform_as_structure | none | no |
| settle | uMotionMode=1, uFlowTurbulence=0.15, uParticleFlash=0.2, uOpacityMin=0.6, uOpacityMax=0.9 | no |
| sparkDrift | uMotionMode=3, uFlowTurbulence=0.85, uParticleFlash=0.7, uEffectIntensity=0.26, uBloomIntensity=0.12, uColor=#A37CFF | yes |
| tier2_lock_into_grid | none | no |

## SST visualEffects particleEffects -> derived directive fields

| verb | derived fields (translateToRendererDirective) | morph-setting |
| --- | --- | --- |
| all_stages_echo | uOpacityMin=0.5, uOpacityMax=1 | no |
| ballet_choreography | uOpacityMin=0.5, uOpacityMax=1 | no |
| blueprint_complete | uOpacityMin=0.5, uOpacityMax=1 | no |
| blueprint_grid_emerge | tierModes=[1,1,1,1], uMotionMode=1, uOpacityMin=0.5, uOpacityMax=1, tierParams=[[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0]] | no |
| breathing_rhythm | uMotionMode=0, tierModes=[0,0,0,0], uFlowTurbulence=0.05, tierHighlight=[0,1,2], uOpacityMin=0.5, uOpacityMax=1, tierParams=[[0.05,0.1,0.5,0],[0.05,0.1,0.5,0],[0.05,0.1,0.5,0],[0.05,0.1,0.5,0]], amplitude=0.1 | no |
| cascade_acceleration | uOpacityMin=0.5, uOpacityMax=1 | no |
| connection_strengthen | uOpacityMin=0.5, uOpacityMax=1 | no |
| consciousness_nodes_pulse | uOpacityMin=0.5, uOpacityMax=1 | no |
| cosmic_dust_swirl | uOpacityMin=0.5, uOpacityMax=1 | no |
| flicker_fade_back_to_blue | tierHighlight=[0,1,2,3], uOpacityMin=0.5, uOpacityMax=1 | no |
| fusion_pattern | uOpacityMin=0.5, uOpacityMax=1 | no |
| galactic_arm_rotate | uOpacityMin=0.5, uOpacityMax=1 | no |
| genesis_callback_purple | uOpacityMin=0.5, uOpacityMax=1 | no |
| gentle_drift | tierModes=[0,0,0,0], uMotionMode=3, uFlowTurbulence=0.2, tierHighlight=[0,1], uOpacityMin=0.5, uOpacityMax=1, tierParams=[[0.2,0.3,0.5,0],[0.2,0.3,0.5,0],[0.2,0.3,0.5,0],[0.2,0.3,0.5,0]], amplitude=0.3, frequency=0.15 | no |
| golden_ratio_complete | uOpacityMin=0.5, uOpacityMax=1 | no |
| golden_ratio_spiral | uOpacityMin=0.5, uOpacityMax=1 | no |
| green_flicker | tierHighlight=[0,1,2,3], uOpacityMin=0.5, uOpacityMax=1 | no |
| isometric_view_rotate | uOpacityMin=0.5, uOpacityMax=1 | no |
| laminar_flow_perfect | tierModes=[2,2,2,2], uMotionMode=2, uOpacityMin=0.5, uOpacityMax=1, tierParams=[[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0]] | no |
| layer_stack_reveal | uOpacityMin=0.5, uOpacityMax=1 | no |
| master_plan_glow | uOpacityMin=0.5, uOpacityMax=1 | no |
| neural_pathways_light | uOpacityMin=0.5, uOpacityMax=1 | no |
| no_change | uOpacityMin=0.5, uOpacityMax=1 | no |
| orbit_sync_begin | tierModes=[4,4,4,4], uMotionMode=4, uOpacityMin=0.5, uOpacityMax=1, tierParams=[[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0]] | no |
| particles_accelerate | uFlowTurbulence=2, tierHighlight=[0,1,2,3], uOpacityMin=0.5, uOpacityMax=1 | no |
| particles_begin_columns | tierModes=[1,1,1,1], uMotionMode=1, tierHighlight=[1,2], uOpacityMin=0.5, uOpacityMax=1, tierParams=[[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0]] | no |
| phase_lock_achieve | uOpacityMin=0.5, uOpacityMax=1 | no |
| prepare_flicker | tierHighlight=[2,3], uOpacityMin=0.5, uOpacityMax=1 | no |
| question_expand | uOpacityMin=0.5, uOpacityMax=1 | no |
| reform_as_flow | tierModes=[2,2,2,2], uMotionMode=2, uOpacityMin=0.5, uOpacityMax=1, tierParams=[[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0]] | no |
| reform_as_structure | tierModes=[1,1,1,1], uMotionMode=1, tierHighlight=[1,2], uOpacityMin=0.5, uOpacityMax=1, tierParams=[[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0]] | no |
| settle_to_form | tierHighlight=[0,1,2,3], uOpacityMin=0.5, uOpacityMax=1 | no |
| static_hold | tierHighlight=[0,1,2,3], uOpacityMin=0.5, uOpacityMax=1 | no |
| streak_trails_form | tierModes=[3,3,3,3], uMotionMode=3, uStreakIntensity=1, tierHighlight=[1,2], uOpacityMin=0.5, uOpacityMax=1, tierParams=[[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0]] | no |
| tier2_flicker_increase | uMotionMode=0, tierModes=[0,0,0,0], uParticleFlash=0.05, tierHighlight=[2], uOpacityMin=0.5, uOpacityMax=1, tierParams=[[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0]] | no |
| tier2_lock_into_grid | tierModes=[1,1,1,1], uMotionMode=1, tierHighlight=[2], uOpacityMin=0.5, uOpacityMax=1, tierParams=[[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0]] | no |
| tier2_pulse_sync | uOpacityMin=0.5, uOpacityMax=1 | no |
| tier3_cadence_pulse | uParticleFlash=0.4, tierHighlight=[3], uOpacityMin=0.5, uOpacityMax=1, frequency=2 | no |
| tier3_construction_guide | uOpacityMin=0.5, uOpacityMax=1 | no |
| tier3_glow_pulse | uParticleFlash=0.6, tierHighlight=[3], uOpacityMin=0.5, uOpacityMax=1, frequency=0.5 | no |
| tier3_lightning_burst | uOpacityMin=0.5, uOpacityMax=1 | no |
| tier3_sparkle | tierHighlight=[3], uOpacityMin=0.5, uOpacityMax=1 | no |
| tier3_subtle_pulse | uParticleFlash=0.2, tierHighlight=[3], uOpacityMin=0.5, uOpacityMax=1, frequency=0.3 | no |
| tier3_synaptic_flash | uOpacityMin=0.5, uOpacityMax=1 | no |
| transcendent_integration | uOpacityMin=0.5, uOpacityMax=1 | no |
| unified_field | uOpacityMin=0.5, uOpacityMax=1 | no |
| velocity_peak | tierModes=[3,3,3,3], uMotionMode=3, uOpacityMin=0.5, uOpacityMax=1, tierParams=[[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0],[0.8,0.2,0.5,0]] | no |

Notes:
- If a verb is not in VERB_UNIFORM_MAP, VisualOrchestrator.applyVerb will throw in DEV if used.
- SST visualEffects are translated via translateToRendererDirective when accessed through Canonical.getVisualEffect.
- The renderer also accepts payload.uniforms for direct uniform writes; those are not listed here.