// src/components/dev/BurstDebugMonitor.jsx - Visual Debug for Particle Effects
import { useInteractionStore } from '@/stores/useInteractionStore';
import { useState, useEffect } from 'react';

export function BurstDebugMonitor() {
  const { interactionEvents } = useInteractionStore();
  const [recentBursts, setRecentBursts] = useState([]);

  // Track recent burst events
  useEffect(() => {
    const letterClickEvents = interactionEvents.filter(e => e.type === 'letterClick').slice(-5); // Last 5 letter clicks

    const burstEvents = interactionEvents
      .filter(e => e.type === 'interactionBurst' && e.intensity > 0.5)
      .slice(-5); // Last 5 high-intensity bursts

    setRecentBursts([...letterClickEvents, ...burstEvents]);
  }, [interactionEvents]);

  return (
    <div className="fixed top-4 left-4 bg-black/90 text-white p-4 rounded-lg z-50 max-w-md text-xs">
      <h3 className="text-lg font-bold mb-2 text-yellow-400">🌟 Particle Burst Debug</h3>

      <div className="space-y-2 mb-4">
        <div>
          <span className="text-blue-300">Total Events:</span> {interactionEvents.length}
        </div>
        <div>
          <span className="text-green-300">Recent High-Intensity Bursts:</span>{' '}
          {recentBursts.length}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-md font-semibold text-purple-300">Recent Effects:</h4>
        {recentBursts.slice(-3).map(event => (
          <div key={event.id} className="border border-gray-600 p-2 rounded">
            <div className="flex justify-between">
              <span
                className={`font-bold ${
                  event.type === 'letterClick' ? 'text-yellow-300' : 'text-purple-300'
                }`}
              >
                {event.type === 'letterClick' ? `Letter ${event.letterIndex} Click` : 'Hover Burst'}
              </span>
              <span className="text-gray-400">{event.intensity?.toFixed(2) || 'N/A'}</span>
            </div>
            {event.letterIndex !== undefined && (
              <div className="text-sm text-gray-300">
                Letter: {['M', 'C', '3', 'V'][event.letterIndex]} → {event.targetSection}
              </div>
            )}
            <div className="text-xs text-gray-400">
              Age: {((performance.now() - event.timestamp) / 1000).toFixed(1)}s
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-2 bg-gray-800 rounded text-xs">
        <div className="text-yellow-300 font-bold mb-1">What to Look For:</div>
        <div>
          • <span className="text-yellow-300">Letter Clicks</span>: Large golden stars (intensity
          0.6)
        </div>
        <div>
          • <span className="text-purple-300">Hover Bursts</span>: Purple waves (intensity ~0.2-0.3)
        </div>
        <div>
          • <span className="text-green-300">Constellation</span>: 8-pointed star shapes
        </div>
        <div>
          • <span className="text-blue-300">Glow</span>: Bright halos around special particles
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 border-t border-gray-600 pt-2">
        Enhanced effects: Bigger particles (4x), brighter colors, 8-pointed stars
      </div>
    </div>
  );
}

// Add this to your App.jsx temporarily:
/*
import { BurstDebugMonitor } from '@/components/dev/BurstDebugMonitor';

function App() {
  return (
    <div className="App">
      <Hero />
      {process.env.NODE_ENV === 'development' && <BurstDebugMonitor />}
      // ... rest of your app
    </div>
  );
}
*/
