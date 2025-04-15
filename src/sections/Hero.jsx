// src/sections/Hero.jsx
import { useRef, useEffect } from 'react';
import gsap from 'gsap'; // Import GSAP

/**
 * The Hero section component - Testing inline style for font size.
 */
function Hero() {
  const sectionRef = useRef(null);
  const lettersContainerRef = useRef(null);

  // Keep GSAP animation logic
  useEffect(() => {
    let tl;
    const letters = lettersContainerRef.current?.children;
    if (letters && letters.length > 0 && gsap) {
      gsap.set(letters, { autoAlpha: 1, y: 0, scale: 1, rotation: 0 });
      tl = gsap.timeline();
      tl.from(letters, {
        autoAlpha: 0,
        y: 80,
        scale: 0.8,
        rotation: -10,
        duration: 1.0,
        ease: 'power4.out',
        stagger: 0.15,
      });
      console.log('Hero component mounted, enhanced stagger animation triggered.');
    } else {
      console.log('Hero mount: GSAP targets not ready yet.');
    }
    return () => {
      if (tl) {
        tl.kill();
      }
    };
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center items-center text-center relative overflow-hidden px-4 py-20 bg-gradient-to-b from-sky-200/60 via-sky-100/40 to-transparent"
    >
      {/* Content Wrapper */}
      <div className="relative z-20 max-w-4xl w-full">
        {/* Container for the letters */}
        <div
          ref={lettersContainerRef}
          className="letters-container flex justify-center items-baseline space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4"
          aria-label="MC3V"
        >
          {/* Applying font size directly inline to the first span */}
          <span
            className="inline-block font-extrabold" /* Removed text-size and text-white */
            style={{
              fontSize: '10rem',
              lineHeight: 1,
              color: '#ff00ff',
            }} /* Force size/lineHeight inline */
          >
            M
          </span>
          {/* Other spans still using classes (will likely remain small for now) */}
          <span
            className="inline-block text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] font-extrabold text-white"
            style={{ color: '#ff00ff' }}
          >
            C
          </span>
          <span
            className="inline-block text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] font-extrabold text-white"
            style={{ color: '#ff66ff' }}
          >
            3
          </span>
          <span
            className="inline-block text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] font-extrabold text-white"
            style={{ color: '#ff66ff' }}
          >
            V
          </span>
        </div>
        {/* TODO: Add subtitle, scroll indicator, etc. */}
      </div>
    </section>
  );
}

export default Hero;
