import { loadSST } from '@/config/sst-loader.js';

const SST = loadSST();
const LETTER_HOTSPOT_PATTERN = /^letter_([a-z])(?:[_-](\d+))?$/i;
const EMPTY_UINT32 = new Uint32Array(0);
const HOTSPOT_OVERRIDES = {
  neural: {
    cluster_alpha: { type: 'letter', letter: 'A', occurrence: 1 },
  },
  velocity: {
    orbit_path: { type: 'letter', letter: 'O', occurrence: 1 },
  },
  architecture: {
    pillar_one: { type: 'letter', letter: 'T', occurrence: 1 },
  },
  harmony: {
    orbit_chorus: { type: 'letter', letter: 'O', occurrence: 1 },
  },
  transcendence: {
    galaxy_core: { type: 'letter', letter: 'O', occurrence: 2 },
  },
};

/**
 * Build glyph metadata for a stage word.
 * Spaces are preserved to keep ordering but do not produce clusters.
 * @param {string} word
 * @returns {{ glyphs: Array<GlyphPlanEntry>, letterCount: number }}
 */
function buildGlyphPlan(word) {
  if (typeof word !== 'string' || word.length === 0) {
    return { glyphs: [], letterCount: 0 };
  }

  const glyphs = [];
  const occurrences = new Map();
  let letterIndex = 0;

  for (const rawChar of word) {
    const isSpace = rawChar.trim().length === 0;
    if (isSpace) {
      glyphs.push({
        char: rawChar,
        normalized: '',
        occurrence: 0,
        isSpace: true,
        letterIndex: null,
      });
      continue;
    }

    const normalized = rawChar.toUpperCase();
    const occurrence = (occurrences.get(normalized) ?? 0) + 1;
    occurrences.set(normalized, occurrence);

    glyphs.push({
      char: rawChar,
      normalized,
      occurrence,
      isSpace: false,
      letterIndex,
    });
    letterIndex += 1;
  }

  const letterCount = letterIndex;
  return { glyphs, letterCount };
}

/**
 * One-dimensional k-means (x-axis) to cluster particles by letter.
 * @param {Float32Array} positions
 * @param {number} letterCount
 * @returns {Array<Array<number>>}
 */
function clusterByLetter(positions, letterCount) {
  if (!positions || positions.length === 0 || !Number.isFinite(letterCount) || letterCount <= 0) {
    return [];
  }

  const totalParticles = Math.floor(positions.length / 3);
  if (totalParticles === 0) return [];

  const centroids = new Array(letterCount);
  const clusters = Array.from({ length: letterCount }, () => []);

  // Initial centroids → spread across quantiles
  const sortedIndices = Array.from({ length: totalParticles }, (_, i) => i)
    .sort((a, b) => positions[a * 3] - positions[b * 3]);

  for (let i = 0; i < letterCount; i++) {
    const q = Math.min(sortedIndices.length - 1, Math.round(((i + 0.5) / letterCount) * (sortedIndices.length - 1)));
    centroids[i] = positions[sortedIndices[q] * 3];
  }

  const maxIterations = Math.min(12, Math.max(4, letterCount * 2));
  for (let iter = 0; iter < maxIterations; iter++) {
    for (let c = 0; c < letterCount; c++) clusters[c].length = 0;

    for (let i = 0; i < totalParticles; i++) {
      const x = positions[i * 3];
      let bestCluster = 0;
      let bestDist = Math.abs(x - centroids[0]);

      for (let c = 1; c < letterCount; c++) {
        const dist = Math.abs(x - centroids[c]);
        if (dist < bestDist) {
          bestDist = dist;
          bestCluster = c;
        }
      }

      clusters[bestCluster].push(i);
    }

    // Guard against empty clusters by stealing the furthest point from the largest cluster.
    for (let c = 0; c < letterCount; c++) {
      if (clusters[c].length > 0) continue;

      let donor = -1;
      let donorMemberIndex = -1;
      let donorMemberScore = -Infinity;

      for (let d = 0; d < letterCount; d++) {
        if (clusters[d].length <= 1) continue;
        const members = clusters[d];
        for (let m = 0; m < members.length; m++) {
          const idx = members[m];
          const score = Math.abs(positions[idx * 3] - centroids[d]);
          if (score > donorMemberScore) {
            donorMemberScore = score;
            donor = d;
            donorMemberIndex = m;
          }
        }
      }

      if (donor !== -1 && donorMemberIndex !== -1) {
        const [moved] = clusters[donor].splice(donorMemberIndex, 1);
        clusters[c].push(moved);
      }
    }

    let centroidShift = 0;
    for (let c = 0; c < letterCount; c++) {
      const members = clusters[c];
      if (members.length === 0) continue;

      let sum = 0;
      for (let i = 0; i < members.length; i++) {
        sum += positions[members[i] * 3];
      }
      const mean = sum / members.length;
      centroidShift += Math.abs(mean - centroids[c]);
      centroids[c] = mean;
    }

    if (centroidShift < 1e-3) break;
  }

  return clusters;
}

