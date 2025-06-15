// src/components/ui/AdvancedContactPortal.jsx
// ✅ CONSOLIDATED ARCHITECTURE - MC3V Digital Awakening Compliant

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNarrativeStore } from '@/stores/narrativeStore';

function AdvancedContactPortal({ isOpen, onClose, triggerStage = 'transcendence' }) {
  const [isVisible, setIsVisible] = useState(false);
  const [_isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '', project: '' });
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle, submitting, success, error
  const portalRef = useRef(null);
  const modalRef = useRef(null);

  // ✅ CONSOLIDATED ARCHITECTURE: Use single source of truth
  const { jumpToStage, isStageFeatureEnabled, currentStage, trackUserEngagement } =
    useNarrativeStore();

  // ✅ FEATURE GATE: Only render if contact portal is unlocked
  const isContactPortalEnabled = isStageFeatureEnabled('contactPortal');

  // Create portal container with defensive mounting
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // ✅ DEFENSIVE: Prevent double-mount edge cases
      let existingPortal = document.getElementById('contact-portal-root');
      if (existingPortal) {
        portalRef.current = existingPortal;
      } else {
        portalRef.current = document.createElement('div');
        portalRef.current.id = 'contact-portal-root';
        portalRef.current.style.position = 'fixed';
        portalRef.current.style.top = '0';
        portalRef.current.style.left = '0';
        portalRef.current.style.width = '100vw';
        portalRef.current.style.height = '100vh';
        portalRef.current.style.zIndex = '9999';
        portalRef.current.style.pointerEvents = 'none';
        document.body.appendChild(portalRef.current);
      }

      return () => {
        if (portalRef.current && document.body.contains(portalRef.current)) {
          document.body.removeChild(portalRef.current);
        }
      };
    }
  }, []);

  // Handle open/close animations
  useEffect(() => {
    if (isOpen && isContactPortalEnabled) {
      setIsVisible(true);
      setIsAnimating(true);

      // ✅ CONSOLIDATED ARCHITECTURE: Use Zustand store for stage transitions
      jumpToStage(triggerStage);

      // ✅ ANALYTICS: Track portal opening in store
      trackUserEngagement('contact_portal_opened', {
        triggerStage,
        currentStage,
        timestamp: Date.now(),
      });

      // ✅ PARTICLE INTEGRATION: Dispatch custom event for WebGL response
      window.dispatchEvent(
        new CustomEvent('contact-portal-open', {
          detail: { triggerStage, currentStage },
        })
      );

      // Enable portal interactions
      if (portalRef.current) {
        portalRef.current.style.pointerEvents = 'auto';
      }

      // Focus management
      setTimeout(() => {
        const firstInput = modalRef.current?.querySelector('input, textarea');
        firstInput?.focus();
      }, 300);
    } else if (!isOpen) {
      setIsAnimating(true);

      // ✅ PARTICLE INTEGRATION: Dispatch close event
      window.dispatchEvent(new CustomEvent('contact-portal-close'));

      setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        if (portalRef.current) {
          portalRef.current.style.pointerEvents = 'none';
        }
      }, 300);
    }
  }, [
    isOpen,
    isContactPortalEnabled,
    triggerStage,
    jumpToStage,
    trackUserEngagement,
    currentStage,
  ]);

  // Keyboard escape handling + basic tab management
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape' && isOpen) {
        // ✅ ANALYTICS: Track escape usage
        trackUserEngagement('contact_portal_escaped', {
          currentStage,
          timestamp: Date.now(),
        });
        onClose();
        return;
      }

      // ✅ ACCESSIBILITY: Basic tab containment within modal
      if (e.key === 'Tab' && isOpen && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    if (isOpen && isContactPortalEnabled) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, isContactPortalEnabled, onClose, trackUserEngagement, currentStage]);

  // Form submission
  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitStatus('submitting');

    // ✅ ANALYTICS: Track form submission attempt
    trackUserEngagement('contact_form_submitted', {
      project: formData.project,
      currentStage,
      formFields: Object.keys(formData).filter(key => formData[key]),
      timestamp: Date.now(),
    });

    // Simulate API call (replace with actual endpoint)
    try {
      console.log('🚀 Contact form submission:', formData);

      // ✅ PARTICLE INTEGRATION: Success burst event
      window.dispatchEvent(
        new CustomEvent('contact-success', {
          detail: { formData, currentStage },
        })
      );

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSubmitStatus('success');

      // ✅ ANALYTICS: Track successful submission
      trackUserEngagement('contact_form_success', {
        project: formData.project,
        currentStage,
        timestamp: Date.now(),
      });

      // Auto-close after success
      setTimeout(() => {
        onClose();
        setSubmitStatus('idle');
        setFormData({ name: '', email: '', message: '', project: '' });
      }, 2000);
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus('error');

      // ✅ ANALYTICS: Track form errors
      trackUserEngagement('contact_form_error', {
        error: error.message,
        currentStage,
        timestamp: Date.now(),
      });

      setTimeout(() => setSubmitStatus('idle'), 3000);
    }
  };

  // Input change handler
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ✅ FEATURE GATE: Don't render if portal not enabled
  if (!isContactPortalEnabled || !portalRef.current || !isVisible) return null;

  const modalContent = (
    <div
      className={`contact-portal ${isOpen ? 'open' : 'closed'}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isOpen ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) {
          // ✅ ANALYTICS: Track backdrop clicks
          trackUserEngagement('contact_portal_backdrop_click', {
            currentStage,
            timestamp: Date.now(),
          });
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="contact-modal"
        style={{
          background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.1), rgba(124, 58, 237, 0.1))',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '600px',
          width: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
          transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h2
            style={{
              color: 'white',
              fontSize: '1.875rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #0D9488, #7C3AED)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Connect with MetaCurtis
          </h2>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1rem',
            }}
          >
            Ready to push the boundaries of what&apos;s possible?
          </p>
          {/* ✅ STAGE CONTEXT: Show current narrative stage */}
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.875rem',
              marginTop: '0.5rem',
            }}
          >
            Current Stage: {currentStage}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {/* Name & Email Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label
                style={{
                  color: 'white',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                  display: 'block',
                }}
              >
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={e => (e.target.style.borderColor = '#0D9488')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)')}
              />
            </div>

            <div>
              <label
                style={{
                  color: 'white',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                  display: 'block',
                }}
              >
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={e => (e.target.style.borderColor = '#7C3AED')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)')}
              />
            </div>
          </div>

          {/* Project Type */}
          <div>
            <label
              style={{
                color: 'white',
                fontSize: '0.875rem',
                marginBottom: '0.5rem',
                display: 'block',
              }}
            >
              Project Type
            </label>
            <select
              value={formData.project}
              onChange={e => handleChange('project', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
              }}
            >
              <option value="" style={{ background: '#1f2937', color: 'white' }}>
                Select project type...
              </option>
              <option value="webgl" style={{ background: '#1f2937', color: 'white' }}>
                WebGL/3D Experience
              </option>
              <option value="ai-collaboration" style={{ background: '#1f2937', color: 'white' }}>
                AI-Enhanced Development
              </option>
              <option value="performance" style={{ background: '#1f2937', color: 'white' }}>
                High-Performance Web App
              </option>
              <option value="consultation" style={{ background: '#1f2937', color: 'white' }}>
                Technical Consultation
              </option>
              <option value="other" style={{ background: '#1f2937', color: 'white' }}>
                Other
              </option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label
              style={{
                color: 'white',
                fontSize: '0.875rem',
                marginBottom: '0.5rem',
                display: 'block',
              }}
            >
              Message *
            </label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={e => handleChange('message', e.target.value)}
              placeholder="Tell me about your vision..."
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
                resize: 'vertical',
                minHeight: '100px',
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitStatus === 'submitting'}
            style={{
              background:
                submitStatus === 'success'
                  ? 'linear-gradient(135deg, #059669, #0D9488)'
                  : submitStatus === 'error'
                    ? 'linear-gradient(135deg, #DC2626, #EF4444)'
                    : 'linear-gradient(135deg, #0D9488, #7C3AED)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: submitStatus === 'submitting' ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: submitStatus === 'submitting' ? 0.7 : 1,
            }}
          >
            {submitStatus === 'submitting' && '⚡ Sending...'}
            {submitStatus === 'success' && '✅ Message Sent!'}
            {submitStatus === 'error' && '❌ Error - Try Again'}
            {submitStatus === 'idle' && '🚀 Launch Collaboration'}
          </button>
        </form>

        {/* Close Button */}
        <button
          onClick={() => {
            // ✅ ANALYTICS: Track manual close
            trackUserEngagement('contact_portal_manual_close', {
              currentStage,
              timestamp: Date.now(),
            });
            onClose();
          }}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: 'white',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={e => (e.target.style.background = 'rgba(255, 255, 255, 0.2)')}
          onMouseLeave={e => (e.target.style.background = 'rgba(255, 255, 255, 0.1)')}
        >
          ×
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, portalRef.current);
}

export default AdvancedContactPortal;

/*
🚀 CONSOLIDATED ARCHITECTURE COMPLIANCE ✅

✅ SINGLE SOURCE OF TRUTH:
- Uses only useNarrativeStore for all state management
- Eliminates deprecated narrativeTransition dependency
- Syncs all navigation through canonical Zustand store

✅ FEATURE GATES:
- Only renders when isStageFeatureEnabled('contactPortal') is true
- Progressive unlocking based on story progression
- Prevents unauthorized access before transcendence stage

✅ ANALYTICS INTEGRATION:
- All user interactions tracked via trackUserEngagement
- Form submissions, escapes, closes logged for insights
- Stage context included in all analytics events

✅ PARTICLE INTEGRATION:
- Dispatches custom events for WebGL system response
- contact-portal-open/close triggers particle effects
- contact-success enables celebration animations

✅ ARCHITECTURAL BENEFITS:
- No state sync conflicts with other components
- Automatic mobile/desktop adaptation via store
- Future-proof for additional narrative features
- Clean separation of concerns

✅ PERFORMANCE:
- Conditional rendering with feature gates
- Proper portal lifecycle management
- Event listener cleanup and memory safety
*/
