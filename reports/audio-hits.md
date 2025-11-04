# Audio Evidence

## Events

### AUDIO_COMPUTER_HUM
- `src/components/theater/OpeningSequence.jsx:164`
- `src/config/canonical/sst-v3.3.json:215`
- `src/theater/bus/schemas.js:119`
- `src/theater/controllers/OpeningSequenceController.js:342`
- `src/theater/events.js:48`

## new Audio(src)

- `src/components/theater/OpeningSequence.jsx:167` src=/audio/computer-hum.mp3

```text
165:         console.log(`   OpeningSequence: Computer hum at volume ${volume}`);
166:         if (!humAudioRef.current) {
167:           humAudioRef.current = new Audio('/audio/computer-hum.mp3');
168:           humAudioRef.current.loop = true;
169:           humAudioRef.current.volume = volume;
```
## .play() calls

- `src/components/theater/OpeningSequence.jsx:57`

```text
55:       // Try to play hum if it exists
56:       if (humAudioRef.current) {
57:         humAudioRef.current.play().catch(() => {});
58:       }
59:     };
```
- `src/components/theater/OpeningSequence.jsx:173`

```text
171:         
172:         if (audioUnlocked.current) {
173:           humAudioRef.current.play().catch(e => 
174:             console.log('Audio playback waiting for user interaction')
175:           );
```
## Unlock gates

- `src/components/consciousness/ConsciousnessTheater.jsx:477`

```text
475:     };
476: 
477:     window.addEventListener('keydown', handleKey);
478:     return () => window.removeEventListener('keydown', handleKey);
479:   }, [isInitialized]);
```
- `src/components/narrative/NarrationController.jsx:943`

```text
941:     };
942: 
943:     window.addEventListener('keydown', keyHandler);
944: 
945:     return () => {
```
- `src/components/theater/OpeningSequence.jsx:61`

```text
59:     };
60: 
61:     window.addEventListener('pointerdown', unlockAudio, { once: true });
62:     window.addEventListener('touchstart', unlockAudio, { once: true });
63:     window.addEventListener('keydown', unlockAudio, { once: true });
```
- `src/components/theater/OpeningSequence.jsx:62`

```text
60: 
61:     window.addEventListener('pointerdown', unlockAudio, { once: true });
62:     window.addEventListener('touchstart', unlockAudio, { once: true });
63:     window.addEventListener('keydown', unlockAudio, { once: true });
64: 
```
- `src/components/theater/OpeningSequence.jsx:63`

```text
61:     window.addEventListener('pointerdown', unlockAudio, { once: true });
62:     window.addEventListener('touchstart', unlockAudio, { once: true });
63:     window.addEventListener('keydown', unlockAudio, { once: true });
64: 
65:     return () => {
```
- `src/components/webgl/WebGLCanvas.jsx:347`

```text
345:     };
346: 
347:     canvas.addEventListener('pointerdown', handlePointerDown);
348:     return () => {
349:       canvas.removeEventListener('pointerdown', handlePointerDown);
```
- `src/theater/TheaterDirector.js:185`

```text
183:     };
184: 
185:     window.addEventListener('keydown', handler, { passive: false });
186:     this._skipListener = handler;
187:   }
```
- `src/utils/webgl/ShaderDebugSystem.js:195`

```text
193:     };
194: 
195:     window.addEventListener('keydown', handleKeyDown);
196:     this.keyboardListeners.push(() => window.removeEventListener('keydown', handleKeyDown));
197:   }
```