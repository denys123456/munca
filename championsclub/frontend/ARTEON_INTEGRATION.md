Arteon cinematic integration
============================

The existing automotive stage now displays the supplied footage through a transparent Canvas image sequence. The existing navigation, typography, colors, data panels, workspace routes and application services remain in place. No replacement vehicle, generated animation, experimental route or autoplay was added.

Source inspection
-----------------

| Property | Observed value |
| --- | --- |
| Original source | `C:/Users/Jitu/OneDrive/Desktop/proiect munca/arteon.mp4` |
| Matching source videos found | One |
| Source SHA-256 | `86224d48e388fd2b1408d9841b3fa42de3da403f5061fa56bd37374a4fae1cf1` |
| File size | 5,272,371 bytes |
| Video / container duration | 10.000 / 10.006 seconds |
| Resolution / frame rate | 1280 × 720 / 24 fps |
| Codec / pixel format | H.264 High / yuv420p, no source alpha |
| Frames | 240; last frame timestamp 9.958333 seconds |
| Audio | Original AAC preserved in the source; not used for scroll playback |

FFprobe inspected the source. FFmpeg decoded every source frame, without temporal resampling. The source is never written to, moved, or deleted. Its hash is checked again after processing and during the asset audit.

The approximate observed events, frame ranges, chapter anchors, source metadata, resolutions and byte totals are recorded in `public/media/arteon/manifest.json`:

| Source seconds | Observed event |
| --- | --- |
| 0–3.75 | Complete car and vehicle orbit |
| 3.75–4.625 | Hood opening |
| 4.625–6.0 | Camera approaches and enters the engine bay |
| 6.0–6.5 | Baked dissolve into exploded internals |
| 6.5–7.875 | Moving pistons, crankshaft, valves and separated mechanical parts |
| 7.875–8.375 | Baked dissolve back to the open-hood car |
| 8.375–8.958 | Hood closes as the camera withdraws |
| 8.958–10.0 | Complete vehicle through the final frame |

The clip shows the exploded assembly and returns to a complete car. It does **not** contain a continuous camera traversal through internal geometry or explicit part-by-part reconstruction. These missing actions have not been fabricated. The opening and ending compositions are similar, but position, scale and body details differ slightly: this is not a verified seamless loop. The renderer holds frame 239 until the user scrolls backward or explicitly selects “Retrace the journey.”

Processing and format
---------------------

Green exterior footage receives an RGB chroma matte with dark-surface protection and despill. The neutral gray gradient in the exploded-engine shots receives a separately fitted spatial difference matte. Transition-specific thresholds handle the source's mixed plates. A small median filter and subpixel alpha refinement reduce compressed chroma stair-steps. Edge luminance is decontaminated without amplifying chroma noise.

Downsampled RGB receives a second despill pass. WebP uses compressed RGB and lossless alpha; individual frames use near-lossless or lossless RGB when lossy encoding would reintroduce visible green excess. Genuine transparent pixels are encoded, rather than hiding a plate with a matching website background. Entirely opaque engine-bay macro frames can legitimately omit WebP's alpha chunk because real engine geometry fills the source frame.

All 240 frames are delivered at 1280 × 720 and at 640 × 360: 480 production WebP files plus a manifest. Each client selects one resolution. The desktop sequence is 22,557,134 bytes; mobile is 15,366,340 bytes. Total production assets, including the manifest: **37,926,650 bytes (37.93 MB / 36.17 MiB)**. Asset totals are generated in the manifest and independently recomputed by `scripts/audit-arteon.mjs`.

WebP was selected for independent frame access, alpha, predictable reversal and measured decoding performance. AVIF was considered but not separately benchmarked. Alpha video and ordinary video seeking were not used: they would add codec/seek behavior to validate without improving exact scroll addressing. No PNG sequence, video duplicate, FFmpeg binary or inspection screenshot is part of the production assets.

Rendering and loading
---------------------

The existing Lenis/GSAP ScrollTrigger is the sole scroll controller. A sticky fullscreen stage occupies a 1000svh section, providing approximately **900svh of scroll travel**. Movie progress is linear: `Math.round(clamp(progress, 0, 1) * 239)`. UI chapters have separate source-derived positions, so the surrounding story follows the actual footage without retiming or skipping frames.

The Canvas draws only when its displayed source index changes or it needs resizing/restoration. No frame state is stored in React. It contains the original 16:9 image, never stretches it, and never enlarges beyond the selected asset's native width. Engine framing moves within the existing stage to preserve text and telemetry legibility. Source macro cropping is retained.

The first requested frame has priority. A direction-aware queue loads nearby frames with 3 desktop or 2 compact-device requests in flight. The cache holds at most 28 desktop or 24 mobile decoded frames (98.4 MiB / 21.1 MiB of estimated RGBA pixel storage, excluding temporary in-flight decodes and Canvas; browser-internal GPU copies were not directly measured). Eviction protects the planned preload window, preventing repeated decoding of frames about to be used. Evicted [ImageBitmaps are explicitly closed](https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap/close).

