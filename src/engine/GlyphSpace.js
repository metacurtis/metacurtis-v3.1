import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

const VOID_LETTERS = new Set(['O', 'A', 'R', 'P', 'D', 'B', 'Q']);

class GlyphSpace {
  constructor() {
    this._glyphMap = [];
    this._word = '';
    this._stage = null;
    this._isReady = false;
  }

  register(wordOrLookup = {}, maybeHotspotLookup = null) {
    const hasWordOverride = typeof wordOrLookup === 'string';
    const hotspotLookup = hasWordOverride
      ? { ...(maybeHotspotLookup || {}), word: wordOrLookup }
      : (wordOrLookup || {});
    const word = typeof hotspotLookup.word === 'string' ? hotspotLookup.word : '';
    const stage = typeof hotspotLookup.stageName === 'string' ? hotspotLookup.stageName : null;
    const glyphs = Array.isArray(hotspotLookup.glyphs) ? hotspotLookup.glyphs : [];

    this._word = word;
    this._stage = stage;
    this._glyphMap = this._buildGlyphMap(glyphs, word);
    this._isReady = this._glyphMap.length > 0;

    if (this._isReady) {
      BeatBus.emit(EVENTS.GLYPH_MAP_READY, {
        word: this._word,
        stage: this._stage,
        glyphs: this._glyphMap,
        source: 'GlyphSpace',
      });
    }

    if (typeof window !== 'undefined') {
      window.__glyphSpace = this;
    }

    return this._glyphMap;
  }

  _buildGlyphMap(glyphs = [], word = '') {
    const mapped = [];
    let glyphIndex = 0;

    glyphs.forEach((glyph) => {
      if (!glyph || glyph.isSpace) return;
      const letter = (glyph.normalized || glyph.char || word[glyphIndex] || '').toString();
      const normalized = letter.toUpperCase();
      const occurrence = Number.isFinite(glyph.occurrence) ? glyph.occurrence : 1;
      const centroid = glyph.centroid || null;
      const bounds = glyph.bounds || null;
      const width = bounds ? bounds.maxX - bounds.minX : 0;
      const height = bounds ? bounds.maxY - bounds.minY : 0;
      const depth = bounds ? bounds.maxZ - bounds.minZ : 0;

      mapped.push({
        id: glyphIndex,
        letter: normalized,
        occurrence,
        centroid,
        bounds,
        width,
        height,
        depth,
        indices: glyph.indices || [],
        particleCount: glyph.indices?.length || 0,
        hasVoid: VOID_LETTERS.has(normalized),
      });
      glyphIndex += 1;
    });

    return mapped;
  }

  getGlyph(identifier, occurrence = 1) {
    if (!this._isReady) return null;
    if (typeof identifier === 'number') {
      return this._glyphMap[identifier] || null;
    }
    const letter = String(identifier).toUpperCase();
    return this._glyphMap.find((g) => g.letter === letter && g.occurrence === occurrence) || null;
  }

  getAllGlyphs() {
    return this._glyphMap.slice();
  }

  getGlyphIndices(identifier, occurrence = 1) {
    const glyph = this.getGlyph(identifier, occurrence);
    return glyph?.indices || [];
  }

  getCameraTarget(identifier, mode = 'frame', occurrence = 1) {
    const glyph = this.getGlyph(identifier, occurrence);
    if (!glyph || !glyph.centroid) return null;

    const { centroid, width, height, depth, hasVoid } = glyph;
    const maxExtent = Math.max(width, height, depth, 1);

    if (mode === 'enter' && hasVoid) {
      return {
        position: [centroid.x, centroid.y, centroid.z],
        lookAt: [centroid.x + maxExtent, centroid.y, centroid.z],
      };
    }

    if (mode === 'approach') {
      return {
        position: [centroid.x - maxExtent * 3, centroid.y, centroid.z + maxExtent],
        lookAt: [centroid.x, centroid.y, centroid.z],
      };
    }

    if (mode === 'exit') {
      return {
        position: [centroid.x + maxExtent * 2, centroid.y, centroid.z],
        lookAt: [centroid.x + maxExtent * 4, centroid.y, centroid.z],
      };
    }

    if (mode === 'orbit') {
      return {
        position: [centroid.x, centroid.y + maxExtent * 2, centroid.z + maxExtent * 2],
        lookAt: [centroid.x, centroid.y, centroid.z],
      };
    }

    if (mode === 'through') {
      return {
        position: [centroid.x, centroid.y, centroid.z - maxExtent * 2],
        lookAt: [centroid.x, centroid.y, centroid.z + maxExtent * 2],
      };
    }

    return {
      position: [centroid.x, centroid.y, centroid.z + maxExtent * 2],
      lookAt: [centroid.x, centroid.y, centroid.z],
    };
  }

  clear() {
    this._glyphMap = [];
    this._word = '';
    this._stage = null;
    this._isReady = false;
  }

  getSummary() {
    if (!this._isReady) return { ready: false };
    return {
      ready: true,
      word: this._word,
      stage: this._stage,
      glyphCount: this._glyphMap.length,
      glyphs: this._glyphMap.map((g) => ({
        letter: g.letter,
        occurrence: g.occurrence,
        centroid: g.centroid,
        hasVoid: g.hasVoid,
        particleCount: g.particleCount,
      })),
    };
  }
}

export const glyphSpace = new GlyphSpace();
export default GlyphSpace;

if (typeof window !== 'undefined') {
  window.glyphSpace = glyphSpace;
  console.log('[GlyphSpace] Exposed to window');
}
