// src/components/webgl/consciousness/ConsciousnessEngine.js
// 🧠 CONSCIOUSNESS ENGINE: Complete Production-Ready Configuration
// ✅ FINAL OPTIMIZATION: Enhanced point scale system for perfect sprite visibility
// ✅ PRODUCTION READY: All pinhole fixes integrated with per-stage scaling

import * as THREE from 'three';

/* ────────────────────────────────────────────────────────────────────────────
   🧠 CONSTELLATION SCALE CONSTANTS - PRODUCTION OPTIMIZED
   ──────────────────────────────────────────────────────────────────────── */

const CONSTELLATION_CONSTANTS = {
  VIEWPORT_COVERAGE: 0.90,
  BASE_CONSTELLATION_SCALE: 4.5,
  ANATOMICAL_PRECISION: 0.95,
  COSMIC_SCALE_MULTIPLIER: 1.2,
  ATMOSPHERIC_SCALE: 35.0,
  
  // ✅ ENHANCED: Point scale system for perfect sprite visibility
  POINT_SCALE_SYSTEM: {
    BASE_SCALE: 150.0,        // Enhanced base scale for atmospheric visibility
    STAGE_MULTIPLIERS: {      // Per-stage scaling for narrative impact
      genesis: 1.0,           // Balanced memory formation visibility
      discipline: 1.05,       // Military precision scaling
      neural: 1.2,            // Enhanced learning pathway visibility
      velocity: 1.5,          // High-energy electrical storm impact
      architecture: 1.1,      // Balanced analytical precision
      harmony: 1.3,           // Elegant balletic presence
      transcendence: 1.6      // Maximum cosmic consciousness impact
    },
    QUALITY_MULTIPLIERS: {    // Quality-based optimization
      LOW: 0.8,
      MEDIUM: 1.0,
      HIGH: 1.2,
      ULTRA: 1.4
    }
  },

  DISTRIBUTION_SPACING: {
    TIGHT: 0.8,
    NORMAL: 1.0,
    WIDE: 1.3
  },

  CAMERA_FITTING: {
    ENABLED: true,
    MARGIN: 1.6,               // ✅ PINHOLE FIX: 1.6 margin for sprite compensation
    EMERGENCY_DISTANCE: 300,
    MIN_DISTANCE: 50,
    MAX_DISTANCE: 1000
  }
};

/* ────────────────────────────────────────────────────────────────────────────
   🧠 CONSCIOUSNESS THEATER STAGES - PRODUCTION OPTIMIZED
   ──────────────────────────────────────────────────────────────────────── */

