// Save as: fixes/fix-event-warnings.js

export default {
  name: 'Fix BeatBus Event Timing Warnings',
  version: '1.0',
  description: 'Adds proper event listener timing',
  
  fixes: [
    {
      file: 'src/theater/TheaterDirector.js',
      description: 'Make prewarm timeout longer',
      fixes: [
        {
          // Increase timeout since WebGL takes time to mount
          find: 'await this.once(EVENTS.PREWARM_COMPLETE, 1000);',
          replace: 'await this.once(EVENTS.PREWARM_COMPLETE, 2000);'
        }
      ]
    },
    {
      file: 'src/components/webgl/WebGLBackground.jsx',
      description: 'Add early listener registration',
      fixes: [
        {
          // Subscribe to events earlier in component lifecycle
          find: '  // Subscribe to BLUEPRINT_READY with deduplication\n  useEffect(() => {',
          replace: `  // Subscribe to BLUEPRINT_READY with deduplication
  // Register immediately to catch early events
  useEffect(() => {`
        }
      ]
    }
  ]
};