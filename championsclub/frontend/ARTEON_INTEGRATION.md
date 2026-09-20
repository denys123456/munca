# Arteon cinematic integration

The automotive stage uses the original `arteonCorect.mp4` appearance through a scroll-controlled native-frame image sequence. The source is preserved unchanged: its checkerboard, reflections and shadows remain visible by design. No chroma key, luma key, segmentation, rotoscoping, alpha matte, despill or masking runs in the active pipeline.

## Source and delivery

The source is 1280×720, 10.006 seconds, constant 24 fps, H.264/YUV420P, with 240 decoded video frames and no source alpha. `scripts/process-arteon.mjs` decodes every native frame and writes opaque AVIF desktop/mobile variants without interpolation, cropping, color correction or alpha processing. `public/media/arteon/manifest.json` records source and delivery timestamps, source-frame indices, paths and observed story events.

The timeline includes the complete exterior/orbit footage, hood opening, engine approach, internal mechanisms, decomposition, source dissolve back to the vehicle, hood closure and final vehicle. The source does not contain continuous part-by-part assembly; that limitation is recorded in the manifest.

## Runtime behavior

`createArteonSequence.js` is the only cinematic renderer. It maps scroll progress to manifest timestamps, keeps a stable 16:9 canvas rectangle, presents only complete decoded frames, retains the previous frame during cache misses, aborts obsolete requests and uses a bounded directional cache. The existing scroll controller supplies the target progress; the renderer applies the short bounded inertial settling behavior. There is no autoplay clock or loop wrapping.

## Validation

Run from `championsclub/frontend`:

```text
npm run media:inspect
npm run media:arteon
node scripts/audit-arteon.mjs
npm run build
npm run test:data
```

The audit verifies source hash, 240 manifest entries, monotonic timestamps, referenced files, decodability, dimensions and opaque output for both variants. Browser verification should be performed with the existing agent-browser workflow when a dev server is running.