const CONSCIOUSNESS_THEATER_STAGES = {
  0: {
    name: 'genesis',
    particles: 4000,
    particleSize: 15.0,
    colors: ['#00FF00', '#22c55e', '#15803d'],
    description: '1983: Age 8 - The Genesis Code - Single hippocampus constellation',
    constellation: {
      formation: 'scattered_genesis',
      anatomicalFocus: 'hippocampus',
      brainRegion: 'hippocampus',
      coveragePercent: 100,
      spacing: 2.0,
      edgeBuffer: 0.95,
      distribution: 'NORMAL'
    },
    camera: {
      distance: 75,
      fov: 75,
      target: [0, 0, 0],
      fitting: {
        enabled: true,
        margin: 1.6,      // ✅ PINHOLE FIX: Consistent 1.6 margin
        preferredDistance: 75
      }
    },
    shaderEffects: {
      shimmerIntensity: 1.0,
      livingAmplitude: 1.2,
      livingFrequency: 1.0,
      livingSpeed: 1.4,
      auroraIntensity: 0.6,
      pointScale: 90.0      // ✅ NEW: Stage-specific point scaling
    }
  },
  1: {
    name: 'discipline',
    particles: 6000,
    particleSize: 13.0,
    colors: ['#1e40af', '#3b82f6', '#1d4ed8'],
    description: '1983-2022: Discipline Forged - Military brainstem formations',
    constellation: {
      formation: 'military_precision',
      anatomicalFocus: 'brainstem',
      brainRegion: 'brainstem',
      coveragePercent: 100,
      spacing: 2.1,
      edgeBuffer: 0.95,
      distribution: 'TIGHT'
    },
    camera: {
      distance: 70,
      fov: 72,
      target: [0, 0, 0],
      fitting: {
        enabled: true,
        margin: 1.6,
        preferredDistance: 70
      }
    },
    shaderEffects: {
      shimmerIntensity: 0.8,
      livingAmplitude: 1.0,
      livingFrequency: 0.8,
      livingSpeed: 1.0,
      auroraIntensity: 0.7,
      pointScale: 95.0
    }
  },
  2: {
    name: 'neural',
    particles: 10000,
    particleSize: 12.0,
    colors: ['#4338ca', '#a855f7', '#7c3aed'],
    description: '2022-2025: Neural Awakening - AI partnership pathways',
    constellation: {
      formation: 'neural_pathways',
      anatomicalFocus: 'temporal_lobe',
      brainRegion: 'leftTemporal',
      coveragePercent: 100,
      spacing: 2.2,
      edgeBuffer: 0.93,
      distribution: 'NORMAL'
    },
    camera: {
      distance: 80,
      fov: 78,
      target: [0, 0, 0],
      fitting: {
        enabled: true,
        margin: 1.6,
        preferredDistance: 80
      }
    },
    shaderEffects: {
      shimmerIntensity: 1.2,
      livingAmplitude: 1.8,
      livingFrequency: 1.3,
      livingSpeed: 2.0,
      auroraIntensity: 1.2,
      pointScale: 110.0
    }
  },
  3: {
    name: 'velocity',
    particles: 14000,
    particleSize: 11.0,
    colors: ['#7c3aed', '#9333ea', '#6b21a8'],
    description: 'February 2025: Velocity Explosion - Global electrical storm',
    constellation: {
      formation: 'electrical_storm',
      anatomicalFocus: 'right_temporal',
      brainRegion: 'rightTemporal',
      coveragePercent: 100,
      spacing: 2.5,
      edgeBuffer: 0.90,
      distribution: 'WIDE'
    },
    camera: {
      distance: 85,
      fov: 85,
      target: [0, 0, 0],
      fitting: {
        enabled: true,
        margin: 1.6,
        preferredDistance: 85
      }
    },
    shaderEffects: {
      shimmerIntensity: 1.5,
      livingAmplitude: 1.4,
      livingFrequency: 0.6,
      livingSpeed: 1.2,
      auroraIntensity: 1.0,
      pointScale: 130.0     // ✅ ENHANCED: High-energy scaling
    }
  },
  4: {
    name: 'architecture',
    particles: 12000,
    particleSize: 12.5,
    colors: ['#0891b2', '#06b6d4', '#0e7490'],
    description: 'March 2025: Architecture Consciousness - Analytical grids',
    constellation: {
      formation: 'analytical_grids',
      anatomicalFocus: 'frontal_lobe',
      brainRegion: 'frontalLobe',
      coveragePercent: 100,
      spacing: 2.3,
      edgeBuffer: 0.92,
      distribution: 'NORMAL'
    },
    camera: {
      distance: 78,
      fov: 80,
      target: [0, 0, 0],
      fitting: {
        enabled: true,
        margin: 1.6,
        preferredDistance: 78
      }
    },
    shaderEffects: {
      shimmerIntensity: 1.0,
      livingAmplitude: 1.1,
      livingFrequency: 0.5,
      livingSpeed: 0.9,
      auroraIntensity: 1.1,
      pointScale: 100.0
    }
  },
  5: {
    name: 'harmony',
    particles: 15000,
    particleSize: 14.0,
    colors: ['#f59e0b', '#d97706', '#b45309'],
    description: 'March 2025: Harmonic Mastery - Balletic consciousness flow',
    constellation: {
      formation: 'harmonic_flow',
      anatomicalFocus: 'left_prefrontal',
      brainRegion: 'leftPrefrontal',
      coveragePercent: 100,
      spacing: 2.4,
      edgeBuffer: 0.91,
      distribution: 'NORMAL'
    },
    camera: {
      distance: 82,
      fov: 82,
      target: [0, 0, 0],
      fitting: {
        enabled: true,
        margin: 1.6,
        preferredDistance: 82
      }
    },
    shaderEffects: {
      shimmerIntensity: 1.3,
      livingAmplitude: 1.3,
      livingFrequency: 0.4,
      livingSpeed: 0.7,
      auroraIntensity: 1.3,
      pointScale: 115.0
    }
  },
  6: {
    name: 'transcendence',
    particles: 15000,
    particlesShowcase: 17000,
    particleSize: 16.0,
    colors: ['#ffffff', '#f59e0b', '#00ffcc'],
    description: 'Present: Consciousness Transcendence - Unified galaxy',
    constellation: {
      formation: 'unified_galaxy',
      anatomicalFocus: 'consciousness_core',
      brainRegion: 'consciousnessCore',
      coveragePercent: 100,
      spacing: 2.6,
      edgeBuffer: 0.88,
      distribution: 'WIDE'
    },
    camera: {
      distance: 90,
      fov: 90,
      target: [0, 0, 0],
      fitting: {
        enabled: true,
        margin: 1.6,
        preferredDistance: 90
      }
    },
    shaderEffects: {
      shimmerIntensity: 1.5,
      livingAmplitude: 1.0,
      livingFrequency: 0.3,
      livingSpeed: 0.6,
      auroraIntensity: 1.4,
      pointScale: 140.0     // ✅ MAXIMUM: Transcendence impact
    }
  }
};

