export default {
  name: 'Fix Director Remount Issue',
  version: '1.0',
  description: 'Fixes infinite remount in ConsciousnessTheater',
  
  fixes: [
    {
      file: 'src/components/consciousness/ConsciousnessTheater.jsx',
      description: 'Remove problematic useEffect dependencies',
      fixes: [
        {
          find: '  // ===== DIRECTOR INTEGRATION =====',
          replace: `  // Store triggerFragment in a ref to avoid dependency issues
  const triggerFragmentRef = useRef(triggerFragment);
  triggerFragmentRef.current = triggerFragment;

  // ===== DIRECTOR INTEGRATION =====`
        },
        {
          find: 'triggerFragment(fragment.id)',
          replace: 'triggerFragmentRef.current(fragment.id)'
        },
        {
          find: '}, [directorStarted, triggerFragment]);',
          replace: '}, []); // Empty dependency array - only run once on mount'
        }
      ]
    }
  ],
  
  postApply: async () => {
    console.log('✅ Fix applied! Restart dev server: npm run dev');
  }
};
