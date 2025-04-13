// src/sections/Contact.jsx
import { useRef, useEffect } from 'react'; // Import hooks if needed later

/**
 * Placeholder component for the Contact section.
 */
function Contact() {
  const sectionRef = useRef(null);
  useEffect(() => {
    console.log('Contact Section mounted');
  }, []);

  return (
    <section
      id="contact" // ID for scroll navigation
      ref={sectionRef}
      className="min-h-screen flex flex-col justify-center items-center text-center py-20 bg-gradient-to-b from-rose-200/70 via-rose-100/50 to-transparent"
    >
      <div className="relative z-10 max-w-4xl px-4">
        <h2 className="text-5xl font-bold text-gray-800 mb-4">Contact Section</h2>
        <p className="text-xl text-gray-600">
          Placeholder content for the Contact section. Contact form or info will go here.
        </p>
        {/* TODO: Add actual content and animations */}
      </div>
    </section>
  );
}
export default Contact;
