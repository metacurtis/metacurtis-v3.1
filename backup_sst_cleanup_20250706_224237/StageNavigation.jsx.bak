// src/components/ui/navigation/StageNavigation.jsx
// Simple sidebar with five buttons → updates narrativeStore.

import { useNarrativeStore } from '@/stores/narrativeStore';

const STAGES = [
  { id: 'genesis', label: '1983' },
  { id: 'silent', label: '1983-2022' },
  { id: 'awakening', label: '2022' },
  { id: 'acceleration', label: 'Feb 2025' },
  { id: 'transcendence', label: 'Mar 2025' },
];

export default function StageNavigation() {
  const currentStage = useNarrativeStore(s => s.currentStage);
  const setStage = useNarrativeStore(s => s.setStage);

  return (
    <ul
      style={{
        position: 'fixed',
        top: '50%',
        right: '1rem',
        transform: 'translateY(-50%)',
        zIndex: 22,
        listStyle: 'none',
        padding: 0,
        margin: 0,
      }}
    >
      {STAGES.map(({ id, label }) => (
        <li key={id} style={{ margin: '.5rem 0' }}>
          <button
            onClick={() => setStage(id)}
            style={{
              background: id === currentStage ? '#0D9488' : 'transparent',
              border: '1px solid #0D9488',
              color: id === currentStage ? '#fff' : '#0D9488',
              padding: '.25rem .5rem',
              fontSize: '.75rem',
              cursor: 'pointer',
              transition: 'all .2s',
            }}
          >
            {label}
          </button>
        </li>
      ))}
    </ul>
  );
}
