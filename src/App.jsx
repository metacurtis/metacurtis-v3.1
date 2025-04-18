// src/App.jsx (Restoring Correct Canvas Style)
import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';

// Store Hook & Action
import { useInteractionStore } from './stores/useInteractionStore'; // Verify path

// Core Components
import Layout from './components/ui/Layout'; // Verify path
import WebGLBackground from './components/webgl/WebGLBackground'; // Verify path/name
import CanvasSizeUpdater from './components/webgl/CanvasSizeUpdater'; // Verify path

// Section Components
import Hero from './sections/Hero'; // Verify path
import About from './sections/About'; // Verify path
import Features from './sections/Features'; // Verify path
import Contact from './sections/Contact'; // Verify path

function App() {
  // Get actions from the Zustand store
  const setCursorPosition = useInteractionStore(state => state.setCursorPosition);
  const setScrollProgress = useInteractionStore(state => state.setScrollProgress);

  // Effect for Mouse Listener
  useEffect(() => {
    const handleMouseMove = event => {
      setCursorPosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    console.log('App mounted, mousemove listener added.');
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      console.log('App unmounting, mousemove listener removed.');
    };
  }, [setCursorPosition]);

  // Effect for Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const maxScrollTop = docHeight - windowHeight;
      const progress = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;
      const clampedProgress = Math.max(0, Math.min(1, progress));
      setScrollProgress(clampedProgress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    console.log('App mounted, scroll listener added.');
    handleScroll(); // Call initially
    return () => {
      window.removeEventListener('scroll', handleScroll);
      console.log('App unmounting, scroll listener removed.');
    };
  }, [setScrollProgress]);

  return (
    <>
      {/* Canvas with CORRECT fixed background style */}
      <Canvas
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw', // <-- Correct full width
          height: '100vh', // <-- Correct full height
          zIndex: -1, // <-- Correct background z-index
        }}
        // Restore other props
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        flat
      >
        {/* Restore children */}
        <WebGLBackground />
        <CanvasSizeUpdater />
      </Canvas>

      {/* Layout renders on top */}
      <Layout>
        <Hero />
        <About />
        <Features />
        <Contact />
      </Layout>
    </>
  );
}

export default App;
