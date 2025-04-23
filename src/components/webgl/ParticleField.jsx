import FPSCalculator from './FPSCalculator';
import WebGLBackground from './WebGLBackground';
import CanvasSizeUpdater from './CanvasSizeUpdater';
import { QualityProvider } from './QualityController';
import AdaptiveRenderer from './AdaptiveRenderer';

export default function ParticleField(props) {
  return (
    <QualityProvider>
      <AdaptiveRenderer
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}
        camera={{ position: [0, 0, 5], fov: 50 }}
      >
        {/* ← this will drive your performanceStore */}
        <FPSCalculator />

        {/* ← your existing 3D scene */}
        <WebGLBackground {...props} />
        <CanvasSizeUpdater />
      </AdaptiveRenderer>
    </QualityProvider>
  );
}
