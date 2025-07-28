// src/components/graphics/SimpleAnimatedCube.jsx
import { useRef } from 'react'; // No 'React' import needed
import { useFrame } from '@react-three/fiber';

export const SimpleAnimatedCube = props => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Consistent rotation
      meshRef.current.rotation.x += delta * 0.4;
      meshRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <mesh ref={meshRef} {...props}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="mediumseagreen" />
    </mesh>
  );
};

// export default SimpleAnimatedCube; // If using default export
