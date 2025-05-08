// src/sections/About.jsx
import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Typewriter from '../ui/Typewriter';

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef();
  const [started, setStarted] = useState(false);

  // trigger typewriter when section enters viewport
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top center',
        onEnter: () => setStarted(true),
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      style={{ padding: '4rem 2rem', color: '#fff', position: 'relative' }}
    >
      {started && (
        <Typewriter text="Beyond code and design lies a journey of transformation." speed={50} />
      )}

      {started && (
        <p style={{ opacity: 0, marginTop: '1rem' }} className="about-copy">
          I served nine years in the United States Marine Corps, where I learned that systems only
          work when they&apos;re built on a strong foundation...
        </p>
      )}

      <style>
        {`
          .about-copy {
            animation: fadeIn 1s ease-out forwards;
            animation-delay: 2s;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(1rem); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </section>
  );
}
