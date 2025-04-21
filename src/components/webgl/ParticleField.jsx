// src/components/webgl/ParticleField.jsx

import { QualityProvider } from './QualityController';
import AdaptiveRenderer from './AdaptiveRenderer';
import WebGLBackground from './WebGLBackground';
import CanvasSizeUpdater from './CanvasSizeUpdater';

export default function ParticleField(props) {
  return (
    <QualityProvider>
      <AdaptiveRenderer
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1,
        }}
        camera={{ position: [0, 0, 5], fov: 50 }}
      >
        {/* NO useAdaptiveQuality() here */}
        <WebGLBackground {...props} />
        <CanvasSizeUpdater />
      </AdaptiveRenderer>
    </QualityProvider>
  );
}
