// src/components/ui/navigation/StageNavigation.jsx
// ✅ SST v2.0 COMPLIANT: 7-Stage Consciousness Evolution Navigation
// Simple sidebar with seven buttons → updates stage state through unified orchestration

import unifiedNav from '@/theater/UnifiedNavigationAPI';
import { useAtomValue, stageAtom } from '@/state/atoms';

// ✅ SST v2.0: Canonical 7-stage system with correct labels
const STAGES = [
  { id: 'genesis', label: '1983' },
  { id: 'discipline', label: '1983-2022' },
  { id: 'neural', label: '2022' },
  { id: 'velocity', label: 'Feb 2025' },
  { id: 'architecture', label: 'Mar 2025' },
  { id: 'harmony', label: 'Mar 2025' },
  { id: 'transcendence', label: 'Present' },
];

export default function StageNavigation() {
  const currentStage = useAtomValue(stageAtom, state => state.currentStage);

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
            onClick={() => {
              console.log('🎛️ [SIDEBAR NAV]', {
                component: 'StageNavigation',
                targetStage: id,
                method: 'UNIFIED_ORCHESTRATED',
                timestamp: performance.now(),
              });
              unifiedNav.navigateToStage(id, {
                smooth: true,
                skipNarration: false,
                source: 'sidebar',
              });
            }}
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