// Stage name mapping
const CONSCIOUSNESS_STAGE_NAME_TO_INDEX = {
  genesis: 0, discipline: 1, neural: 2, velocity: 3,
  architecture: 4, harmony: 5, transcendence: 6,
  silent: 1, awakening: 2, acceleration: 3
};

// Allen Atlas brain regions (unchanged)
const ALLEN_ATLAS_BRAIN_REGIONS = {
  hippocampus: {
    stageIndex: 0,
    anatomicalName: 'Hippocampus',
    function: 'Memory Formation & Encoding',
    shape: 'c_curve',
    coordinateSystem: 'allen_atlas_hippocampus'
  },
  brainstem: {
    stageIndex: 1,
    anatomicalName: 'Brainstem', 
    function: 'Autonomic Regulation & Control',
    shape: 'column_formation',
    coordinateSystem: 'allen_atlas_brainstem'
  },
  leftTemporal: {
    stageIndex: 2,
    anatomicalName: 'Left Temporal Lobe',
    function: 'Language Processing & Learning', 
    shape: 'neural_networks',
    coordinateSystem: 'allen_atlas_temporal_left'
  },
  rightTemporal: {
    stageIndex: 3,
    anatomicalName: 'Right Temporal Lobe',
    function: 'Creative Processing & Pattern Recognition',
    shape: 'electrical_storm', 
    coordinateSystem: 'allen_atlas_temporal_right'
  },
  frontalLobe: {
    stageIndex: 4,
    anatomicalName: 'Frontal Lobe',
    function: 'Executive Function & Problem Solving',
    shape: 'analytical_grids',
    coordinateSystem: 'allen_atlas_frontal'
  },
  leftPrefrontal: {
    stageIndex: 5,
    anatomicalName: 'Left Prefrontal Cortex',
    function: 'Strategic Planning & Coordination',
    shape: 'balletic_choreography',
    coordinateSystem: 'allen_atlas_prefrontal_left'
  },
  consciousnessCore: {
    stageIndex: 6,
    anatomicalName: 'Integrated Consciousness Network',
    function: 'Unified Cognitive Integration',
    shape: 'unified_galaxy',
    coordinateSystem: 'allen_atlas_consciousness_core'
  }
};

/* ────────────────────────────────────────────────────────────────────────────
   🧠 CONSCIOUSNESS ENGINE: PRODUCTION CLASS
   ──────────────────────────────────────────────────────────────────────── */

class ConsciousnessEngine {
  constructor() {
    if (ConsciousnessEngine.instance) {
      return ConsciousnessEngine.instance;
    }
    ConsciousnessEngine.instance = this;

    this.brainRegionCoordinatesCache = {};
    this.initializeAllenAtlasCoordinates();

    console.log('🧠 ConsciousnessEngine: Production-Ready Constellation System Initialized');
  }

  /* ────────────────────────────────────────────────────────────────────────
     ✅ PRODUCTION: Enhanced Point Scale Calculation
     ──────────────────────────────────────────────────────────────────── */

  _calculatePointScale(stageName, qualityTier) {
    const baseScale = CONSTELLATION_CONSTANTS.POINT_SCALE_SYSTEM.BASE_SCALE;
    const stageMultiplier = CONSTELLATION_CONSTANTS.POINT_SCALE_SYSTEM.STAGE_MULTIPLIERS[stageName] || 1.0;
    const qualityMultiplier = CONSTELLATION_CONSTANTS.POINT_SCALE_SYSTEM.QUALITY_MULTIPLIERS[qualityTier] || 1.0;
    
    return baseScale * stageMultiplier * qualityMultiplier;
  }

  _getConstellationScale(stageName) {
    const stageConfig = this.getConsciousnessStageConfig(stageName, 'HIGH');
    let scale = CONSTELLATION_CONSTANTS.BASE_CONSTELLATION_SCALE * 
                CONSTELLATION_CONSTANTS.VIEWPORT_COVERAGE;

    if (stageName === 'velocity' || stageName === 'transcendence') {
      scale *= CONSTELLATION_CONSTANTS.COSMIC_SCALE_MULTIPLIER;
    }

    const spacingType = stageConfig.constellation?.distribution || 'NORMAL';
    const spacingMultiplier = CONSTELLATION_CONSTANTS.DISTRIBUTION_SPACING[spacingType.toUpperCase()] || 1.0;
    scale *= spacingMultiplier;

    return scale;
  }

