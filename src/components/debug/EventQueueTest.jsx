// src/components/debug/EventQueueTest.jsx - Phase 1 Testing Component
import { useInteractionStore } from '@/stores/useInteractionStore';
import { narrativeParticlePresets } from '@/config/narrativeParticleConfig';

export function EventQueueTest() {
  const {
    interactionEvents,
    addInteractionEvent,
    consumeInteractionEvents,
    cleanupProcessedEvents,
  } = useInteractionStore();

  const handleTestEvent = () => {
    // Test adding a simple event
    addInteractionEvent({
      type: 'testEvent',
      position: { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 },
      intensity: 0.5,
      originSection: 'test',
    });
  };

  const handleConsumeEvents = () => {
    const events = consumeInteractionEvents();
    console.log('Consumed events:', events);
  };

  const handleCleanup = () => {
    cleanupProcessedEvents();
  };

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg z-50 max-w-sm">
      <h3 className="text-lg font-bold mb-2">Phase 1 Test Panel</h3>

      <div className="space-y-2 text-sm">
        <div>
          <strong>Event Queue:</strong> {interactionEvents.length} events
        </div>
        <div>
          <strong>Processed:</strong> {interactionEvents.filter(e => e.processed).length}
        </div>
        <div>
          <strong>Pending:</strong> {interactionEvents.filter(e => !e.processed).length}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={handleTestEvent}
          className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
        >
          Add Test Event
        </button>

        <button
          onClick={handleConsumeEvents}
          className="w-full px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
        >
          Consume Events
        </button>

        <button
          onClick={handleCleanup}
          className="w-full px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
        >
          Cleanup Old Events
        </button>
      </div>

      <div className="mt-4 text-xs">
        <strong>Available Presets:</strong>
        <ul className="list-disc list-inside">
          {Object.keys(narrativeParticlePresets).map(preset => (
            <li key={preset} className="text-gray-300">
              {preset}: {narrativeParticlePresets[preset].description}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-2 text-xs text-gray-400">Check console for event logs</div>
    </div>
  );
}

// Optional: Add to your App.jsx temporarily for testing
/*
import { EventQueueTest } from '@/components/debug/EventQueueTest';

function App() {
  return (
    <div className="App">
      <Hero />
      {process.env.NODE_ENV === 'development' && <EventQueueTest />}
      // ... rest of your app
    </div>
  );
}
*/
