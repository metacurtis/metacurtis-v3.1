import { useEffect } from 'react';
import ParticleField from './components/webgl/ParticleField';

// Store Hook & Action
import { useInteractionStore } from './stores/useInteractionStore';

// Core Components
import Layout from './components/ui/Layout';

// Section Components
import Hero from './sections/Hero';
import About from './sections/About';
import Features from './sections/Features';
import Contact from './sections/Contact';

function App() {
  const setCursorPosition = useInteractionStore(state => state.setCursorPosition);
  const setScrollProgress = useInteractionStore(state => state.setScrollProgress);

  useEffect(() => {
    const handleMouse = e => setCursorPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [setCursorPosition]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(maxScroll > 0 ? scrollTop / maxScroll : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setScrollProgress]);

  return (
    <>
      <ParticleField
        count={8000}
        baseSize={0.015}
        colors={['#ff00ff', '#00ffff', '#0066ff']}
        quality="high"
      />

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