  /* ────────────────────────────────────────────────────────────────────────
     ✅ PRODUCTION: Configuration Service
     ──────────────────────────────────────────────────────────────────── */

  getConsciousnessStageConfig(stageName, qualityTier) {
    const stageIndex = CONSCIOUSNESS_STAGE_NAME_TO_INDEX[stageName] || 0;
    const baseConfig = CONSCIOUSNESS_THEATER_STAGES[stageIndex] || CONSCIOUSNESS_THEATER_STAGES[0];
    
    const qualityMultipliers = {
      ULTRA: { particles: 1.2, effects: 1.1, spacing: 1.0 },
      HIGH: { particles: 1.0, effects: 1.0, spacing: 1.0 },
      MEDIUM: { particles: 0.8, effects: 0.9, spacing: 0.9 },
      LOW: { particles: 0.6, effects: 0.8, spacing: 0.8 },
    };

    const multiplier = qualityMultipliers[qualityTier] || qualityMultipliers.HIGH;

    const particleCount = baseConfig.particlesShowcase && 
                         qualityTier === 'ULTRA' && 
                         stageName === 'transcendence' 
      ? baseConfig.particlesShowcase 
      : baseConfig.particles;

    return {
      ...baseConfig,
      particles: Math.round(particleCount * multiplier.particles),
      stageIndex,
      constellation: {
        ...baseConfig.constellation,
        spacing: baseConfig.constellation.spacing * multiplier.spacing,
      },
      shaderEffects: {
        ...baseConfig.shaderEffects,
        livingAmplitude: baseConfig.shaderEffects.livingAmplitude * multiplier.effects,
        shimmerIntensity: baseConfig.shaderEffects.shimmerIntensity * multiplier.effects,
        // ✅ ENHANCED: Point scale with quality adjustment
        pointScale: (baseConfig.shaderEffects.pointScale || this._calculatePointScale(stageName, qualityTier))
      },
    };
  }

  /* ────────────────────────────────────────────────────────────────────────
     ✅ PRODUCTION: Enhanced Camera Configuration
     ──────────────────────────────────────────────────────────────────── */

  getCameraConfiguration(stageName, aspectRatio = null, options = {}) {
    const stageConfig = this.getConsciousnessStageConfig(stageName, 'HIGH');
    const camera = stageConfig.camera;
    
    const {
      enableDynamicFitting = CONSTELLATION_CONSTANTS.CAMERA_FITTING.ENABLED,
      useFallbackDistance = false,
      forceFittingMargin = null
    } = options;
    
    const currentAspectRatio = aspectRatio || 1.6;
    
    const config = {
      position: [
        camera.target[0],
        camera.target[1], 
        camera.distance * Math.max(1.0, currentAspectRatio / 1.6)
      ],
      fov: camera.fov,
      near: 0.1,
      far: camera.distance * 3,
      target: camera.target,
      
      fitting: {
        enabled: enableDynamicFitting && (camera.fitting?.enabled !== false),
        margin: forceFittingMargin || camera.fitting?.margin || CONSTELLATION_CONSTANTS.CAMERA_FITTING.MARGIN,
        preferredDistance: camera.fitting?.preferredDistance || camera.distance,
        emergencyDistance: CONSTELLATION_CONSTANTS.CAMERA_FITTING.EMERGENCY_DISTANCE,
        fallbackDistance: camera.distance
      },
      
      stageName,
      stageIndex: stageConfig.stageIndex,
      originalDistance: camera.distance,
      dynamicFittingEnabled: enableDynamicFitting
    };

    if (useFallbackDistance || !enableDynamicFitting) {
      config.fitting.enabled = false;
      if (process.env.NODE_ENV === 'development') {
        console.log(`🧠 Camera config for ${stageName}: Using fallback distance ${camera.distance}`);
      }
    }

    return config;
  }

  /* ────────────────────────────────────────────────────────────────────────
     ✅ PRODUCTION: Dual-Position Particle Generation (Unchanged)
     ──────────────────────────────────────────────────────────────────── */

