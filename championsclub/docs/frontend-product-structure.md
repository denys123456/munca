# ChampionsClub automotive experience

The active frontend is one continuous real-time Three.js scene. A 21,600 px desktop timeline connects 13 stages from the complete vehicle through its mechanical systems and back again. Mobile uses 15,600 px and wider camera framing. The former publication, page turning and paper theme have been removed.

## Scene architecture

- `experience/AutomotiveExperience.jsx` owns lifecycle, loading, accessibility and the composition layers.
- `ExperienceTimeline.js` defines the chapters and a paused GSAP timeline. Lenis and one ScrollTrigger map native document scroll to that timeline. Reversing scroll seeks the same transforms backward.
- `three/createExperienceScene.js` owns one renderer. It draws only after a scroll, resize or data invalidation. No scroll values or camera positions enter React state.
- `CameraRig.js` uses controlled camera positions and targets. Reduced motion fixes the camera while preserving scroll-controlled decomposition and chapter access.
- `LightingRig.js` creates local floating-point studio reflections, key and rim lights plus floor contact shading. No post-processing stack is used.
- `scenes/MechanicalRig.js` animates named vehicle, engine and drivetrain assemblies from their saved rest transforms. The engine remains in the same scene throughout the approach. ECU focus and recognition materials are functions of scroll progress.
- `scenes/ForecastGeometry.js` draws arcs whose lengths come from the active account's actual, forecast and target values.
- `three/AssetPreloader.js` compiles material variants and uploads visible geometry before the loading experience disappears. This avoids first-use stalls during the story.
- `three/PerformanceController.js` caps device pixel ratio and reduces resolution and shadows when sustained moving-frame cost rises.
- `three/ModelLoader.js` loads optional GLTF assets from `public/models/manifest.json`. GLTF, Meshopt, Draco, KTX2 and HDR loaders are requested only when configured. Invalid replacement models are rejected before playback and disclosed in the model information dialog.

The geometry is an original procedural concept study. It is not a photorealistic final automobile or mechanically certified engine. The [asset audit and replacement contract](automotive-assets.md) identify the production assets still required.

## Workspace and identities

The top navigation opens a separate compatible operational workspace at `#/workspace/<page>`. The scene stays mounted and paused underneath, so returning resumes the same position without reloading models. Lists, forms and dialogs use native local scrolling. Old operational URLs redirect to their permitted workspace equivalent.

Jane Doe, Alex Smith and John Doe remain separate persisted demo account identities. Switching identities changes the active data scope, permissions and available routes. It never edits a user's role. All existing sales, reward, target, administration, preferences, notification and search actions remain in the product layer.

## Data integrity

The API adapters, Basic authentication headers and backend contracts are preserved. Without `VITE_API_BASE_URL`, the app explicitly shows seeded demo data. With the variable set, it requests the existing authenticated dashboard endpoint and preserves retry and demo fallback behavior.

The cinematic story reads values from product state. It never estimates an advisor forecast by taking a share of dealership sales. A missing or wrongly scoped service forecast is shown as unavailable. Live advisor contribution lists contain only advisor IDs returned by the service. Intelligence uses service summaries and recommendations when available, with unsupported explanatory fields left unavailable. Demo intelligence remains explicitly labeled.

Operational Conservative and Stretch scenarios remain available as explicitly labeled what-if adjustments. Their arbitrary former probability values have been removed. Historical chart context and confidence regions remain explicitly illustrative. Detailed management features without live write endpoints keep their existing demo-only guards.

## Verification

Run the frontend from `championsclub/frontend`:

```sh
npm install
npm run dev -- --port 5173
```

With the server running:

```sh
npm test
npm run test:data
npm run profile
npm run build
```

The browser suite uses Microsoft Edge. It checks all 13 chapters, exact forward/backward state equivalence, idle rendering, React commits, repeated workspace navigation, mobile framing, reduced motion, context loss and named GLTF replacement/fallback. It also exercises every role's routes at desktop and mobile widths plus sales, targets, reward redemption, intelligence actions, account preferences and administration CRUD.

The data contract tests verify missing service forecasts, scoped advisor forecasts and honest demo provenance. They do not substitute for testing a deployed backend. No live API is configured in this checkout.

`artifacts/automotive/performance.json` contains a local browser profile. Frame timings depend on hardware, browser, capture mode and display refresh rate. The report records scroll-frame timing, long tasks, React commits, draw calls, submitted triangles, memory resource counts and idle frames. Final GLB assets must be profiled again after replacement.
