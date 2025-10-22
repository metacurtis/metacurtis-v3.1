# Audio Evidence

## Events

### AUDIO_COMPUTER_HUM
- `src/components/theater/OpeningSequence.jsx:170`
- `src/config/canonical/sst-v3.3.json:215`
- `src/theater/TheaterDirector.js:656`
- `src/theater/events.js:56`

### AUDIO_KEY_CLICK
- `src/components/theater/OpeningSequence.jsx:186`
- `src/theater/events.js:55`

### AUDIO_START_STAGE
- `src/theater/TheaterDirector.js:827`
- `src/theater/events.js:54`

### AUDIO_CROSSFADE
- `src/theater/events.js:57`

## new Audio(src)

- `src/components/theater/OpeningSequence.jsx:173` src=/audio/computer-hum.mp3

```text
171:         console.log(`   OpeningSequence: Computer hum at volume ${volume}`);
172:         if (!humAudioRef.current) {
173:           humAudioRef.current = new Audio('/audio/computer-hum.mp3');
174:           humAudioRef.current.loop = true;
175:           humAudioRef.current.volume = volume;
```
- `src/components/theater/OpeningSequence.jsx:188` src=/audio/key-click.mp3

```text
186:       BeatBus.on(EVENTS.AUDIO_KEY_CLICK, () => {
187:         if (!keyClickAudioRef.current) {
188:           keyClickAudioRef.current = new Audio('/audio/key-click.mp3');
189:           keyClickAudioRef.current.volume = 0.5;
190:         }
```
## .play() calls

- `src/components/theater/OpeningSequence.jsx:58`

```text
56:       // Try to play hum if it exists
57:       if (humAudioRef.current) {
58:         humAudioRef.current.play().catch(() => {});
59:       }
60:     };
```
- `src/components/theater/OpeningSequence.jsx:128`

```text
126:             if (keyClickAudioRef.current && audioUnlocked.current) {
127:               keyClickAudioRef.current.currentTime = 0;
128:               keyClickAudioRef.current.play().catch(() => {});
129:             }
130: 
```
- `src/components/theater/OpeningSequence.jsx:179`

```text
177:         
178:         if (audioUnlocked.current) {
179:           humAudioRef.current.play().catch(e => 
180:             console.log('Audio playback waiting for user interaction')
181:           );
```
- `src/components/theater/OpeningSequence.jsx:194`

```text
192:         if (audioUnlocked.current) {
193:           keyClickAudioRef.current.currentTime = 0;
194:           keyClickAudioRef.current.play().catch(() => {});
195:         }
196:       }),
```
## Unlock gates

- `src/components/consciousness/ConsciousnessTheater.jsx:475`

```text
473:     };
474: 
475:     window.addEventListener('keydown', handleKey);
476:     return () => window.removeEventListener('keydown', handleKey);
477:   }, [isInitialized]);
```
- `src/components/narrative/NarrationController.jsx:835`

```text
833:     };
834: 
835:     window.addEventListener('keydown', keyHandler);
836: 
837:     return () => {
```
- `src/components/theater/OpeningSequence.jsx:62`

```text
60:     };
61: 
62:     window.addEventListener('pointerdown', unlockAudio, { once: true });
63:     window.addEventListener('touchstart', unlockAudio, { once: true });
64:     window.addEventListener('keydown', unlockAudio, { once: true });
```
- `src/components/theater/OpeningSequence.jsx:63`

```text
61: 
62:     window.addEventListener('pointerdown', unlockAudio, { once: true });
63:     window.addEventListener('touchstart', unlockAudio, { once: true });
64:     window.addEventListener('keydown', unlockAudio, { once: true });
65: 
```
- `src/components/theater/OpeningSequence.jsx:64`

```text
62:     window.addEventListener('pointerdown', unlockAudio, { once: true });
63:     window.addEventListener('touchstart', unlockAudio, { once: true });
64:     window.addEventListener('keydown', unlockAudio, { once: true });
65: 
66:     return () => {
```
- `src/components/ui/AdvancedContactPortal.jsx:179`

```text
177: 
178:     if (isOpen && isContactPortalEnabled) {
179:       document.addEventListener('keydown', handleKeyDown);
180:       document.body.style.overflow = 'hidden';
181:     }
```
- `src/components/webgl/WebGLCanvas.jsx:258`

```text
256:     };
257: 
258:     canvas.addEventListener('pointerdown', handlePointerDown);
259:     return () => {
260:       canvas.removeEventListener('pointerdown', handlePointerDown);
```
- `src/theater/TheaterDirector.js:232`

```text
230:     };
231: 
232:     window.addEventListener('keydown', handler, { passive: false });
233:     this._skipListener = handler;
234:   }
```
- `src/utils/webgl/ShaderDebugSystem.js:195`

```text
193:     };
194: 
195:     window.addEventListener('keydown', handleKeyDown);
196:     this.keyboardListeners.push(() => window.removeEventListener('keydown', handleKeyDown));
197:   }
```