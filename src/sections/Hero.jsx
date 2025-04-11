// src/sections/Hero.jsx
import { useRef, useEffect } from 'react'; // Import only needed Hooks

/**
 * The Hero section component - the first main content area users see.
 */
function Hero() {
  // Refs for potential GSAP animations targeting specific elements
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const paragraphRef = useRef(null);

  // Example placeholder for entrance animations triggered on mount
  useEffect(() => {
    // TODO: Implement GSAP entrance animations (e.g., fade in, slide up)
    // Example using GSAP (make sure GSAP is imported/available if uncommented):
    // const gsap = window.gsap; // Assuming GSAP is globally available or import it
    // if (gsap && headingRef.current && paragraphRef.current) {
    //   gsap.from(headingRef.current, { autoAlpha: 0, y: 50, duration: 1, ease: 'power3.out' });
    //   gsap.from(paragraphRef.current, { autoAlpha: 0, y: 30, duration: 0.8, ease: 'power3.out', delay: 0.3 });
    // }
    console.log('Hero component mounted'); // Log for verification
  }, []); // Empty dependency array means this runs once on mount

  return (
    // Section container with ID for navigation and ref for animation scope
    <section
      id="hero" // <-- ID must match the Navbar link's href="#hero"
      ref={sectionRef}
      // Basic styling: minimum viewport height, flex centering, padding, semi-transparent background
      // Added relative positioning and overflow hidden as good practice for sections containing animations
      className="min-h-screen flex flex-col justify-center items-center text-center relative overflow-hidden px-4 py-20 bg-gradient-to-b from-sky-200/60 via-sky-100/40 to-transparent"
    >
      {/* Content wrapper ensures content is above background canvas (z-10) */}
      <div className="relative z-10 max-w-4xl">
        {' '}
        {/* Constrain content width */}
        <h1
          ref={headingRef}
          // Responsive text size, bold weight, color, margin, line height
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-gray-900 mb-6 leading-tight"
        >
          Engage & Experience {/* Placeholder Headline */}
        </h1>
        <p
          ref={paragraphRef}
          // Responsive text size, color, margin
          className="text-lg sm:text-xl lg:text-2xl text-gray-700 mb-8"
        >
          Discover seamless interactivity powered by cutting-edge WebGL.{' '}
          {/* Placeholder Sub-headline */}
        </p>
        {/* TODO: Add Call-to-Action Button(s) or other interactive elements */}
        {/* Example using custom component class from index.css: */}
        {/* <button className="btn btn-primary mt-8">Explore Now</button> */}
      </div>
    </section>
  );
}

// Ensure the default export matches the component name used in App.jsx's import
export default Hero;
