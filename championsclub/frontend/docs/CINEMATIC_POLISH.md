# Cinematic fidelity and performance polish

Date: 2026-09-27. Branch: `rebuild/premium-saas`. No commit or push.

## 1. Root causes of washed-out rendering

Two independent defects were visible:

- The shared camera used near `0.0001`, far `250` even in wide shots. This compromised depth precision, causing extensive z-fighting: broken highlights, overlapping panels and noisy engine surfaces. A depth-only browser comparison confirmed that correcting the frustum removed this breakup before any lighting adjustment. Wide car and engine shots now use near `0.1`; only the existing grille approach gradually reduces it to `0.0001`. Camera transforms, scroll boundaries and story are preserved.
- Bright room reflections were combined with strong hemisphere and directional fill, then an engine exposure boost. This raised broad surface brightness and compressed material contrast. Lighting was rebalanced rather than darkening base material colors.

## 2. CSS and global overlay audit

No global CSS filter, saturation/contrast effect, mix-blend-mode or backdrop-filter affects the cinematic. The stage gradient and `::after` gradient are behind the subject. The atmosphere layer has zero opacity. Canvas opacity reaches one after its loading fade; the poster fades out. There is no fog or scene background over the models: alpha compositing places the transparent WebGL canvas over the stage.

The viewport did have a `mask-image` that faded the top/bottom 7% of the subject into the background. Removed it. On portrait screens this exposed existing engine clipping, so the existing aspect-fit multiplier was corrected from `max(1, 1/aspect)` to `max(1, 1.65/aspect)`. Desktop framing at the tested aspect is unchanged; portrait geometry now fits without being faded away.

## 3–4. Color management, tone mapping and exposure

| Setting | Before | After |
| --- | --- | --- |
| Three.js | 0.186.0 | 0.186.0 |
| Output | default sRGB | explicit `SRGBColorSpace` |
| Tone mapper | ACES Filmic | ACES Filmic retained |
| Car exposure | 1.05 | 1.0 |
| Engine exposure | 1.05 → 1.17 during reveal | steady 1.0 |
| Canvas | alpha, default premultiplied compositing | retained; explicit transparent clear |
| Contact-shadow color texture | unspecified | tagged sRGB |

