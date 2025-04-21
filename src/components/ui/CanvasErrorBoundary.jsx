// src/components/ui/CanvasErrorBoundary.jsx
import React from 'react';

/**
 * Catches render errors in its subtree (e.g. inside R3F’s Canvas),
 * and displays a fallback UI.
 */
export default class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows the fallback.
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You could log to an external service here
    console.error('Error in Canvas subtree:', error, info);
  }

  render() {
    if (this.state.hasError) {
      // Render any fallback UI you like
      return (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#000',
            color: '#f88',
            padding: 20,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            zIndex: 9999,
          }}
        >
          <h2>Something went wrong in the 3D scene.</h2>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
