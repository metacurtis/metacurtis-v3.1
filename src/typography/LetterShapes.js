import { ShapePath, Vector2 } from 'three';

const DEFAULT_DIVISIONS = 12;

const initBounds = () => ({
  minX: Infinity,
  minY: Infinity,
  maxX: -Infinity,
  maxY: -Infinity,
});

const expandBounds = (bounds, x, y) => {
  bounds.minX = Math.min(bounds.minX, x);
  bounds.minY = Math.min(bounds.minY, y);
  bounds.maxX = Math.max(bounds.maxX, x);
  bounds.maxY = Math.max(bounds.maxY, y);
};

const finalizeBounds = (bounds) => {
  if (!bounds || !Number.isFinite(bounds.minX)) return null;
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  return {
    ...bounds,
    width,
    height,
    centerX: bounds.minX + width * 0.5,
    centerY: bounds.minY + height * 0.5,
  };
};

const mergeBounds = (base, next) => {
  if (!next) return base;
  if (!base) return { ...next };
  base.minX = Math.min(base.minX, next.minX);
  base.minY = Math.min(base.minY, next.minY);
  base.maxX = Math.max(base.maxX, next.maxX);
  base.maxY = Math.max(base.maxY, next.maxY);
  return base;
};

const computeBoundsFromPoints = (points, bounds) => {
  if (!points || points.length === 0) return bounds;
  const target = bounds || initBounds();
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    if (!point) continue;
    expandBounds(target, point.x, point.y);
  }
  return target;
};

const getPathBounds = (path, divisions = DEFAULT_DIVISIONS) => {
  if (!path) return null;
  const points = path.getPoints(divisions);
  return finalizeBounds(computeBoundsFromPoints(points, null));
};

const offsetCurve = (curve, dx, dy) => {
  if (!curve) return;
  Object.keys(curve).forEach((key) => {
    const value = curve[key];
    if (value && value.isVector2) {
      value.x += dx;
      value.y += dy;
    }
  });
};

const translatePath = (path, dx, dy) => {
  if (!path) return;
  if (path.currentPoint && path.currentPoint.isVector2) {
    path.currentPoint.x += dx;
    path.currentPoint.y += dy;
  }
  if (path.curves && path.curves.length) {
    path.curves.forEach((curve) => offsetCurve(curve, dx, dy));
  }
};

const translateShape = (shape, dx, dy) => {
  if (!shape) return;
  translatePath(shape, dx, dy);
  if (shape.holes && shape.holes.length) {
    shape.holes.forEach((hole) => translatePath(hole, dx, dy));
  }
};

const buildGlyphPath = (char, scale, offsetX, offsetY, data) => {
  const glyph = data.glyphs[char] || data.glyphs['?'];
  if (!glyph) return null;

  const path = new ShapePath();
  if (glyph.o) {
    const outline = glyph._cachedOutline || (glyph._cachedOutline = glyph.o.split(' '));
    let x;
    let y;
    let cpx;
    let cpy;
    let cpx1;
    let cpy1;
    let cpx2;
    let cpy2;

    for (let i = 0, l = outline.length; i < l;) {
      const action = outline[i++];
      switch (action) {
        case 'm':
          x = outline[i++] * scale + offsetX;
          y = outline[i++] * scale + offsetY;
          path.moveTo(x, y);
          break;
        case 'l':
          x = outline[i++] * scale + offsetX;
          y = outline[i++] * scale + offsetY;
          path.lineTo(x, y);
          break;
        case 'q':
          cpx = outline[i++] * scale + offsetX;
          cpy = outline[i++] * scale + offsetY;
          cpx1 = outline[i++] * scale + offsetX;
          cpy1 = outline[i++] * scale + offsetY;
          path.quadraticCurveTo(cpx1, cpy1, cpx, cpy);
          break;
        case 'b':
          cpx = outline[i++] * scale + offsetX;
          cpy = outline[i++] * scale + offsetY;
          cpx1 = outline[i++] * scale + offsetX;
          cpy1 = outline[i++] * scale + offsetY;
          cpx2 = outline[i++] * scale + offsetX;
          cpy2 = outline[i++] * scale + offsetY;
          path.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, cpx, cpy);
          break;
        default:
          break;
      }
    }
  }

  return {
    advance: glyph.ha * scale,
    path,
  };
};

