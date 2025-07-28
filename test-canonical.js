// Run in console to verify Canonical bridge
console.log('🧪 Testing Canonical Bridge...');

console.log('Canonical loaded:', window.CANONICAL ? '✅' : '❌');
console.log('Has stages:', window.CANONICAL?.stages ? '✅' : '❌');
console.log('Has dialogue:', window.CANONICAL?.dialogue ? '✅' : '❌');
console.log('Has fragments:', window.CANONICAL?.fragments ? '✅' : '❌');

// Test data completeness
const stageCount = Object.keys(window.CANONICAL?.stages || {}).length;
console.log(`Stages: ${stageCount}/7`);

const hasGenesis = window.CANONICAL?.dialogue?.genesis ? '✅' : '❌';
const hasTranscendence = window.CANONICAL?.dialogue?.transcendence ? '✅' : '❌';
console.log(`Dialogue: Genesis ${hasGenesis}, Transcendence ${hasTranscendence}`);

const fragmentCount = Object.keys(window.CANONICAL?.fragments || {}).length;
console.log(`Fragments: ${fragmentCount}/7`);