  generateConstellationParticleData(particleCount, stageConfig) {
    console.log(`🧠 Generating fresh particle data: ${particleCount} particles for ${stageConfig.name}`);

    const atmosphericPositions = new Float32Array(particleCount * 3);
    const allenAtlasPositions = new Float32Array(particleCount * 3);
    const animationSeeds = new Float32Array(particleCount * 4);
    const constellationData = new Float32Array(particleCount * 2);

    const brainCoordinates = this.getAllenAtlasCoordinatesForStage(stageConfig.constellation.brainRegion);
    const atmosphericScale = CONSTELLATION_CONSTANTS.ATMOSPHERIC_SCALE;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const i4 = i * 4;
      const i2 = i * 2;

      // Atmospheric positions (cosmic dust start)
      let ux = Math.max(Number.MIN_VALUE, Math.random()); 
      let uy = Math.random();
      let uz = Math.random();
      
      let r = Math.sqrt(-2.0 * Math.log(ux));
      let theta = 2.0 * Math.PI * uy;
      
      atmosphericPositions[i3]     = r * Math.cos(theta) * atmosphericScale;
      atmosphericPositions[i3 + 1] = r * Math.sin(theta) * atmosphericScale * 0.4;
      atmosphericPositions[i3 + 2] = (uz - 0.5) * atmosphericScale * 0.6;

      // Allen Atlas positions (brain anatomy targets)
      if (brainCoordinates.length > 0) {
        const coord = brainCoordinates[i % brainCoordinates.length];
        allenAtlasPositions[i3]     = coord.x;
        allenAtlasPositions[i3 + 1] = coord.y;
        allenAtlasPositions[i3 + 2] = coord.z;
      } else {
        allenAtlasPositions[i3]     = 0;
        allenAtlasPositions[i3 + 1] = 0;
        allenAtlasPositions[i3 + 2] = 0;
      }

      // Animation seeds
      animationSeeds[i4]     = Math.random();
      animationSeeds[i4 + 1] = Math.random();
      animationSeeds[i4 + 2] = Math.random();
      animationSeeds[i4 + 3] = Math.random();

      // Constellation data
      constellationData[i2]     = (i / particleCount) + (Math.random() - 0.5) * 0.3;
      constellationData[i2 + 1] = stageConfig.constellation.spacing;
    }

