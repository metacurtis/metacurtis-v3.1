// Add to App.jsx in useEffect:

// Initialize narrative and fragments are loaded
if (window.CANONICAL) {
  console.log('✅ Canonical loaded with:', {
    stages: Object.keys(window.CANONICAL.stages).length,
    dialogue: window.CANONICAL.dialogue ? '✅' : '❌',
    fragments: window.CANONICAL.fragments ? '✅' : '❌'
  });
}
