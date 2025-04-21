import { useEffect } from 'react';
import ParticleField from './components/webgl/ParticleField';
import { useInteractionStore } from './stores/useInteractionStore';
import Layout from './components/ui/Layout';
import Hero from './sections/Hero';
import About from './sections/About';
import Features from './sections/Features';
import Contact from './sections/Contact';

function App() {
  const setCursorPosition = useInteractionStore(state => state.setCursorPosition);
  const setScrollProgress = useInteractionStore(state => state.setScrollProgress);

  useEffect(() => {
    const onMouse = e => setCursorPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMouse);
    return () => window.removeEventListener('mousemove', onMouse);
  }, [setCursorPosition]);

  useEffect(() => {
    const onScroll = () => {
      const sTop = window.scrollY;
      const mScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(mScroll > 0 ? sTop / mScroll : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
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
