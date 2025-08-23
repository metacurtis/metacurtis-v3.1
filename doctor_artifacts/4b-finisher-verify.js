
// 4b Finisher Verification — Run in browser console after dev server starts

console.log('=== 4b Finisher Verification ===');
const info = window.BeatBus?.getDebugInfo?.();
console.log('BeatBus debug:', info || '(no getDebugInfo)');

let c = 0;
const h = () => c++;
const off = window.BeatBus?.on?.('FINISHER_TEST', h);
window.BeatBus?.emit?.('FINISHER_TEST', {});
setTimeout(() => {
  console.log('Handler fired count (expect 1):', c);
  off?.();
  console.log('Now make a small code edit to trigger HMR, then run this again — counts should not grow.');
}, 100);
console.log('=== end ===');