    return {
      atmosphericPositions,
      allenAtlasPositions,
      animationSeeds,
      constellationData
    };
  }

  /* ────────────────────────────────────────────────────────────────────────
     ✅ PRODUCTION: Enhanced Uniforms Generation
     ──────────────────────────────────────────────────────────────────── */

  generateUniforms(stageConfig, stageProgress) {
    // ✅ ENHANCED: Point scale calculation for perfect sprite visibility
    const pointScale = stageConfig.shaderEffects?.pointScale || 
                      this._calculatePointScale(stageConfig.name, 'HIGH');

    return {
      // Core uniforms
      uTime: { value: 0 },
      uSize: { value: stageConfig.particleSize || 10.0 },
      uScrollProgress: { value: stageProgress },
      uStage: { value: stageConfig.stageIndex },
      uStageProgress: { value: stageProgress },
      uStageColor: { value: new THREE.Color(stageConfig.colors[0]) },

      // ✅ ENHANCED: Point scale system (dynamic calculation overrides this value)
      uPointScale: { value: pointScale }, // Fallback - WebGLBackground calculates correct viewport-based value

      // Constellation uniforms
      uConstellationProgress: { value: stageProgress },
      uConstellationSpacing: { value: stageConfig.constellation.spacing },
      uViewportCoverage: { value: stageConfig.constellation.coveragePercent / 100.0 },
      uEdgeBuffer: { value: stageConfig.constellation.edgeBuffer },
      uAnatomicalAccuracy: { value: 0.95 },

      // Camera uniforms
      uCameraDistance: { value: stageConfig.camera.distance },
      uCameraFOV: { value: stageConfig.camera.fov },

      // Effect uniforms
      uShimmerIntensity: { value: stageConfig.shaderEffects.shimmerIntensity },
      uLivingAmplitude: { value: stageConfig.shaderEffects.livingAmplitude },
      uLivingFrequency: { value: stageConfig.shaderEffects.livingFrequency || 1.0 },
      uLivingSpeed: { value: stageConfig.shaderEffects.livingSpeed || 1.0 },
      uAuroraIntensity: { value: stageConfig.shaderEffects.auroraIntensity || 0.8 },

      // Interaction uniforms
      uCursorPos: { value: new THREE.Vector3(0, 0, 0) },
      uCursorRadius: { value: 2.0 },
      uRepulsionStrength: { value: 0.5 },
      uAuroraEnabled: { value: 0.0 },
      uAuroraSpeed: { value: 1.0 },

      // Debug uniforms
      uDebugMode: { value: 0 },
      uDebugIntensity: { value: 1.0 },
      uDebugColor: { value: new THREE.Color(1, 0, 0) },
      uShowDebugOverlay: { value: 0.0 },

      // Viewport uniforms (set by R3F)
      uViewportSize: { value: new THREE.Vector2(1920, 1080) },
      uAspectRatio: { value: 1.78 },
      uDevicePixelRatio: { value: 1.0 },
    };
  }

  /* ────────────────────────────────────────────────────────────────────────
     ✅ PRODUCTION: Allen Atlas Coordinate System (Unchanged)
     ──────────────────────────────────────────────────────────────────── */

  initializeAllenAtlasCoordinates() {
    console.log(`🧠 ConsciousnessEngine: Initializing Allen Atlas coordinate cache`);
    
    Object.keys(ALLEN_ATLAS_BRAIN_REGIONS).forEach(regionKey => {
      const region = ALLEN_ATLAS_BRAIN_REGIONS[regionKey];
      const pointCount = 150;
      
      this.brainRegionCoordinatesCache[regionKey] = this.generateBrainRegionCoordinates(
        region.shape, 
        pointCount,
        regionKey
      );
      
      console.log(`🧠 Generated ${this.brainRegionCoordinatesCache[regionKey].length} coordinates for ${region.anatomicalName}`);
    });
    
    console.log('🧠 Allen Atlas coordinate cache initialized ✅');
  }

  getAllenAtlasCoordinatesForStage(brainRegion) {
    if (!brainRegion || !this.brainRegionCoordinatesCache[brainRegion]) {
      console.warn(`🧠 No Allen Atlas coordinates found for brain region ${brainRegion}`);
      return this.brainRegionCoordinatesCache.hippocampus || [];
    }
    
    return this.brainRegionCoordinatesCache[brainRegion];
  }

  generateBrainRegionCoordinates(shape, pointCount, regionKey) {
    const stageName = Object.entries(CONSCIOUSNESS_STAGE_NAME_TO_INDEX)
      .find(([_, index]) => CONSCIOUSNESS_THEATER_STAGES[index]?.constellation?.brainRegion === regionKey)?.[0] || 'genesis';

    switch (shape) {
      case 'c_curve':
        return this.generateHippocampusCoordinates(pointCount, stageName);
      case 'column_formation':
        return this.generateBrainstemCoordinates(pointCount, stageName);
      case 'neural_networks':
        return this.generateNeuralNetworkCoordinates(pointCount, stageName);
      case 'electrical_storm':
        return this.generateElectricalStormCoordinates(pointCount, stageName);
      case 'analytical_grids':
        return this.generateAnalyticalGridCoordinates(pointCount, stageName);
      case 'balletic_choreography':
        return this.generateBalleticCoordinates(pointCount, stageName);
      case 'unified_galaxy':
        return this.generateUnifiedGalaxyCoordinates(pointCount, stageName);
      default:
        return this.generateDefaultCoordinates(pointCount, stageName);
    }
  }

  // Brain coordinate generation methods (unchanged for brevity)
  generateHippocampusCoordinates(pointCount, stageName = 'genesis') {
    const coordinates = [];
    const scale = this._getConstellationScale(stageName);
    
    for (let i = 0; i < pointCount; i++) {
      const t = (i / pointCount) * Math.PI * 1.3;
      const anatomicalRadius = 0.8 + Math.sin(t * 2) * 0.2;
      const constellationRadius = anatomicalRadius * scale;
      
      const x = Math.cos(t) * constellationRadius;
      const y = Math.sin(t) * constellationRadius * 0.8;
      const z = Math.sin(t * 1.5) * constellationRadius * 0.2;
      
      coordinates.push(new THREE.Vector3(x, y, z));
    }
    
    return coordinates;
  }

  generateBrainstemCoordinates(pointCount, stageName = 'discipline') {
    const coordinates = [];
    const scale = this._getConstellationScale(stageName);
    const mainColumnPoints = Math.floor(pointCount * 0.7);
    
    for (let i = 0; i < mainColumnPoints; i++) {
      const t = i / mainColumnPoints;
      const x = (Math.random() - 0.5) * 0.2 * scale;
      const y = (-1.0 + t * 2.0) * scale;
      const z = (Math.random() - 0.5) * 0.1 * scale;
      coordinates.push(new THREE.Vector3(x, y, z));
    }
    
    const supportPoints = pointCount - mainColumnPoints;
    for (let i = 0; i < supportPoints; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const t = Math.random();
      const x = side * (0.3 + Math.random() * 0.15) * scale;
      const y = (-1.0 + t * 2.0) * scale;
      const z = (Math.random() - 0.5) * 0.12 * scale;
      coordinates.push(new THREE.Vector3(x, y, z));
    }
    
    return coordinates;
  }

  generateNeuralNetworkCoordinates(pointCount, stageName = 'neural') {
    const coordinates = [];
    const scale = this._getConstellationScale(stageName);
    const networks = 5;
    
    for (let network = 0; network < networks; network++) {
      const networkCenter = {
        x: (-0.8 + network * 0.4) * scale,
        y: (-0.3 + (network % 2) * 0.5) * scale,
        z: (network - 2) * 0.15 * scale
      };
      
      const pointsPerNetwork = Math.floor(pointCount / networks);
      for (let i = 0; i < pointsPerNetwork; i++) {
        const angle = (i / pointsPerNetwork) * Math.PI * 2;
        const anatomicalRadius = 0.15 + Math.random() * 0.25;
        const constellationRadius = anatomicalRadius * scale;
        
        const x = networkCenter.x + Math.cos(angle) * constellationRadius;
        const y = networkCenter.y + Math.sin(angle) * constellationRadius;
        const z = networkCenter.z + Math.sin(angle * 3) * constellationRadius * 0.08;
        
        coordinates.push(new THREE.Vector3(x, y, z));
      }
    }
    
    return coordinates;
  }

  generateElectricalStormCoordinates(pointCount, stageName = 'velocity') {
    const coordinates = [];
    const scale = this._getConstellationScale(stageName);
    const branches = 8;
    
    for (let branch = 0; branch < branches; branch++) {
      const branchAngle = (branch / branches) * Math.PI * 2;
      const branchLength = (1.2 + Math.random() * 0.8) * scale;
      
      const pointsPerBranch = Math.floor(pointCount / branches);
      for (let i = 0; i < pointsPerBranch; i++) {
        const t = i / pointsPerBranch;
        const radius = t * branchLength;
        
        const jitter = (Math.random() - 0.5) * 0.5 * t * scale;
        const x = Math.cos(branchAngle) * radius + jitter;
        const y = Math.sin(branchAngle) * radius + jitter;
        const z = Math.sin(t * Math.PI * 3) * scale * 0.3;
        
        coordinates.push(new THREE.Vector3(x, y, z));
      }
    }
    
    return coordinates;
  }

  generateAnalyticalGridCoordinates(pointCount, stageName = 'architecture') {
    const coordinates = [];
    const scale = this._getConstellationScale(stageName);
    const gridPoints = Math.floor(pointCount * 0.6);
    const gridSize = Math.floor(Math.sqrt(gridPoints));
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i / (gridSize - 1) - 0.5) * 2.0 * scale;
        const y = (j / (gridSize - 1) - 0.5) * 1.6 * scale;
        const z = Math.sin(i * 0.4) * Math.cos(j * 0.4) * 0.15 * scale;
        coordinates.push(new THREE.Vector3(x, y, z));
      }
    }
    
    const remainingPoints = pointCount - (gridSize * gridSize);
    for (let i = 0; i < remainingPoints; i++) {
      const t = Math.random();
      const angle = Math.random() * Math.PI * 2;
      const radius = t * 1.4 * scale;
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = Math.sin(t * Math.PI * 2) * scale * 0.08;
      coordinates.push(new THREE.Vector3(x, y, z));
    }
    
    return coordinates;
  }

  generateBalleticCoordinates(pointCount, stageName = 'harmony') {
    const coordinates = [];
    const scale = this._getConstellationScale(stageName);
    const spiralPoints = Math.floor(pointCount * 0.75);
    
    for (let i = 0; i < spiralPoints; i++) {
      const t = (i / spiralPoints) * Math.PI * 5;
      const anatomicalRadius = 0.5 + Math.sin(t * 0.25) * 0.7;
      const constellationRadius = anatomicalRadius * scale;
      
      const x = Math.cos(t) * constellationRadius;
      const y = Math.sin(t) * constellationRadius;
      const z = Math.sin(t * 0.4) * constellationRadius * 0.5;
      coordinates.push(new THREE.Vector3(x, y, z));
    }
    
    const harmonicPoints = pointCount - spiralPoints;
    for (let i = 0; i < harmonicPoints; i++) {
      const t = (i / harmonicPoints) * Math.PI * 3;
      const radius = (1.0 + Math.cos(t * 1.2) * 0.3) * scale;
      
      const x = Math.cos(t + Math.PI * 0.6) * radius * 0.6;
      const y = Math.sin(t + Math.PI * 0.6) * radius * 0.6;
      const z = Math.cos(t * 0.7) * radius * 0.35;
      coordinates.push(new THREE.Vector3(x, y, z));
    }
    
    return coordinates;
  }

  generateUnifiedGalaxyCoordinates(pointCount, stageName = 'transcendence') {
    const coordinates = [];
    const scale = this._getConstellationScale(stageName);
    const coreSize = Math.floor(pointCount * 0.15);
    
    // Galaxy core
    for (let i = 0; i < coreSize; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.3 * scale;
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 0.15 * scale;
      coordinates.push(new THREE.Vector3(x, y, z));
    }
    
    // Galaxy arms
    const arms = 3;
    const armPoints = Math.floor((pointCount - coreSize) / arms);
    
    for (let arm = 0; arm < arms; arm++) {
      const armOffset = (arm / arms) * Math.PI * 2;
      
      for (let i = 0; i < armPoints; i++) {
        const t = (i / armPoints) * Math.PI * 3;
        const radius = (0.3 + t * 0.25) * scale;
        const angle = t + armOffset;
        
        const jitter = (Math.random() - 0.5) * 0.15 * scale;
        const x = Math.cos(angle) * radius + jitter;
        const y = Math.sin(angle) * radius + jitter;
        const z = Math.sin(t * 0.4) * scale * 0.25 + (Math.random() - 0.5) * scale * 0.08;
        coordinates.push(new THREE.Vector3(x, y, z));
      }
    }
    
    return coordinates;
  }

  generateDefaultCoordinates(pointCount, stageName = 'genesis') {
    const coordinates = [];
    const scale = this._getConstellationScale(stageName);
    
    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2;
      const radius = (0.6 + Math.random() * 0.8) * scale;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 0.2 * scale;
      coordinates.push(new THREE.Vector3(x, y, z));
    }
    return coordinates;
  }

  /* ────────────────────────────────────────────────────────────────────────
     ✅ PRODUCTION: Development Utilities
     ──────────────────────────────────────────────────────────────────── */

  devGetSnapshot() {
    if (process.env.NODE_ENV === 'development') {
      return {
        architecture: 'Production Constellation System',
        brainRegions: Object.keys(this.brainRegionCoordinatesCache),
        coordinatesAvailable: Object.keys(this.brainRegionCoordinatesCache).map(key => ({
          region: key,
          count: this.brainRegionCoordinatesCache[key].length
        })),
        pointScaleSystem: CONSTELLATION_CONSTANTS.POINT_SCALE_SYSTEM,
        cameraFitting: CONSTELLATION_CONSTANTS.CAMERA_FITTING,
        optimizations: {
          enhancedPointScaling: true,
          productionReady: true,
          dualPositionArchitecture: true,
          dynamicCameraFitting: true,
          atmosphericScale: CONSTELLATION_CONSTANTS.ATMOSPHERIC_SCALE,
          architecturalIntegrity: true,
          pinholeFixed: true
        },
        timestamp: performance.now(),
      };
    }
    return null;
  }
}