/**
 * Produce glyph cluster summaries for a given stage word.
 * @param {string} word
 * @param {Float32Array} positions
 * @returns {{ glyphs: Array<GlyphCluster> }}
 */
function clusterTextGlyphs(word, positions) {
  const { glyphs, letterCount } = buildGlyphPlan(word);
  if (letterCount === 0 || !positions || positions.length === 0) {
    return { glyphs: glyphs.map(g => ({
      ...g,
      indices: EMPTY_UINT32,
      centroid: null,
      bounds: null,
    })) };
  }

  const clusters = clusterByLetter(positions, letterCount);

  const clusterSummaries = clusters.map((members, idx) => {
    if (!members || members.length === 0) {
      return {
        sourceIndex: idx,
        centroidX: Infinity,
        members: EMPTY_UINT32,
        centroid: null,
        bounds: null,
      };
    }

    const typedMembers = members.length ? new Uint32Array(members) : EMPTY_UINT32;
    if (typedMembers.length === 0) {
      return {
        sourceIndex: idx,
        centroidX: Infinity,
        members: EMPTY_UINT32,
        centroid: null,
        bounds: null,
      };
    }

    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < typedMembers.length; i++) {
      const idx3 = typedMembers[i] * 3;
      const x = positions[idx3];
      const y = positions[idx3 + 1];
      const z = positions[idx3 + 2];

      sumX += x;
      sumY += y;
      sumZ += z;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    const count = typedMembers.length || 1;
    return {
      sourceIndex: idx,
      centroidX: sumX / count,
      members: typedMembers,
      centroid: {
        x: sumX / count,
        y: sumY / count,
        z: sumZ / count,
      },
      bounds: {
        minX,
        minY,
        minZ,
        maxX,
        maxY,
        maxZ,
      },
    };
  }).sort((a, b) => a.centroidX - b.centroidX);

  let orderedClusterIdx = 0;

  return {
    glyphs: glyphs.map((glyph) => {
      if (glyph.isSpace) {
        return {
          ...glyph,
          indices: EMPTY_UINT32,
          centroid: null,
          bounds: null,
        };
      }

      const summary = clusterSummaries[orderedClusterIdx] || null;
      orderedClusterIdx += 1;

      if (!summary) {
        return {
          ...glyph,
          indices: EMPTY_UINT32,
          centroid: null,
          bounds: null,
        };
      }

      return {
        ...glyph,
        indices: summary.members,
        centroid: summary.centroid,
        bounds: summary.bounds,
      };
    }),
  };
}

function parseLetterHotspotId(hotspotId) {
  const match = typeof hotspotId === 'string' ? hotspotId.match(LETTER_HOTSPOT_PATTERN) : null;
  if (!match) return null;
  const [, rawLetter, occurrence = '1'] = match;
  const normalized = rawLetter.toUpperCase();
  const occ = parseInt(occurrence, 10);
  return {
    type: 'letter',
    letter: normalized,
    occurrence: Number.isFinite(occ) && occ > 0 ? occ : 1,
  };
}

function resolveHotspotDescriptor(stageName, hotspotId) {
  const stageOverrides = stageName ? HOTSPOT_OVERRIDES?.[stageName] : null;
  const override = stageOverrides?.[hotspotId];
  if (override) {
    if (override.type === 'letter' && typeof override.letter === 'string') {
      return {
        type: 'letter',
        letter: override.letter.toUpperCase(),
        occurrence: Number.isFinite(override.occurrence) && override.occurrence > 0
          ? override.occurrence
          : 1,
      };
    }
    return override;
  }

  const parsed = parseLetterHotspotId(hotspotId);
  if (parsed) {
    return {
      type: 'letter',
      letter: parsed.letter,
      occurrence: parsed.occurrence,
    };
  }

  return null;
}

function resolveStageHotspots(stageName) {
  const stage = SST?.stages?.[stageName];
  if (!stage) return [];

  const out = [];
  const interactive = stage?.memoryFragments?.interactive;
  if (interactive?.hotspot) {
    out.push({
      id: interactive.hotspot,
      source: 'memoryFragments.interactive',
      fragmentId: interactive.id || null,
    });
  }

  return out;
}

