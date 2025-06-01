// /src/utils/particleFormations.js

// Generate starfield positions
export function generateStarfield(count, spread = 10) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    );
  }
  return new Float32Array(positions);
}

// Generate text formation positions
export function generateTextFormation(
  text,
  count,
  { font = 'bold 140px Arial', size = 8, canvasSize = 512 } = {}
) {
  const positions = [];
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText(text, canvasSize / 2, canvasSize / 2);

  const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize).data;
  let attempts = 0;
  while (positions.length / 3 < count && attempts < count * 10) {
    const x = Math.floor(Math.random() * canvasSize);
    const y = Math.floor(Math.random() * canvasSize);
    const idx = (y * canvasSize + x) * 4;
    if (imageData[idx + 3] > 128) {
      // Map to world coordinates
      const fx = (x / canvasSize - 0.5) * size;
      const fy = (1 - y / canvasSize - 0.5) * size;
      positions.push(fx, fy, 0);
    }
    attempts++;
  }
  // Pad with random points if needed
  while (positions.length / 3 < count) {
    positions.push(
      (Math.random() - 0.5) * size,
      (Math.random() - 0.5) * size,
      (Math.random() - 0.5) * size
    );
  }
  return new Float32Array(positions);
}
