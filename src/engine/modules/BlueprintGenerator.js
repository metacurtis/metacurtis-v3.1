import { VC } from '@/config/visual-controls.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import SST from '@/config/sst-loader.js';
import { createSeededRandom } from '../../utils/random.js';
import {
  calculateBounds,
  gaussianRandom,
  createBlueprintStructure,
  assignTiersShuffled,
  fitToViewXY,
  safeClone,
  distributeParticles,
  makeBandFrame,
} from '../utils/blueprintUtils.js';
import {
  generatePortraitPositions,
  generateQRPositions,
  generateScatterPositions,
} from '@/utils/portraitPositions.js';
import { buildHotspotLookup } from '@/utils/hotspotMapping.js';

export default class BlueprintGenerator {
  constructor(engine) {
    this.engine = engine;
  }

  async buildStage(stageName, requestedQuality, options = {}) {
    const engine = this.engine;
    const stageConfig = Canonical?.stages?.[stageName] || {};
    if (!stageConfig) {
      console.error(`Stage ${stageName} not found`);
      return null;
    }

    console.log('🔬 [BLUEPRINT] Starting position generation for stage:', stageName);
    console.log('🔬 [BLUEPRINT] Input SST data:', {
      particlesBase: SST?.stages?.[stageName]?.particlesBase,
      hasLetterGeometry: !!SST?.visual?.letterGeometry?.[stageName],
    });

    const stageParticleCounts = SST?.performance?.particleCount ?? {};
    const quality = requestedQuality || options.quality || engine.currentQuality;
    const baseParticleCount = stageConfig.particleCount || stageParticleCounts[stageName] || 5000;
    const particleCount =
      options.overrideCount || engine.getParticleCountForQuality(baseParticleCount, quality);

    console.log(`🧠 Building ${stageName}: ${particleCount} particles`);

    const fallbackWord = SST?.visual?.stageWords?.[stageName];
    const typographyDef = Canonical?.visual?.letterGeometry?.[stageName] || {};
    const typography = {
      word:
        (typeof typographyDef.word === 'string' && typographyDef.word) ||
        (typeof fallbackWord === 'string' && fallbackWord) ||
        stageName.toUpperCase(),
      font: typographyDef.font || null,
      depth: Number(typographyDef.depth) || 0.3,
      spacing: Number(typographyDef.spacing) || 1,
      scale: Number(typographyDef.scale) || 1,
      particlesPerLetter: Number(typographyDef.particlesPerLetter) || null,
    };

    if (typography.font && typeof engine._ensureFontForStage === 'function') {
      engine._ensureFontForStage(stageName, typography.font);
    }

    const glyphLetterCount = typography.word.replace(/\s+/g, '').length || typography.word.length || 1;
    const desiredTextParticles = typography.particlesPerLetter
      ? Math.min(
          particleCount,
          Math.max(1, Math.round(typography.particlesPerLetter * glyphLetterCount))
        )
      : Math.min(particleCount, Math.max(1, Math.round(particleCount * 0.55)));

    const tierMix =
      Array.isArray(stageConfig?.tierMix) && stageConfig.tierMix.length === 4
        ? stageConfig.tierMix.slice(0, 4)
        : Array.isArray(VC?.TIER_RATIOS)
        ? VC.TIER_RATIOS.slice(0, 4)
        : [0.7, 0.12, 0.13, 0.05];
    const tierCounts = distributeParticles(particleCount, tierMix);
    const tierAssignments = new Array(particleCount);
    let tierCursor = 0;
    for (let tier = 0; tier < tierCounts.length; tier++) {
      const count = tierCounts[tier];
      for (let n = 0; n < count && tierCursor < particleCount; n += 1, tierCursor += 1) {
        tierAssignments[tierCursor] = tier;
      }
    }
    while (tierCursor < particleCount) {
      tierAssignments[tierCursor++] = tierCounts.length - 1;
    }
    const tierShuffleRandom = createSeededRandom(`${stageName}|tierShuffle`);
    for (let i = tierAssignments.length - 1; i > 0; i--) {
      const swapIndex = Math.floor(tierShuffleRandom() * (i + 1));
      [tierAssignments[i], tierAssignments[swapIndex]] = [tierAssignments[swapIndex], tierAssignments[i]];
    }

    const blueprint = createBlueprintStructure(particleCount, {
      stageName,
      mode: stageConfig?.mode ?? null,
      quality,
      metadata: null,
    });
    const {
      positions,
      atmosphericPositions,
      text3DPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      tierOf,
    } = blueprint;

    const rng = createSeededRandom(`${stageName}|scatter`);
    const tierSpread = [
      { x: 120, y: 90, z: 40 },
      { x: 95, y: 70, z: 32 },
      { x: 72, y: 56, z: 28 },
      { x: 48, y: 38, z: 22 },
    ];
    const sizeBase = [0.55, 0.75, 1.05, 1.35];
    const opacityRanges = [
      [0.32, 0.6],
      [0.45, 0.78],
      [0.6, 0.9],
      [0.7, 1.0],
    ];

    for (let i = 0; i < particleCount; i += 1) {
      const tier = tierAssignments[i];
      const spread = tierSpread[tier] || tierSpread[0];
      const baseIndex = i * 3;

      const ax = (rng() - 0.5) * spread.x;
      const ay = (rng() - 0.5) * spread.y;
      const az = (rng() - 0.5) * spread.z;

      atmosphericPositions[baseIndex] = ax;
      atmosphericPositions[baseIndex + 1] = ay;
      atmosphericPositions[baseIndex + 2] = az;

      positions[baseIndex] = ax;
      positions[baseIndex + 1] = ay;
      positions[baseIndex + 2] = az;

      text3DPositions[baseIndex] = ax;
      text3DPositions[baseIndex + 1] = ay;
      text3DPositions[baseIndex + 2] = az;

      animationSeeds[baseIndex] = rng();
      animationSeeds[baseIndex + 1] = rng();
      animationSeeds[baseIndex + 2] = rng();

      const sizeScalar = sizeBase[tier] || sizeBase[0];
      sizeMultipliers[i] = sizeScalar * (0.85 + rng() * 0.3);

      const [opacityMin, opacityMax] = opacityRanges[tier] || opacityRanges[0];
      opacityData[i] = opacityMin + rng() * (opacityMax - opacityMin);

      atlasIndices[i] = Math.min(15, Math.floor(rng() * 4) + tier * 4);
      tierData[i] = tier;
    }

    const textFormation =
      typeof engine.generate3DTextFormation === 'function'
        ? engine.generate3DTextFormation(typography.word, {
            particles: desiredTextParticles,
            depth: typography.depth,
            letterSpacing: typography.spacing,
            scale: typography.scale,
            fontKey: typography.font,
            stage: stageName,
            viewportHint: engine._viewportHint,
          })
        : null;

    let assignedTextParticles = 0;
    if (textFormation && textFormation.length >= 3) {
      const textSelectRandom = createSeededRandom(`${stageName}|textSelect`);
      const assignableCount = Math.min(desiredTextParticles, Math.floor(textFormation.length / 3));
      const selectedIndices = pickTextParticleIndices(tierAssignments, assignableCount, textSelectRandom);

      assignedTextParticles = selectedIndices.length;
      for (let idx = 0; idx < selectedIndices.length; idx += 1) {
        const particleIndex = selectedIndices[idx];
        const src = idx * 3;
        if (src + 2 >= textFormation.length) break;
        const baseIndex = particleIndex * 3;
        text3DPositions[baseIndex] = textFormation[src];
        text3DPositions[baseIndex + 1] = textFormation[src + 1];
        text3DPositions[baseIndex + 2] = textFormation[src + 2];
      }
    }

    const expectedArrayLength = particleCount * 3;

    const atmosphericRatio = 0.3;
    const atmosphericCount = Math.floor(particleCount * atmosphericRatio);
    const atmosphericRandom = createSeededRandom(`${stageName}|atmosphereHalo`);
    atmosphericPositions.fill(0);
    for (let i = 0; i < atmosphericCount; i += 1) {
      const idx = i * 3;
      const radius = 5 + atmosphericRandom() * 3;
      const theta = atmosphericRandom() * Math.PI * 2;
      const phi = atmosphericRandom() * Math.PI;
      atmosphericPositions[idx] = radius * Math.sin(phi) * Math.cos(theta);
      atmosphericPositions[idx + 1] = radius * Math.sin(phi) * Math.sin(theta);
      atmosphericPositions[idx + 2] = radius * Math.cos(phi);
    }

    console.log('✅ [ATMOSPHERIC] Generated positions:', {
      stage: stageName,
      totalSlots: expectedArrayLength / 3,
      populated: atmosphericCount,
      ratio: atmosphericRatio,
    });

    const letterGeometryConfig = SST?.visual?.letterGeometry?.[stageName];
    const placeholderWord =
      (typeof letterGeometryConfig?.word === 'string' && letterGeometryConfig.word.trim()) ||
      typography.word ||
      stageName.toUpperCase();

    const textPlaceholderRandom = createSeededRandom(`${stageName}|text3dPlaceholder`);
    if (!textFormation || assignedTextParticles === 0) {
      const trimmedWord = placeholderWord.trim();
      const letterCount = trimmedWord.replace(/\s/g, '').length || 1;
      const particlesPerLetter = Math.max(1, Math.floor(particleCount / letterCount));
      text3DPositions.fill(0);
      let particleIdx = 0;
      for (let letterIdx = 0; letterIdx < trimmedWord.length && particleIdx < particleCount; letterIdx += 1) {
        const char = trimmedWord[letterIdx];
        if (char === ' ') continue;
        const xOffset = (letterIdx - trimmedWord.length / 2) * 1.2;
        for (let p = 0; p < particlesPerLetter && particleIdx < particleCount; p += 1, particleIdx += 1) {
          const baseIndex = particleIdx * 3;
          text3DPositions[baseIndex] = xOffset + (textPlaceholderRandom() - 0.5) * 0.8;
          text3DPositions[baseIndex + 1] = (textPlaceholderRandom() - 0.5) * 1.0;
          text3DPositions[baseIndex + 2] = (textPlaceholderRandom() - 0.5) * 0.3;
        }
      }

      console.log('✅ [TYPOGRAPHY] Placeholder generated:', {
        stage: stageName,
        word: trimmedWord,
        letterCount,
        particlesPerLetter,
        particlesUsed: Math.min(particleCount, letterCount * particlesPerLetter),
      });
    } else {
      console.log('📝 [TYPOGRAPHY] Using generated text formation', {
        stage: stageName,
        assignedTextParticles,
        totalParticles: particleCount,
      });
    }

    const metadata = {
      quality,
      buildTime: performance.now(),
      stage: stageName,
      tierMix,
      tierCounts,
      motionBehaviors: safeClone(stageConfig.motionBehaviors) || null,
      typography: {
        ...typography,
        assignedTextParticles,
      },
      camera: {
        stage: safeClone(stageConfig.camera) || null,
        visual: safeClone(Canonical?.visual?.camera?.[stageName]) || null,
      },
    };
    const genesisPalette =
      stageName === 'genesis' &&
      Array.isArray(VC?.GENESIS_PALETTE) &&
      VC.GENESIS_PALETTE.length >= 3
        ? VC.GENESIS_PALETTE.slice(0, 3)
        : null;
    if (genesisPalette) {
      metadata.colors = genesisPalette;
    } else if (Array.isArray(stageConfig?.colors) && stageConfig.colors.length >= 3) {
      metadata.colors = stageConfig.colors.slice(0, 3);
    }

    const viewportHint = engine._viewportHint || { width: 120, height: 90 };
    const vw = (viewportHint.width ?? 120) * 0.5;
    const vh = (viewportHint.height ?? 90) * 0.5;
    const fitDefault = Number.isFinite(VC?.FIT_FRAC) ? VC.FIT_FRAC : 0.92;
    const fitTarget = {
      x: Number.isFinite(VC?.FIT_FRAC_X) ? VC.FIT_FRAC_X : 0.9,
      y: Number.isFinite(VC?.FIT_FRAC_Y) ? VC.FIT_FRAC_Y : 0.8,
      default: fitDefault,
    };
    fitToViewXY(text3DPositions, vw, vh, fitTarget);
    fitToViewXY(atmosphericPositions, vw, vh, fitTarget);
    fitToViewXY(positions, vw, vh, fitTarget);

    if (import.meta?.env?.DEV) {
      const aabbExtents = (arr) => {
        const bounds = calculateBounds(arr);
        if (!bounds) return { w: 0, h: 0 };
        return {
          w: +bounds.size.x.toFixed(2),
          h: +bounds.size.y.toFixed(2),
        };
      };
      console.debug(
        '[CE] AABB stage build',
        stageName,
        { text: aabbExtents(text3DPositions) },
        { atm: aabbExtents(atmosphericPositions) },
        { vw: +vw.toFixed(2), vh: +vh.toFixed(2) },
      );
    }

    console.log('🔬 [BLUEPRINT] Position array result:', {
      type: positions?.constructor?.name,
      length: positions?.length,
      sample: positions ? Array.from(positions.slice(0, 6)) : 'UNDEFINED',
      isFloat32Array: positions instanceof Float32Array,
    });

    blueprint.stageName = stageName;
    blueprint.particleCount = particleCount;
    blueprint.maxParticles = particleCount;
    blueprint.activeCount = particleCount;

    if (tierOf?.length === tierAssignments.length) {
      for (let i = 0; i < tierAssignments.length; i += 1) {
        tierOf[i] = tierAssignments[i];
      }
    }

    blueprint.atmosphericPositions = atmosphericPositions;
    blueprint.text3DPositions = text3DPositions;
    blueprint.text3DPosition = text3DPositions;

    console.log('🔬 [BLUEPRINT ARRAYS ADDED]', {
      stage: stageName,
      timing: 'BEFORE_RETURN',
      hasAtmospheric: !!blueprint.atmosphericPositions,
      atmosphericLength: blueprint.atmosphericPositions?.length,
      hasText3D: !!blueprint.text3DPosition,
      text3DLength: blueprint.text3DPosition?.length,
      stackTrace: (() => {
        const stack = new Error().stack;
        if (!stack) return 'n/a';
        const lines = stack.split('\n');
        return lines[1] || stack;
      })(),
    });

    console.log('🔬 [BLUEPRINT PRE-VALIDATION]', {
      stage: stageName,
      particleCount: blueprint.particleCount,
      hasPositions: !!blueprint.positions,
      positionsLength: blueprint.positions?.length,
      hasAtmospheric: !!blueprint.atmosphericPositions,
      atmosphericLength: blueprint.atmosphericPositions?.length,
      hasText3D: !!blueprint.text3DPosition,
      text3DLength: blueprint.text3DPosition?.length,
      expectedArrayLength,
    });

    console.log('✅ [BLUEPRINT COMPLETE]', {
      stage: stageName,
      particleCount: blueprint.particleCount,
      arraysGenerated: {
        positions: blueprint.positions?.length ?? 0,
        atmosphericPositions: blueprint.atmosphericPositions?.length ?? 0,
        text3DPosition: blueprint.text3DPosition?.length ?? 0,
      },
      allExpectedLength: expectedArrayLength,
    });

    blueprint.metadata = metadata;

    try {
      const hotspotLookup = buildHotspotLookup({
        stageName,
        text3DPositions,
      });
      blueprint.hotspotLookup = hotspotLookup;
      blueprint.hotspotMap = hotspotLookup?.indicesByHotspot || {};
      const hotspotIds = Object.keys(blueprint.hotspotMap || {});
      if (hotspotIds.length > 0) {
        console.log(`🗺 Blueprint for ${stageName}: hotspot map attached`, hotspotIds);
      }
    } catch (error) {
      console.error(`[Engine] Hotspot mapping failed for ${stageName}:`, error);
      blueprint.hotspotLookup = null;
      blueprint.hotspotMap = {};
    }

    return blueprint;
  }