function resolveStageWord(stageName) {
  const explicit = SST?.visual?.letterGeometry?.[stageName]?.word;
  if (typeof explicit === 'string' && explicit.length > 0) return explicit;
  const stage = SST?.stages?.[stageName];
  if (typeof stage?.word === 'string' && stage.word.length > 0) return stage.word;
  if (typeof stageName === 'string' && stageName.length > 0) return stageName.toUpperCase();
  return '';
}

/**
 * Build a particle index lookup keyed by hotspot id.
 * @param {Object} params
 * @param {string} params.stageName
 * @param {Float32Array} params.text3DPositions
 * @param {Array<string>} [params.hotspotIds]
 * @returns {HotspotLookup}
 */
export function buildHotspotLookup({ stageName, text3DPositions, hotspotIds }) {
  const word = resolveStageWord(stageName);
  const { glyphs } = clusterTextGlyphs(word, text3DPositions);

  const resolvedFromSst = resolveStageHotspots(stageName);
  const requestedEntries = Array.isArray(hotspotIds) && hotspotIds.length > 0
    ? hotspotIds.map((id) => ({ id, source: 'manual', fragmentId: null }))
    : resolvedFromSst;

  const uniqueEntries = [];
  const seen = new Set();
  for (const entry of requestedEntries) {
    const id = entry?.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    uniqueEntries.push({
      id,
      source: entry?.source || 'manual',
      fragmentId: entry?.fragmentId ?? null,
    });
  }

  const indicesByHotspot = {};
  const unresolved = [];

  uniqueEntries.forEach((entry) => {
    const hotspotId = entry.id;
    const descriptor = resolveHotspotDescriptor(stageName, hotspotId);

    if (!descriptor || descriptor.type !== 'letter') {
      indicesByHotspot[hotspotId] = {
        indices: EMPTY_UINT32,
        fragmentId: entry.fragmentId,
        centroid: null,
        bounds: null,
        glyph: null,
        source: entry.source,
        reason: 'unsupported_hotspot_type',
      };
      unresolved.push({ hotspotId, reason: 'unsupported_hotspot_type', fragmentId: entry.fragmentId });
      return;
    }

    const glyph = glyphs.find((g) => !g.isSpace
      && g.normalized === descriptor.letter
      && g.occurrence === descriptor.occurrence);

    if (!glyph || !glyph.indices || glyph.indices.length === 0) {
      indicesByHotspot[hotspotId] = {
        indices: EMPTY_UINT32,
        fragmentId: entry.fragmentId,
        centroid: null,
        bounds: null,
        glyph: null,
        source: entry.source,
        reason: 'glyph_not_found',
      };
      unresolved.push({ hotspotId, reason: 'glyph_not_found', fragmentId: entry.fragmentId });
      return;
    }

    indicesByHotspot[hotspotId] = {
      indices: glyph.indices,
      fragmentId: entry.fragmentId,
      centroid: glyph.centroid,
      bounds: glyph.bounds,
      glyph,
      source: entry.source,
    };
  });

  const hotspotIdsResolved = uniqueEntries.map((entry) => entry.id);

  return {
    stageName,
    word,
    hotspots: hotspotIdsResolved,
    indicesByHotspot,
    glyphs,
    unresolved,
    requests: uniqueEntries,
    generatedAt: (typeof performance !== 'undefined' && performance?.now)
      ? performance.now()
      : Date.now(),
  };
}

/**
 * @typedef {Object} GlyphPlanEntry
 * @property {string} char
 * @property {string} normalized
 * @property {number} occurrence
 * @property {boolean} isSpace
 * @property {number|null} letterIndex
 */

/**
 * @typedef {GlyphPlanEntry & {
 *   indices: Uint32Array,
 *   centroid: {x:number, y:number, z:number}|null,
 *   bounds: {minX:number, minY:number, minZ:number, maxX:number, maxY:number, maxZ:number}|null
 * }} GlyphCluster
 */

/**
 * @typedef {Object} HotspotEntry
 * @property {Uint32Array} indices
 * @property {string|null} fragmentId
 * @property {{x:number, y:number, z:number}|null} centroid
 * @property {{minX:number, minY:number, minZ:number, maxX:number, maxY:number, maxZ:number}|null} bounds
 * @property {GlyphCluster|null} glyph
 * @property {string} source
 * @property {string|undefined} [reason]
 */

/**
 * @typedef {Object} HotspotLookup
 * @property {string} stageName
 * @property {string} word
 * @property {Array<string>} hotspots
 * @property {Record<string, HotspotEntry>} indicesByHotspot
 * @property {Array<GlyphCluster>} glyphs
 * @property {Array<{hotspotId: string, reason: string}>} unresolved
 * @property {Array<{id: string, source: string, fragmentId: string|null}>} requests
 * @property {number} generatedAt
 */

export default buildHotspotLookup;
