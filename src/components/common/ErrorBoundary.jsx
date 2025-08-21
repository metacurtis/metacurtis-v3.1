// src/components/ErrorBoundary.jsx
import React from 'react'; // @doctor:4b-disposers
const __doctorDisposers = [];
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { errored: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { errored: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.errored) {
      return (
        <div style={{ color: 'red', padding: 20 }}>
          <h2>Something went wrong in WebGL:</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message}
            {'\n'}
            {this.state.info?.componentStack}
          </pre>
        </div>);

    }
    return this.props.children;
  }
} // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}