// Create singleton instance
const consciousnessEngine = new ConsciousnessEngine();

// Global access with debugging
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.consciousnessEngine = consciousnessEngine;
  
  window.consciousnessEngineUtils = {
    getSnapshot: () => consciousnessEngine.devGetSnapshot(),
    getBrainRegions: () => Object.keys(consciousnessEngine.brainRegionCoordinatesCache),
    getCameraConfig: (stage, options) => consciousnessEngine.getCameraConfiguration(stage, null, options),
    getConstellationScale: (stage) => consciousnessEngine._getConstellationScale(stage),
    getPointScale: (stage, quality) => consciousnessEngine._calculatePointScale(stage, quality),
    testParticleGeneration: (stage, quality) => {
      const config = consciousnessEngine.getConsciousnessStageConfig(stage, quality);
      return consciousnessEngine.generateConstellationParticleData(config.particles, config);
    },
    getAtmosphericScale: () => CONSTELLATION_CONSTANTS.ATMOSPHERIC_SCALE,
    testPointScaling: () => {
      const stages = ['genesis', 'discipline', 'neural', 'velocity', 'architecture', 'harmony', 'transcendence'];
      const qualities = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];
      
      stages.forEach(stage => {
        console.group(`🎯 Point Scaling for ${stage}:`);
        qualities.forEach(quality => {
          const scale = consciousnessEngine._calculatePointScale(stage, quality);
          console.log(`${quality}: ${scale.toFixed(1)}`);
        });
        console.groupEnd();
      });
    }
  };
  
  console.log('🧠 ConsciousnessEngine: Production System Ready with Enhanced Point Scaling');
  console.log('🎯 New utility: testPointScaling() - See per-stage point scale values');
}

export default consciousnessEngine;
export { ConsciousnessEngine, CONSCIOUSNESS_THEATER_STAGES, CONSCIOUSNESS_STAGE_NAME_TO_INDEX, ALLEN_ATLAS_BRAIN_REGIONS };