// src/sections/Contact.jsx
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger'; // Import ScrollTrigger

// Register ScrollTrigger plugin with GSAP
gsap.registerPlugin(ScrollTrigger);

/**
 * Component for the Contact section with scroll-triggered animations.
 */
function Contact() {
  const sectionRef = useRef(null); // Ref for the main section element (trigger)
  const headingRef = useRef(null); // Ref for the heading
  const contentRef = useRef(null); // Ref for the content container

  useEffect(() => {
    console.log('Contact Section mounted - setting up ScrollTrigger');
    const sectionElement = sectionRef.current;
    // Gather elements to animate
    const headingElement = headingRef.current;
    const contentElement = contentRef.current; // Animating the whole content block together
    const animatedElements = [headingElement, contentElement].filter(Boolean);

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
        stagger: 0.2, // Stagger heading and content block
      });
    } else {
      console.warn('Contact Section: Refs not available for ScrollTrigger setup.');
    }

    // --- Cleanup Function ---
    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.trigger === sectionElement) {
          console.log('Killing Contact Section ScrollTrigger');
          trigger.kill();
        }
      });
    };
  }, []); // Runs once on mount

  return (
    <section
      id="contact" // ID for scroll navigation
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center items-center text-center py-20 md:py-28 lg:py-36 bg-gradient-to-b from-rose-200/70 via-rose-100/50 to-transparent relative overflow-hidden px-4"
    >
      {/* Content wrapper */}
      <div className="relative z-10 max-w-3xl w-full">
        {' '}
        {/* Adjusted max-width */}
        {/* Heading - Set initial hidden state */}
        <h2
          ref={headingRef}
          className="text-4xl md:text-5xl font-bold text-slate-800 mb-8 opacity-0"
          style={{ visibility: 'hidden' }}
        >
          Get In Touch {/* Placeholder Heading */}
        </h2>
        {/* Content Area - Set initial hidden state */}
        <div
          ref={contentRef}
          className="space-y-6 text-lg md:text-xl text-slate-700 opacity-0"
          style={{ visibility: 'hidden' }}
        >
          <p>
            Interested in collaborating or have a question? Feel free to reach out.
            {/* Placeholder intro text */}
          </p>
          {/* TODO: Add actual contact form or contact information */}
          <div className="pt-4">
            <p className="italic text-sm">(Contact Form Placeholder)</p>
            {/* Example simple placeholder */}
            <div className="mt-4 space-y-3 max-w-md mx-auto">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full p-2 border border-slate-300 rounded text-sm"
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full p-2 border border-slate-300 rounded text-sm"
              />
              <textarea
                placeholder="Your Message"
                rows="4"
                className="w-full p-2 border border-slate-300 rounded text-sm"
              ></textarea>
              <button className="px-6 py-2 bg-primary text-white rounded hover:bg-emerald-600 transition-colors duration-200">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default Contact;
