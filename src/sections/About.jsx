// src/sections/About.jsx
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Component for the About section - Background removed.
 */
function About() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const contentP1Ref = useRef(null);
  const contentP2Ref = useRef(null);

  useEffect(() => {
    console.log('About Section mounted - setting up ScrollTrigger');
    const sectionElement = sectionRef.current;
    const animatedElements = [
      headingRef.current,
      contentP1Ref.current,
      contentP2Ref.current,
    ].filter(Boolean);

    if (sectionElement && animatedElements.length > 0 && gsap) {
      gsap.set(animatedElements, { autoAlpha: 0, y: 50 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionElement,
          start: 'top bottom-=150px',
          end: 'bottom top+=150px',
          // markers: process.env.NODE_ENV === 'development',
          toggleActions: 'play none none reverse',
        },
      });
      tl.to(animatedElements, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.2,
      });
    } else {
      console.warn('About Section: Refs not available for ScrollTrigger setup.');
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.trigger === sectionElement) {
          console.log('Killing About Section ScrollTrigger');
          trigger.kill();
        }
      });
    };
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      // REMOVED background gradient classes
      className="min-h-screen flex flex-col justify-center items-center text-center py-20 md:py-28 lg:py-36 relative overflow-hidden px-4"
    >
      <div className="relative z-10 max-w-3xl w-full">
        <h2
          ref={headingRef}
          className="text-4xl md:text-5xl font-bold text-slate-800 mb-8 opacity-0"
          style={{ visibility: 'hidden' }}
        >
          About This Project
        </h2>
        <div className="space-y-4 text-lg md:text-xl text-slate-700 text-left md:text-justify">
          <p ref={contentP1Ref} className="opacity-0" style={{ visibility: 'hidden' }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Phasellus egestas tellus rutrum tellus
            pellentesque eu tincidunt tortor. Elementum sagittis vitae et leo duis ut diam quam.
            Nunc sed id semper risus in hendrerit gravida rutrum. Amet porttitor eget dolor morbi
            non arcu risus quis.
          </p>
          <p ref={contentP2Ref} className="opacity-0" style={{ visibility: 'hidden' }}>
            Mattis rhoncus urna neque viverra justo nec ultrices dui. Nisl tincidunt eget nullam non
            nisi est sit amet. Sed nisi lacus sed viverra tellus in hac habitasse platea. Cras
            semper auctor neque vitae tempus quam pellentesque nec. Feugiat scelerisque varius morbi
            enim nunc faucibus a pellentesque sit.
          </p>
        </div>
      </div>
    </section>
  );
}
export default About;
