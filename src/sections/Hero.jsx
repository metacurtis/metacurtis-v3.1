// src/components/sections/HeroSection.jsx
import React, { useRef, useEffect } from 'react'; // Import hooks for later use

/**
 * The Hero section component - the first main content area users see.
 */
function HeroSection() {
  // Refs for potential GSAP animations targeting specific elements
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const paragraphRef = useRef(null);

  // Example placeholder for entrance animations triggered on mount
  useEffect(() => {
    // TODO: Implement GSAP entrance animations (e.g., fade in, slide up)
    // gsap.from(headingRef.current, { autoAlpha: 0, y: 50, duration: 1, ease: 'power3.out' });
    // gsap.from(paragraphRef.current, { autoAlpha: 0, y: 30, duration: 0.8, ease: 'power3.out', delay: 0.3 });
    console.log('HeroSection mounted'); // Log for verification
  }, []); // Empty dependency array means this runs once on mount

  return (
    // Section container with ID for navigation and ref for animation scope
    <section
      id="hero" // <-- ID must match the Navbar link's href="#hero"
      ref={sectionRef}
      // Basic styling: full viewport height, flex centering, padding, semi-transparent background
      className="min-h-screen flex flex-col justify-center items-center text-center relative overflow-hidden px-4 py-20 bg-gradient-to-b from-sky-200/60 via-sky-100/40 to-transparent"
    >
      {/* Content wrapper ensures content is above background canvas */}
      <div className="relative z-10 max-w-4xl">
        {' '}
        {/* Added max-width */}
        <h1
          ref={headingRef}
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-gray-900 mb-6 leading-tight" // Larger, bolder text
        >
          Engage & Experience {/* Placeholder Headline */}
        </h1>
        <p
          ref={paragraphRef}
          className="text-lg sm:text-xl lg:text-2xl text-gray-700 mb-8" // Adjusted text size/color
        >
          Discover seamless interactivity powered by cutting-edge WebGL.{' '}
          {/* Placeholder Sub-headline */}
        </p>
        {/* TODO: Add Call-to-Action Button(s) or other interactive elements */}
        {/* Example: <button className="btn-primary mt-8">Explore</button> */}
      </div>
    </section>
  );
}

export default HeroSection;
