import { useEffect, useState } from 'react';
import { useAtomValue, stageAtom } from '@/state/atoms';
import AmbientFragment from './AmbientFragment.jsx';
import SST from '@/config/sst-loader.js';

/**
 * Renders ambient fragments for the current stage.
 */
export default function AmbientFragmentManager() {
  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
  const [fragments, setFragments] = useState([]);

  useEffect(() => {
    const stageConfig = SST?.stages?.[currentStage];
    const ambient = stageConfig?.memoryFragments?.ambient;

    const toArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      return [value];
    };

    const normalized = toArray(ambient)
      .map((fragment, index) => {
        if (!fragment) return null;
        if (fragment.content) return fragment;

        // Legacy string content / simple shape support
        if (typeof fragment === 'string') {
          return {
            id: `${currentStage}-ambient-${index}`,
            content: { text: fragment },
            trigger: { percent: 0 },
          };
        }

        if (typeof fragment === 'object') {
          const text = fragment.text || fragment.content;
          return {
            ...fragment,
            content:
              typeof fragment.content === 'object'
                ? fragment.content
                : text
                  ? { text }
                  : null,
          };
        }
        return null;
      })
      .filter((fragment) => fragment && fragment.content);

    setFragments(normalized);
    console.log(
      `🗺️ Ambient fragments for ${currentStage}:`,
      normalized.length
    );
  }, [currentStage]);

  if (!fragments.length) return null;

  return (
    <>
      {fragments.map((fragment, index) => (
        <AmbientFragment
          key={fragment.id || `${currentStage}-ambient-${index}`}
          fragment={fragment}
          stage={currentStage}
        />
      ))}
    </>
  );
}