export const getShapeBounds = (shape, divisions = DEFAULT_DIVISIONS) => {
  if (!shape) return null;
  const { shape: outline, holes } = shape.extractPoints(divisions);
  let bounds = computeBoundsFromPoints(outline, null);
  if (holes && holes.length) {
    holes.forEach((holePoints) => {
      bounds = computeBoundsFromPoints(holePoints, bounds);
    });
  }
  return finalizeBounds(bounds);
};

export const getVoidCenter = (shape, divisions = DEFAULT_DIVISIONS) => {
  if (!shape || !shape.holes || shape.holes.length === 0) return null;
  const holeBounds = getPathBounds(shape.holes[0], divisions);
  if (!holeBounds) return null;
  return new Vector2(holeBounds.centerX, holeBounds.centerY);
};

const getBoundsForShapes = (shapes, divisions) => {
  if (!shapes || shapes.length === 0) return null;
  let bounds = null;
  shapes.forEach((shape) => {
    bounds = mergeBounds(bounds, getShapeBounds(shape, divisions));
  });
  return finalizeBounds(bounds);
};

const getFirstVoidCenter = (shapes, divisions) => {
  if (!shapes) return null;
  for (let i = 0; i < shapes.length; i += 1) {
    const center = getVoidCenter(shapes[i], divisions);
    if (center) return center;
  }
  return null;
};

export const getLetterShapes = (font, text, size = 32, options = {}) => {
  const { center = true, divisions = DEFAULT_DIVISIONS } = options;
  if (!font || typeof font.generateShapes !== 'function' || !text) {
    return { letters: [], bounds: null, center: new Vector2(0, 0) };
  }

  const data = font.data;
  if (!data || !data.glyphs) {
    return { letters: [], bounds: null, center: new Vector2(0, 0) };
  }

  const chars = Array.from(text);
  const scale = size / data.resolution;
  const lineHeight =
    (data.boundingBox.yMax - data.boundingBox.yMin + data.underlineThickness) * scale;

  let offsetX = 0;
  let offsetY = 0;
  const letters = [];
  const allShapes = [];

  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i];
    if (char === '\n') {
      offsetX = 0;
      offsetY -= lineHeight;
      continue;
    }

    const result = buildGlyphPath(char, scale, offsetX, offsetY, data);
    if (!result) continue;
    offsetX += result.advance;

    const shapes = result.path.toShapes();
    if (!shapes || shapes.length === 0) continue;

    const hasVoid = shapes.some((shape) => shape.holes && shape.holes.length > 0);
    const voidPaths = shapes.flatMap((shape) => shape.holes || []);
    const bounds = getBoundsForShapes(shapes, divisions);
    const voidCenter = getFirstVoidCenter(shapes, divisions);

    letters.push({
      letter: char,
      index: i,
      shapes,
      hasVoid,
      bounds,
      voidPaths,
      voidCenter,
    });

    allShapes.push(...shapes);
  }

  let bounds = getBoundsForShapes(allShapes, divisions);
  let centerPoint = bounds ? new Vector2(bounds.centerX, bounds.centerY) : new Vector2(0, 0);

  if (center && bounds) {
    const dx = -bounds.centerX;
    const dy = -bounds.centerY;
    letters.forEach((entry) => {
      entry.shapes.forEach((shape) => translateShape(shape, dx, dy));
      entry.bounds = getBoundsForShapes(entry.shapes, divisions);
      if (entry.voidCenter) {
        entry.voidCenter = new Vector2(entry.voidCenter.x + dx, entry.voidCenter.y + dy);
      }
    });
    bounds = getBoundsForShapes(allShapes, divisions);
    centerPoint = new Vector2(0, 0);
  }

  return { letters, bounds, center: centerPoint };
};
