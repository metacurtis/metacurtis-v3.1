// update-camera.js - Adjust camera position for better text visibility

// This would go in WebGLCanvas.jsx around line 50-60
// Find the Camera component and update its position and fov

const cameraSettings = {
  position: [0, 0, 120],  // Further back to see full text
  fov: 60,                // Slightly wider field of view
  near: 0.1,
  far: 1000
};

// In the Canvas component:
/*
<Canvas
  shadows
  dpr={[1, 2]}
  camera={{ 
    position: [0, 0, 120],  // Changed from 80 to 120
    fov: 60,                // Changed from 75 to 60
    near: 0.1,
    far: 1000
  }}
  ...
>
*/

console.log("Camera settings to apply in WebGLCanvas.jsx:", cameraSettings);
