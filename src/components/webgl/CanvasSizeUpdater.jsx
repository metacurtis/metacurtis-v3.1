// src/components/webgl/CanvasSizeUpdater.jsx
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

/**
 * This component uses R3F's hooks to ensure the WebGL renderer's size
 * matches the canvas container size after initial mount. This can fix
 * issues where the initial size calculation by R3F is incorrect, causing
 * the canvas style to have wrong width/height attributes.
 */
function CanvasSizeUpdater() {
  // Get renderer (gl), computed container size, and camera from R3F state
  const { gl, size, camera } = useThree();

  // Run this effect initially and whenever size changes
  useEffect(() => {
    // Check if the size object has valid dimensions reported by the observer
    if (size.width > 0 && size.height > 0) {
      console.log(`CanvasSizeUpdater: Setting renderer size to ${size.width} x ${size.height}`);
      // Explicitly set the WebGL renderer's size
      gl.setSize(size.width, size.height);
      // Update the camera's aspect ratio to match the new size
      camera.aspect = size.width / size.height;
      // Apply the camera changes
      camera.updateProjectionMatrix();
    }
  }, [gl, size, camera]); // Re-run effect if these dependencies change

  // This component does not render anything itself
  return null;
}

// Ensure the default export exists!
export default CanvasSizeUpdater;
