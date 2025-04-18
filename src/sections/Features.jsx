// src/sections/Features.jsx
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger'; // Import ScrollTrigger

// Register ScrollTrigger plugin with GSAP
gsap.registerPlugin(ScrollTrigger);

/**
 * Component for the Features section with scroll-triggered animations.
 */
function Features() {
  const sectionRef = useRef(null); // Ref for the main section element (trigger)
  const headingRef = useRef(null); // Ref for the heading
  const gridRef = useRef(null); // Ref for the grid container

  useEffect(() => {
    console.log('Features Section mounted - setting up ScrollTrigger');
    const sectionElement = sectionRef.current;
    // Gather elements to animate (heading and individual grid items)
    const headingElement = headingRef.current;
    const gridItems = gridRef.current ? gsap.utils.toArray(gridRef.current.children) : [];
    const animatedElements = [headingElement, ...gridItems].filter(Boolean);

    // Ensure elements exist before creating animation
    if (sectionElement && animatedElements.length > 0 && gsap) {
      // Set initial state (hidden and shifted down)
      gsap.set(animatedElements, { autoAlpha: 0, y: 50 });

      // Create the ScrollTrigger animation timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionElement,
          start: 'top bottom-=150px', // Start animation earlier
          end: 'bottom top+=150px',
          // markers: process.env.NODE_ENV === 'development', // Uncomment for debugging
          toggleActions: 'play none none reverse', // Play on enter, reverse on leave back up
        },
      });

      // Add staggered animations to the timeline
      tl.to(animatedElements, {
        autoAlpha: 1, // Fade in
        y: 0, // Slide up
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.15, // Stagger animation for heading and each grid item
      });
    } else {
      console.warn('Features Section: Refs not available for ScrollTrigger setup.');
    }

    // --- Cleanup Function ---
    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.trigger === sectionElement) {
          console.log('Killing Features Section ScrollTrigger');
          trigger.kill();
        }
      });
    };
  }, []); // Runs once on mount

  return (
    <section
      id="features" // ID for scroll navigation
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center items-center text-center py-20 md:py-28 lg:py-36 bg-gradient-to-b from-indigo-200/70 via-indigo-100/50 to-transparent relative overflow-hidden px-4"
    >
      {/* Content wrapper */}
      <div className="relative z-10 max-w-5xl w-full">
        {' '}
        {/* Wider max-width for features */}
        {/* Heading - Set initial hidden state */}
        <h2
          ref={headingRef}
          className="text-4xl md:text-5xl font-bold text-slate-800 mb-12 md:mb-16 opacity-0"
          style={{ visibility: 'hidden' }}
        >
          Core Features {/* Placeholder Heading */}
        </h2>
        {/* Features Grid - Set initial hidden state via children */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12"
        >
          {/* Placeholder Feature Item 1 */}
          <div
            className="feature-item bg-white/30 backdrop-blur-sm p-6 rounded-lg shadow-md opacity-0"
            style={{ visibility: 'hidden' }}
          >
            <h3 className="text-xl font-semibold text-slate-700 mb-3">Feature One</h3>
            <p className="text-slate-600 text-sm">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt.
            </p>
          </div>
          {/* Placeholder Feature Item 2 */}
          <div
            className="feature-item bg-white/30 backdrop-blur-sm p-6 rounded-lg shadow-md opacity-0"
            style={{ visibility: 'hidden' }}
          >
            <h3 className="text-xl font-semibold text-slate-700 mb-3">Feature Two</h3>
            <p className="text-slate-600 text-sm">
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo.
            </p>
          </div>
          {/* Placeholder Feature Item 3 */}
          <div
            className="feature-item bg-white/30 backdrop-blur-sm p-6 rounded-lg shadow-md opacity-0"
            style={{ visibility: 'hidden' }}
          >
            <h3 className="text-xl font-semibold text-slate-700 mb-3">Feature Three</h3>
            <p className="text-slate-600 text-sm">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur.
            </p>
          </div>
          {/* Add more feature items as needed */}
          {/* TODO: Replace with actual content */}
        </div>
      </div>
    </section>
  );
}
export default Features;