  generateConstellationFormation(N, tierRatios = VC?.TIER_RATIOS ?? [0.5, 0.2, 0.15, 0.15], hint, opts = {}) {
    const engine = this.engine;
    const out = new Float32Array(N * 3);
    const rnd = createSeededRandom('starfield');
    const tc0 = Math.floor(N * tierRatios[0]);
    const tc1 = Math.floor(N * tierRatios[1]);
    const tc2 = Math.floor(N * tierRatios[2]);
    const tc3 = N - (tc0 + tc1 + tc2);

    const viewportHint = hint || engine._viewportHint || { width: 120, height: 90 };
    const vw = (viewportHint.width ?? 120) * 0.5;
    const vh = (viewportHint.height ?? 90) * 0.5;
    const R = (VC?.STARFIELD_SCALE ?? 0.95) * vw;
    const gauss = () => gaussianRandom({ rand: rnd, clamp: 1.2 });
    const sampleEllipse = (rx, ry) => {
      const gx = gauss() * rx;
      const gy = gauss() * ry;
      return [gx, gy];
    };
    const clampToCaps = opts.clampToViewCaps !== false;
    const bandEnabled = opts.band ?? (VC?.BAND_ENABLED ?? true);
    const band = bandEnabled ? makeBandFrame(VC, rnd, gauss) : null;
    const bandHeight = Math.max(1, R * (VC?.BAND_FADE_WIDTH ?? 0.35));
    const t0BandShare = Math.min(1, Math.max(0, VC?.T0_BAND_P ?? 0.3));
    const scatterWidth = vw * 2.2;
    const scatterHeight = vh * 2.2;
    const t0BaseZ = VC.T0_Z_JITTER ?? 4;
    const t0ScatterZ = t0BaseZ * 1.5;

    const t2Total = tc2;
    const desiredCoreSeeds = Math.max(12, Math.floor(N * 0.04));
    const t2CoreSeeds = Math.min(t2Total, Math.min(120, desiredCoreSeeds));
    const t2ClusterCount = Math.max(0, t2Total - t2CoreSeeds);

    let k = 0;
    const emit = (x, y, z) => {
      const j = 3 * k++;
      out[j] = x;
      out[j + 1] = y;
      out[j + 2] = z;
    };

    const t0BandCount = bandEnabled ? Math.floor(tc0 * t0BandShare) : 0;
    const t0ScatterCount = tc0 - t0BandCount;
    for (let i = 0; i < t0BandCount; i++) {
      const [bx, by] = band?.sampleBand(1.2, R, bandHeight * 0.9) ?? sampleEllipse(R, bandHeight * 0.9);
      emit(bx, by, gauss() * t0BaseZ);
    }
    for (let i = 0; i < t0ScatterCount; i++) {
      const x = (rnd() - 0.5) * scatterWidth;
      const y = (rnd() - 0.5) * scatterHeight;
      emit(x, y, gauss() * t0ScatterZ);
    }

    for (let i = 0; i < tc1; i++) {
      const useBand = bandEnabled && band && rnd() < (VC?.BAND_T1_P ?? 0.85);
      const [x, y] = useBand
        ? band.sampleBand(0.8, R * 0.55, bandHeight * 0.4)
        : sampleEllipse(R * 0.55, bandHeight * 0.4);
      emit(x, y, (rnd() - 0.5) * (VC.T1_Z_JITTER ?? 3));
    }

    const cCount = Math.max(1, VC.T2_CLUSTER_COUNT ?? 3);
    const cSigma = Math.max(1e-3, (VC.T2_CLUSTER_SIGMA ?? 0.04) * R);
    const clusters = Array.from({ length: cCount }, () => {
      if (bandEnabled && band && rnd() < (VC?.BAND_T2_P ?? 0.95)) {
        const [bx, by] = band.sampleBand(0.5, R * 0.3, bandHeight * 0.18);
        return { cx: bx, cy: by };
      }
      const [cx, cy] = sampleEllipse(R * 0.3, bandHeight * 0.18);
      return { cx, cy };
    });

    for (let i = 0; i < t2CoreSeeds; i++) {
      const radius = Math.abs(gauss()) * R * 0.08;
      const angle = rnd() * Math.PI * 2;
      const coreX = Math.cos(angle) * radius * 0.85;
      const coreY = Math.sin(angle) * radius * 0.35;
      emit(coreX, coreY, gauss() * 0.5);
    }

    for (let i = 0; i < t2ClusterCount; i++) {
      const c = clusters[Math.floor(rnd() * clusters.length)];
      const x = c.cx + gauss() * cSigma * 0.5;
      const y = c.cy + gauss() * cSigma * 0.35;
      emit(x, y, (rnd() - 0.5) * (VC.T2_Z_JITTER ?? 2));
    }

    if (tc3 > 0 && (VC.USE_T3_TEXT ?? true) && engine.font) {
      const tierWord =
        typeof VC?.T3_TEXT === 'string' && VC.T3_TEXT.trim()
          ? VC.T3_TEXT.trim()
          : Canonical?.visual?.letterGeometry?.genesis?.word || 'GENESIS';
      const pts =
        typeof engine.generate3DTextFormation === 'function'
          ? engine.generate3DTextFormation(tierWord, { particles: tc3 })
          : null;
      const bounds = calculateBounds(pts);
      const width = bounds ? bounds.size.x : 0;
      const height = bounds ? bounds.size.y : 0;
      const sx = (VC.T3_TEXT_SCALE ?? 0.7) * (R * 0.4) / Math.max(1, width * 0.5);
      const sy = (VC.T3_TEXT_SCALE ?? 0.7) * (bandHeight * 0.35) / Math.max(1, height * 0.5);
      for (let i = 0; i < tc3; i++) {
        const s = (i % (pts.length / 3)) * 3;
        const x = pts[s] * sx;
        const y = pts[s + 1] * sy;
        emit(x, y, (rnd() - 0.5) * (VC.T3_Z_JITTER ?? 0.5));
      }
    } else {
      for (let i = 0; i < tc3; i++) {
        const [x, y] = bandEnabled && band
          ? band.sampleBand(0.45, R * 0.16, bandHeight * 0.16)
          : sampleEllipse(R * 0.16, bandHeight * 0.16);
        emit(x, y, (rnd() - 0.5) * (VC.T3_Z_JITTER ?? 0.5));
      }
    }

    let cx = 0;
    let cy = 0;
    const n = out.length / 3 || 1;
    for (let i = 0; i < out.length; i += 3) {
      cx += out[i];
      cy += out[i + 1];
    }
    cx /= n;
    cy /= n;
    if (cx || cy) {
      for (let i = 0; i < out.length; i += 3) {
        out[i] -= cx;
        out[i + 1] -= cy;
      }
    }

    const fitFrac = VC?.FIT_FRAC ?? 0.92;
    if (fitFrac > 0) {
      const vwFit = (viewportHint.width ?? 120) * 0.5;
      const vhFit = (viewportHint.height ?? 90) * 0.5;
      const rxLimit = clampToCaps && Number.isFinite(VC.VIEW_CAP_HALF_W)
        ? Math.min(vwFit, VC.VIEW_CAP_HALF_W)
        : vwFit;
      const ryLimit = clampToCaps && Number.isFinite(VC.VIEW_CAP_HALF_H)
        ? Math.min(vhFit, VC.VIEW_CAP_HALF_H)
        : vhFit;
      const rxFit = rxLimit * fitFrac;
      const ryFit = ryLimit * fitFrac;
      let maxDX = 0;
      let maxDY = 0;
      for (let i = 0; i < out.length; i += 3) {
        const ax = Math.abs(out[i]);
        const ay = Math.abs(out[i + 1]);
        if (ax > maxDX) maxDX = ax;
        if (ay > maxDY) maxDY = ay;
      }
      const sx = maxDX ? rxFit / maxDX : 1;
      const sy = maxDY ? ryFit / maxDY : 1;
      const scale = Math.min(sx, sy);
      if (scale > 0 && scale !== 1) {
        for (let i = 0; i < out.length; i += 3) {
          out[i] *= scale;
          out[i + 1] *= scale;
        }
      }
    }

    return out;
  }
}

function pickTextParticleIndices(tiers, count, rng) {
  if (!Array.isArray(tiers) || count <= 0) return [];
  const entries = tiers.map((tier, index) => ({
    tier,
    index,
    jitter: typeof rng === 'function' ? rng() : Math.random(),
  }));
  entries.sort((a, b) => {
    if (b.tier !== a.tier) return b.tier - a.tier;
    return a.jitter - b.jitter;
  });
  return entries.slice(0, Math.min(count, entries.length)).map((entry) => entry.index);
}
