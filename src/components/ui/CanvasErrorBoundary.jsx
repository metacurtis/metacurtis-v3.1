// src/components/ui/CanvasErrorBoundary.jsx
import React from 'react';

export default class CanvasErrorBoundary extends React.Component {
  state = { hasError: false, error: null, info: null };

  static getDerivedStateFromError(err) {
    return { hasError: true, error: err };
  }

  componentDidCatch(err, info) {
    // two separate console.error calls guarantee you actually see them
    console.error('🔥 Canvas subtree error:', err);
    console.error('🛠 React component trace:\n', info.componentStack);
    this.setState({ info });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          color: '#f88',
          padding: 20,
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          zIndex: 9999,
        }}
      >
        <h2>Something went wrong in the 3D scene.</h2>
        <details>
          <summary>JS error & stack</summary>
          <pre>{this.state.error?.stack}</pre>
        </details>
        <details>
          <summary>React component trace</summary>
          <pre>{this.state.info?.componentStack}</pre>
        </details>
      </div>
    );
  }
}
