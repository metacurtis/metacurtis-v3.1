# MetaCurtis v3.1

## Opening Sequence Capture

After generating a fresh build, run:

```bash
node tools/capture-opening.mjs
```

The helper spins up the app, restarts the director, and records a 10 s clip from the blackout skip into `docs/assets/opening-genesis.webm`. Drop the clip into your presentations (or rerun the script any time you tweak the emergence handoff).

<video src="./docs/assets/opening-genesis.webm" controls autoplay loop muted width="640">
  <p>Run <code>node tools/capture-opening.mjs</code> to generate the opening-genesis.webm preview.</p>
</video>
