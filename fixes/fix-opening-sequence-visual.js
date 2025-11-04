// Save as: fixes/fix-opening-sequence-visual.js

export default {
  name: 'Fix Opening Sequence Visual Alignment',
  version: '1.0',
  description: 'Align opening sequence with SST v3.0 exact specifications',
  
  fixes: [
    {
      file: 'src/theater/TheaterDirector.js',
      description: 'Fix timing to match SST v3.0 (8 seconds total)',
      fixes: [
        {
          find: '    await this.sleep(3000);',
          replace: '    await this.sleep(2000); // SST v3.0: 2 seconds black'
        },
        {
          find: '    await this.sleep(2500);',
          replace: '    await this.sleep(2000); // SST v3.0: 2 seconds cursor'
        },
        {
          find: '    await this.sleep(3000);',
          replace: '    await this.sleep(2500); // SST v3.0: 2.5 seconds typing'
        }
      ]
    },
    
    {
      file: 'src/components/theater/OpeningSequence.jsx',
      description: 'Ensure opening sequence is visible and styled correctly',
      fixes: [
        {
          find: '    backgroundColor: \'#000000\',',
          replace: '    backgroundColor: \'#000000\',\n    zIndex: 10000, // Ensure on top'
        },
        {
          find: '        color: \'#00FF00\',',
          replace: '        color: \'#00FF00\', // SST v3.0 Commodore green\n        fontSize: \'2.5rem\', // Bigger for impact'
        }
      ]
    },
    
    {
      file: 'src/components/consciousness/ConsciousnessTheater.jsx',
      description: 'Ensure opening sequence renders on top',
      fixes: [
        {
          find: '      {/* Director-controlled Opening Sequence */}\n      <OpeningSequence />',
          replace: '      {/* Director-controlled Opening Sequence - MUST BE ON TOP */}\n      <div style={{ position: \'fixed\', top: 0, left: 0, width: \'100%\', height: \'100%\', zIndex: 9999 }}>\n        <OpeningSequence />\n      </div>'
        }
      ]
    }
  ],
  
  postApply: async () => {
    console.log('\n✅ Opening sequence alignment fixed!');
    console.log('\n🎬 The opening should now show:');
    console.log('   1. Black screen (2s)');
    console.log('   2. Green cursor blinks (2s)');
    console.log('   3. Types "HELLO CURTIS" (2.5s)');
    console.log('   4. Screen fills with text (1.5s)');
    console.log('   5. Particles emerge');
    console.log('\n🔄 Restart dev server to see the opening!');
  }
};