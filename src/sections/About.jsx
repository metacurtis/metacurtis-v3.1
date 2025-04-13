// src/sections/About.jsx
import { useRef, useEffect } from 'react'; // Import hooks if needed later

/**
 * Placeholder component for the About section.
 */
function About() {
  const sectionRef = useRef(null);
  useEffect(() => {
    console.log('About Section mounted');
  }, []);

  return (
    <section
      id="about" // ID for scroll navigation
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center items-center text-center py-20 bg-gradient-to-b from-teal-200/70 via-teal-100/50 to-transparent"
    >
      <div className="relative z-10 max-w-4xl px-4">
        <h2 className="text-5xl font-bold text-gray-800 mb-4">About Section</h2>
        <p className="text-xl text-gray-600">
          Placeholder content for the About section. Information about the project will go here.
        </p>
        {/* TODO: Add actual content and animations */}
      </div>
    </section>
  );
}
export default About;
