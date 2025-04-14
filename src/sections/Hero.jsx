// src/sections/Hero.jsx
import { useRef, useEffect } from 'react';
import gsap from 'gsap'; // Import GSAP

/**
 * The Hero section component - GSAP entrance with explicit set and cleanup.
 */
function Hero() {
  const sectionRef = useRef(null);
  const lettersContainerRef = useRef(null);

  // GSAP Entrance Animation with Cleanup
  useEffect(() => {
    let tl; // Define timeline variable in the effect's scope
    // Target elements using the ref with optional chaining for safety
    const letters = lettersContainerRef.current?.children;

    // Ensure the container ref and children exist and GSAP is available
    if (letters && letters.length > 0 && gsap) {
      // --- Explicitly Set Final State ---
      // Set the elements to their final state (visible, at y=0) immediately.
      // This ensures that the 'from' animation has a clear target to animate towards,
      // even across HMR updates or StrictMode double-invokes.
      gsap.set(letters, { autoAlpha: 1, y: 0 });
      // --- End Explicit Set ---

      // Create the timeline
      tl = gsap.timeline();

      // Define the 'from' animation
      tl.from(letters, {
        autoAlpha: 0, // Animate from invisible
        y: 50, // Animate from 50px down
        // scale: 0.5,    // Can add these back later if desired
        // rotation: -15, // Can add these back later if desired
        duration: 1.0,
        ease: 'power4.out',
        stagger: 0.15,
      });
      console.log('Hero component mounted, stagger animation triggered.');
    } else {
      console.log('Hero mount: GSAP targets not ready yet.');
    }

    // --- Cleanup Function ---
    return () => {
      if (tl) {
        console.log('Cleaning up Hero animation timeline.');
        // Kill the timeline AND immediately set elements back to final state
        // to prevent flashes if the component remounts quickly
        tl.kill();
        // Optional: If elements sometimes flash hidden on fast HMR, uncommenting this set might help
        // if (letters && letters.length > 0) {
        //   gsap.set(letters, { autoAlpha: 1, y: 0 });
        // }
      }
    };
    // --- End Cleanup Function ---
  }, []); // Empty dependency array ensures this runs only once on mount (per mount cycle)

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center items-center text-center relative overflow-hidden px-4 py-20 bg-gradient-to-b from-sky-200/60 via-sky-100/40 to-transparent"
    >
      {/* Content Wrapper */}
      <div className="relative z-20 max-w-4xl">
        {/* Container for the letters */}
        <div
          ref={lettersContainerRef}
          className="flex justify-center items-baseline space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4"
          aria-label="MC3V"
        >
          {/* NO initial opacity/visibility styles needed - GSAP handles it */}
          <span
            className="inline-block text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] font-extrabold"
            style={{ color: '#ff00ff' }}
          >
            M
          </span>
          <span
            className="inline-block text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] font-extrabold"
            style={{ color: '#ff00ff' }}
          >
            C
          </span>
          <span
            className="inline-block text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] font-extrabold"
            style={{ color: '#ff66ff' }}
          >
            3
          </span>
          <span
            className="inline-block text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] font-extrabold"
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
