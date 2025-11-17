# Audio Evidence

## Events

### AUDIO_COMPUTER_HUM
- `src/components/theater/OpeningSequence.jsx:190`
- `src/config/canonical/sst-v3.3.json:215`
- `src/theater/TheaterDirector.js:1101`
- `src/theater/bus/schemas.js:132`
- `src/theater/events.js:50`

## new Audio(src)

- `src/components/theater/OpeningSequence.jsx:193` src=/audio/computer-hum.mp3

```text
191:         console.log(`   OpeningSequence: Computer hum at volume ${volume}`);
192:         if (!humAudioRef.current) {
193:           const audio = new Audio('/audio/computer-hum.mp3');
194:           audio.preload = 'none';
195:           audio.loop = true;
```
## .play() calls

- `src/components/theater/OpeningSequence.jsx:81`

```text
79:       // Try to play hum if it exists
80:       if (humAudioRef.current) {
81:         humAudioRef.current.play().catch(() => {});
82:       }
83:     };
```
- `src/components/theater/OpeningSequence.jsx:201`

```text
199:         
200:         if (audioUnlocked.current) {
201:           humAudioRef.current.play().catch(e => 
202:             console.log('Audio playback waiting for user interaction')
203:           );
```
## Unlock gates

- `src/components/consciousness/ConsciousnessTheater.jsx:451`

```text
449:     };
450: 
451:     window.addEventListener('keydown', handleKey);
452:     return () => window.removeEventListener('keydown', handleKey);
453:   }, [isInitialized]);
```
- `src/components/narrative/NarrationController.jsx:1066`

```text
1064:     };
1065: 
1066:     window.addEventListener('keydown', keyHandler);
1067: 
1068:     return () => {
```
- `src/components/theater/OpeningSequence.jsx:85`

```text
83:     };
84: 
85:     window.addEventListener('pointerdown', unlockAudio, { once: true });
86:     window.addEventListener('touchstart', unlockAudio, { once: true });
87:     window.addEventListener('keydown', unlockAudio, { once: true });
```
- `src/components/theater/OpeningSequence.jsx:86`

```text
84: 
85:     window.addEventListener('pointerdown', unlockAudio, { once: true });
86:     window.addEventListener('touchstart', unlockAudio, { once: true });
87:     window.addEventListener('keydown', unlockAudio, { once: true });
88: 
```
- `src/components/theater/OpeningSequence.jsx:87`

```text
85:     window.addEventListener('pointerdown', unlockAudio, { once: true });
86:     window.addEventListener('touchstart', unlockAudio, { once: true });
87:     window.addEventListener('keydown', unlockAudio, { once: true });
88: 
89:     return () => {
```
- `src/components/webgl/WebGLCanvas.jsx:347`

```text
345:     };
346: 
347:     canvas.addEventListener('pointerdown', handlePointerDown);
348:     return () => {
349:       canvas.removeEventListener('pointerdown', handlePointerDown);
```
- `src/theater/TheaterDirector.js:348`

```text
346:     };
347: 
348:     window.addEventListener('keydown', handler, { passive: false });
349:     this._skipListener = handler;
350:   }
```
- `src/utils/webgl/ShaderDebugSystem.js:195`

```text
193:     };
194: 
195:     window.addEventListener('keydown', handleKeyDown);
196:     this.keyboardListeners.push(() => window.removeEventListener('keydown', handleKeyDown));
197:   }
```