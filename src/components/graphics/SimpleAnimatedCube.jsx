// src/components/graphics/SimpleAnimatedCube.jsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export const SimpleAnimatedCube = props => {
  // useRef allows us to access the mesh directly
  const meshRef = useRef();

  // useFrame runs code on every rendered frame
  useFrame((state, delta) => {
    // Rotate the cube on x and y axes
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5; // Adjust speed as needed
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    // Pass meshRef to the mesh component
    <mesh ref={meshRef} {...props}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="mediumseagreen" />
    </mesh>
  );
};

// Optional: Default export if preferred
// export default SimpleAnimatedCube;
