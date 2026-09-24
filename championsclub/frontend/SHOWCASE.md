# Vehicle design showcase

Open `/#/showcase`, or follow **Explore the design series** from sign-in or **The design series** from the workspace sidebar. Existing authenticated routes and API calls are unchanged.

## Supplied asset

The project-root `volkswagen-golf-gti-2025.zip` contains `source/golf_gti_my25_lights_on.glb`. It is a **2025 Volkswagen Golf GTI, not an Arteon**. The page deliberately uses the supplied model and its correct name. An Arteon presentation requires an actual Arteon model and retuning the detail shots.

The original GLB was extracted to `.work/car-source/golf-gti.glb`. The optimized, self-contained web asset is `frontend/static/models/golf-gti.glb`. Vite already uses `static` as its public directory; the older `public/models` directory is not served by this app.

- Original: 19,078,056 bytes; optimized: 4,939,040 bytes (74.1% smaller).
- Original geometry: approximately 366,000 triangles, 165 meshes, 52 materials.
- Meshopt compression, deduplication, removal of unused data and exporter metadata, and WebP textures capped at 2048 pixels. No triangle simplification.
- The supplied red paint material is presented in silver in `carModel.js`; other materials, GTI details, and interior geometry are retained.
- Glass and light appearance come from the supplied model. There are no mechanical or articulated animations. The closeups are exterior views; they are not intended for macro inspection of interior stitching or badges.
- `golf-gti-poster.webp` is a capture of this actual model for loading and failure states.

## Implementation

`src/showcase/Showcase.jsx` owns the page and lifecycle. The separate `createShowcase.js` module loads Three.js and GSAP only after entering this route. `studio.js` builds the lighting, environment reflections, and static shadows. `carModel.js` loads and normalizes the model to a 4.5-unit length with its tires on the ground. `scrollTimeline.js` owns the camera choreography and text transitions. All CSS is scoped to the showcase.

The native scroll area spans 650 viewport heights on desktop and 550 on mobile. A sticky stage remains in view; GSAP ScrollTrigger uses a 1.15-second scrub to ease into the scroll position:

1. 0–14%: front three-quarter reveal and gentle approach.
2. 14–58%: complete 360-degree orbit.
3. 58–82%: front grille/light composition, then a front wheel and body-line closeup.
4. 82–100%: pull back into a final front three-quarter composition and hold.

The camera stays upright, with a fixed field of view and aspect-aware framing. Chapter buttons and workspace links work with the keyboard. Reduced motion presents a static, single-screen composition and responds to live preference changes.

Rendering is requested only when the camera changes, the viewport resizes, or visibility resumes; it stops at rest and is capped at 60 fps. Pixel ratio is capped at 1.5. Shadows are generated once. Model fetches are cancellable, failed loads show the poster with retry, and route cleanup disposes the model, textures, renderer, observers, and animation timeline.

## Reproduce and verify

Run from `championsclub/frontend`:

```powershell
node scripts/prepare-showcase.mjs ../../.work/car-source/golf-gti.glb
npm run dev
node scripts/capture-showcase.mjs
node scripts/profile-showcase.mjs
npx playwright test tests/showcase.spec.js
npm run test:unit
npm run build
```

Capture and profiling scripts expect a local Vite server on port 5173. Browser tests cover loading isolation, forward/reverse scrolling, scrub inertia, idle rendering, route cleanup/re-entry, mobile framing, reduced motion, model failure/retry, and lost WebGL context. Captures are written under `artifacts/`.

The Three.js/GSAP chunk is lazy-loaded and currently exceeds Vite's 400 kB advisory threshold; it is roughly 208 kB gzipped. It is not requested by the existing workspace. Frame timings depend on the GPU and browser; the local desktop profile is not a guarantee for all devices. Live backend business workflows were not exercised for this frontend-only change.

Local Chrome validation at 1440 × 900: 479 rendered frames during an eight-second scroll, 16.7 ms median render interval, 16.8 ms 95th percentile, and zero long tasks over 50 ms. The browser suite also confirms zero additional draw calls after the animation settles. Production build and all six existing frontend unit tests pass.
