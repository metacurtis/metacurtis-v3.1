// Save as: fixes/fix-duplicate-ref.js

export default {
  name: 'Fix Duplicate triggerFragmentRef Declaration',
  version: '1.0',
  description: 'Removes duplicate triggerFragmentRef declaration',
  
  fixes: [
    {
      file: 'src/components/consciousness/ConsciousnessTheater.jsx',
      description: 'Remove duplicate ref declaration',
      fixes: [
        {
          // Remove the duplicate block
          find: `  // Store triggerFragment in a ref to avoid dependency issues
  const triggerFragmentRef = useRef(triggerFragment);
  triggerFragmentRef.current = triggerFragment;

  // Store triggerFragment in a ref to avoid dependency issues
  const triggerFragmentRef = useRef(triggerFragment);
  triggerFragmentRef.current = triggerFragment;`,
          replace: `  // Store triggerFragment in a ref to avoid dependency issues
  const triggerFragmentRef = useRef(triggerFragment);
  triggerFragmentRef.current = triggerFragment;`
        }
      ]
    }
  ],
  
  postApply: async () => {
    console.log('✅ Duplicate removed! Restart dev server: npm run dev');
  }
};