Inspected the installed renderer and GLTFLoader: base-color/emissive textures are sRGB, glTF numeric factors enter as linear, and PMREM supplies the linear lighting environment. No manual gamma conversion, duplicate output pass or CSS color processing was found. Texture metadata and the existing material mapping remain intact. This follows [Three.js color-management guidance](https://threejs.org/manual/pages/color-management.html).

## 5. Lighting changes

| Lighting | Before | After |
| --- | --- | --- |
| Car environment intensity | 1.0 | 0.75 |
| Car hemisphere | 2.0 | 0.35 |
| Car key | 3.0 at (-1,8,1) | 2.4 at (-3,7,4) |
| Car rim/fill | 1.5 | 0.65 |
| Engine environment intensity | 0.85 | 0.70 |
| Engine hemisphere | 1.5 | 0.30 |
| Engine directional lights | 3.6 / 3.0 / 1.4 | 2.4 / 1.1 / 0.35 |

The PMREM RoomEnvironment is retained. There are no external HDR files, ambient lights, spotlights or fog in this cinematic. More directional illumination preserves bright silver highlights while leaving dark material and reflection separation. The standalone Engine Lab lighting was not changed.

## 6. Materials

Preserved paint color `#b7bec7`, metalness 0.82, roughness 0.27, clearcoat 1 and clearcoat roughness 0.18. Car material environment multiplier changed from 1.1 to neutral 1.0. Glass, tires, trim, brake calipers, maps, opacity, emissive values and material classes retain their identity. Engine palette, individual roughness/metalness values and all material assignments are unchanged. No generic material replacement, geometry decimation or asset regeneration.

## 7–8. Lag diagnosis and optimization

The baseline was not GPU-bound on this machine: frame intervals already held around 16.7 ms. The strongest explanation for input delay was the deliberate 55–100 ms progress damping. It is now 35–50 ms, still decelerating after a stop and retaining the existing immediate reversal behavior. A regression test verifies at least 90% response within 150 ms and deterministic settling.

Other verified unnecessary work was removed:

- Reused engine matrices, component offset vectors, cylinder joint arrays and timeline results instead of allocating them each frame.
- Cached rest-pose rod scale; restored rotation without allocating Euler objects.
- Skipped unchanged rig poses; static/cam instance buffers and bounds are no longer rebuilt for piston/crank-only motion.
- Reused background colors and only rewrote the stage gradient/ink when its tone changes.
- Replaced development sample allocation/array shifting with a preallocated ring; removed profiling samples from production.
- Kept long animation frame samples instead of silently excluding intervals over 100 ms; reset the clock on settling so idle time is not mistaken for a dropped frame.
- Warmed engine and handoff shaders and uploaded their buffers with a temporary 64×64 offscreen draw during preload. Both models are ready before entering the engine chapter.
- Ignored redundant resize notifications; handoff projection updates only on aspect change.

## 9–12. DPR, effects, shadows and React

DPR is unchanged: desktop maximum 1.5, narrow screens 1.25. Tested with device scale factor 2: actual renderer DPR stayed 1.5 and the output retained useful detail. No evidence justified reducing geometry or pixel density further.

No postprocessing composer, SSAO, DOF, bloom, motion blur, grading, particles or extra AA passes exist to remove. Native renderer antialiasing is retained. There is one demand-driven cinematic RAF loop and one ScrollTrigger; no per-wheel tween creation or stacked smoothing system.

The car retains one cached 1024×1024 PCF shadow map with `autoUpdate=false`, plus its simple contact shadow. The engine has no shadow-casting lights. The handoff's cloned lights now explicitly disable shadow casting; its single patch does not need a shadow pass.

React already only handled loading/retry status. A browser regression hook measured zero React commits across first handoff, explosion, reconstruction and return. The same canvas and dimensions survived all chapters, with no additional GLB requests. Instancing, semantic groups, optimized GLBs, mechanical linkage and deterministic reverse reconstruction are retained.

## 13. Measurements

Chrome headless, ANGLE Metal on Apple M5 Pro; 1440×900 CSS viewport, device scale 2, actual render DPR 1.5. Same scripted orbit, handoff, mechanism, explosion, reverse and rapid direction-change paths. Figures are observations from local runs, not cross-device guarantees.

| Segment | GPU median before → final (ms) | CPU render-loop median before → final (ms) | Frame p95 before → final (ms) |
| --- | --- | --- | --- |
| Car orbit | 2.21 → 2.18 | 1.00 → 1.10 | 16.7 → 16.8 |
| Handoff | 2.61 → 2.75 | 1.10 → 0.80 | 16.8 → 16.7 |
| Mechanism | 3.99 → 3.26 | 0.90 → 0.80 | 16.7 → 16.7 |
| Explosion | 4.12 → 3.48 | 0.90 → 0.80 | 16.7 → 16.7 |
| Reverse | 2.58 → 2.58 | 1.00 → 0.90 | 16.7 → 16.7 |

GPU timings use `EXT_disjoint_timer_query_webgl2` around individual renderer calls; handoff has two draws, so its figure is per render call, not total GPU time per presented frame. CPU timing is JS submission/update time, not GPU completion. Final run additionally used CPU sampling, which adds some overhead. No FPS increase is claimed: the test was refresh-limited before and after. Rapid switching has only 10 active interval samples and is not a robust throughput benchmark.

Final RAF maximum was about 16.8 ms in every scripted segment; no >50 ms long tasks or page errors were observed. Car draws/triangles remain 170 / 371,831; assembled engine 112 / 572,250 (including the rig's derived joint geometry). No geometry quality was traded for speed.

Final CDP totals over the roughly 12-second scripted run: TaskDuration 0.968 s, ScriptDuration 0.658 s, LayoutDuration 0.003 s, RecalcStyleDuration 0.093 s. The CPU profile sampled 34.2 ms of GSAP self time and 6.4 ms in garbage collection. These are sampled aggregate values, not exact per-callback cost or GC pause lengths. Neither dominated the trace.

Evidence (local, ignored artifacts):

- `artifacts/cinematic/baseline/report.json` and five before screenshots.
- `artifacts/cinematic/final/report.json`, `main-thread.cpuprofile`, five final desktop screenshots and `mobile.png`.
- `scripts/profile-polish.mjs` reproduces the capture/profile against the local dev server: `node scripts/profile-polish.mjs current`.

## 14. Files modified/added

- `src/showcase/studio.js`: explicit color output, lighting, contact texture metadata.
- `src/showcase/carModel.js`: neutral material environment multiplier.
- `src/showcase/createShowcase.js`: depth precision, warmup, caching, resize guard and diagnostics.
- `src/showcase/engineStage.js`: lighting, pose/instance update guard, portrait fit.
- `src/showcase/occlusionHandoff.js`: matching environment, no cloned shadow casters, aspect guard.
- `src/showcase/cinematicTimeline.js`: reusable state and tighter damping.
- `src/showcase/showcase.css`: remove subject fade mask.
- `src/engine-lab/createEngineRig.js`: reusable transform/joint working values.
- `src/engine-lab/kinematics.js`: optional reusable result buffers.
- `src/engine-lab/referenceState.js`: allocation-free Euler restore.
- `scripts/profile-polish.mjs`: reproducible visual/CPU/GPU profiling.
- `tests/cinematic-polish.test.mjs`: response, settling, reversal and loading gate checks.
- `tests/showcase.spec.js`: stable canvas/depth/exposure, no reloads and zero React commits regression.
- `docs/CINEMATIC_POLISH.md`: this report.

## 15. Build and test results

- `npm run build`: passes; Vite reports the large Three.js cinematic chunk (~776 kB, ~215 kB gzip).
- `npm run test:unit`: 9/9 pass.
- `npm run test:engine`: 9/9 pass, including full-cycle linkage, instancing and repeated exact reconstruction.
- `node --test tests/cinematic-polish.test.mjs`: 2/2 pass.
- Existing showcase + Engine Lab Playwright tests: 5/5 pass.
- Added first-handoff/React/canvas regression and repeated mobile check: 2/2 pass. An initial test-harness run failed because the injected DevTools hook lacked the `renderers` map required by Vite Refresh; the hook was corrected and both checks passed.
- Browser visual inspection: hero, side/trim, assembled, pistons/crank area, explosion and portrait engine. No final console errors or error overlay. One canvas; engine ready.
- `git diff --check`: passes.

## 16. Remaining limitations

Physical low-end mobile devices, Safari and high-refresh input hardware were not tested. Browser mobile emulation verifies layout, not phone GPU performance. No baseline CPU sampling trace was collected; before/after CPU values are instrumented loop timings. GPU comparisons are short local runs and include normal variance. The final profiler evaluates warmed scenes; the first-handoff regression verifies correctness/stability, not a cold-cache GPU timing guarantee. Warmup adds some preload work. Source glass uses opacity-based transparency and is preserved. The original loading/fallback poster is unchanged. The existing story, typography, navigation, backend, API and business behavior remain untouched.