Only the newest requested index can replace the displayed bitmap. Cache misses retain the last complete image. Obsolete requests are aborted; listeners, observers, requests, bitmaps and animation callbacks are disposed on unmount. There is no autonomous movie clock or continuous Canvas render loop. The pre-existing Lenis ticker remains responsible for scrolling.

Small screens, Save-Data, and reported low-memory devices select 640 × 360 assets. Reduced motion shows static source chapter frames without continuous mechanical scrubbing; chapter navigation, the final state and workspace entry remain available. Media-load errors and Canvas loss provide an operational workspace exit.

Validation and limits
--------------------

Validation commands from `championsclub/frontend`:

```text
npm run media:inspect
npm run media:arteon
node scripts/audit-arteon.mjs
npm run build
npm run test:data
npx playwright test --reporter=list --output=artifacts/arteon/test-results
node scripts/profile-arteon.mjs
git diff --stat
git diff --check
```

`artifacts/arteon/` contains local source contacts, transparency contacts, desktop/mobile screenshots, the per-frame pixel audit and performance measurements. It is ignored by Git. Browser checks use the existing page in headless Microsoft Edge. Automated tests cover frame progression, reversal, idle/final hold, no React commits during scrolling, delayed frame races, cache bounds, reduced motion, mobile touch, contrasting backgrounds, error fallback, chapter navigation and workspace round trips. The existing application regression tests cover accounts, roles, routes, recorded sales, targets, forecasts, AI insights, rewards and administration. This is frontend verification with the existing demo workspace; no live backend deployment or real mobile hardware was exercised.

Final results: production build passed; **21/21 Playwright tests and 3/3 data-contract tests passed**. All 480 asset variants passed the size, alpha/geometry and green-spill audit. The source hash is unchanged. The spill criterion is alpha > 80/255 and green > max(red, blue) + 12: zero qualifying pixels remained. This numerical check supplements visual inspection; it does not prove perfect extraction of every surface. `git diff --stat` and `git diff --check` were inspected; all modified and new files are within the listed integration scope, and no temporary inspection output is staged.

The final 1440 × 900 local headless Edge profile recorded zero long tasks, zero frame intervals over 50 ms, zero idle Canvas draws and zero page errors. Canvas draw maximum was 2.1 ms; bitmap decode mean/max were 10.72/24.4 ms. The bounded cache ended at 28 bitmaps (103,219,200 estimated decoded bytes), with a 5,184,000-byte Canvas buffer. The forward/reverse run decoded 389 images, compared with 1,080 before the preload-window eviction correction. These are local measurements, not a guarantee of identical behavior on other hardware or networks.

The source has only 720p detail and retains its original baked watermark. The cross-dissolves mix vehicle, engine and background into opaque pixels; the derived mattes around these transitions remain approximate. Some fine gray-on-gray mechanical edges retain a light fringe, particularly on dark backgrounds; compressed shadows can retain uneven edges. This integration does not claim production-rotoscoping perfection. Slow uncached network jumps can briefly hold the preceding complete frame. Actual Safari/Firefox playback and low-end physical devices have not been profiled.

Files in scope
--------------

- `src/experience/AutomotiveExperience.jsx`: replace the procedural renderer and update source disclosure/fallback copy.
- `src/experience/createArteonSequence.js`: Canvas, loading, caching, accessibility, diagnostics and cleanup.
- `src/experience/arteonTimeline.js`: source frame mapping and chapter anchors.
- `src/experience/useScrollTimeline.js`: connect existing UI chapters to source positions.
- `src/styles/experience.css`, `src/styles/experience-responsive.css`: cinematic scroll distance only.
- `public/media/arteon/`: production manifest and two compressed sequences.
- `scripts/inspect-arteon.mjs`, `scripts/preview-arteon.mjs`: source inspection and matte contacts.
- `scripts/arteon-matte.mjs`, `scripts/encode-arteon.mjs`, `scripts/process-arteon.mjs`: reproducible offline processing.
- `scripts/audit-arteon.mjs`, `scripts/profile-arteon.mjs`: asset and browser performance evidence.
- `tests/experience.spec.js`: replace obsolete procedural-model assertions with actual media integration tests.
- `tests/workflows.spec.js`: align the existing sales-to-cinematic-data check with its new source chapter position.
- `package.json`, `package-lock.json`: media commands and development-only processing tools.
- `.gitignore`, `ARTEON_INTEGRATION.md`: local evidence exclusion and this report.

No Java, Spring, Python ML, database, authentication, permissions, business calculations or application CRUD implementation was edited.
