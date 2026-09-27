# Engine preparation and mechanical animation lab

The isolated lab is implemented at `/#/engine-lab` in development or an explicit `engine-lab` build. It is absent from normal production routing and navigation. The homepage and backend are unchanged. No commit or push was made.

**Mechanical status: partially working.** The measured offset slider-crank closes continuously and all four pistons move on parallel axes. The source is a stylized cutaway, with a continuous central shaft and insufficient internal clearances. Surface intersections remain. This is a working diagnostic and presentation lab, not a collision-free production engine.

## A. Source asset

- Original: `C:/Users/Jitu/OneDrive/Desktop/New folder/proiect munca/car_engine.glb`.
- Size: **63,660,668 bytes / 60.71 MiB**.
- Triangles: **1,398,824**; vertices: **1,487,959**.
- 297 nodes, 160 mesh nodes, 160 mesh definitions, 160 primitives, 10 materials.
- No textures, animations, skins, or morph targets.
- SHA-256: `e5f57852816fcfbccf734599400b8d3adc53122a112f7078466d29f879e995e2`.
- Hash checked by preparation and tests. Git reports no source-asset changes.

The source is read only. The derived GLB, manifest, and collision report live in `static/models/engine/`. Preparation refuses the known mapping if source mesh or triangle counts change. All 297 original nodes retain source index/name metadata.

## B. Semantic component map

The complete mapping, source transforms, measured endpoints, and individual optimization decisions are in [engine-manifest.json](../static/models/engine/engine-manifest.json). The 123 top-level source assemblies are each assigned exactly once; their descendants cover all 160 meshes.

| Semantic component | Original assemblies |
| --- | --- |
| EngineRoot | Runtime wrapper around the preserved scene hierarchy |
| EngineBlock | Frame.001_89 |
| LowerStructure | Frame.000_85, Frame.002_90 |
| PistonGroup01–04 | Cylinder.001_68, Cylinder.002_69, Cylinder.004_71, Cylinder.005_72, each retaining its body and ring descendants |
| ConnectingRod01–04 | Drijfstang_79, Drijstang1_81, Drijfstang.001_80, Drijstang1.001_82, ordered along cylinder Z |
| CrankshaftGroup | Circle.001_30 through Circle.015_44, including Circle.003_32 |
| CamshaftIntakeGroup | Cube.003_57, Cube.004_58, Cube.005_59, Cube.011_65, Cube.012_66 |
| CamshaftExhaustGroup | Cube.006_60, Cube.007_61, Cube.008_62, Cube.009_63, Cube.010_64 |
| ValveGroups | Klep1.001_91 through Klep1.016_106 |
| FlywheelGroup | Schijf_153 |
| GearGroups | Tandwiel_154 through Tandwiel.003_157, Cube.002_56, Cylinder.003_70 |
| PulleyGroups | Circle.018_51, Circle.020_52, Circle.021_53, Circle.022_54 |
| PipeGroups | Circle_29, Circle.017_45, NurbsPath.020_126 through NurbsPath.038_144, Pijpje_145 through Pijpje.003_148 |
| TimingChainGroup | Schakel1_151, Schakel1.001_152, BezierCircle.001_2, BezierCurve_3, BezierCurve.003_4 |
| AccessoryGroups | 24 bolts plus Cube_55, Cube.013_67, Cylinder.007_77, Cylinder.009_78, Plane.002_149, Plane.004_150 |

Geometric checks use surface-normal circle fits, world bounds, axial positions, and hierarchy membership. The complete engine and isolated linkage were visually inspected. Bore centers are inferred from the midpoints of paired cutaway opening arcs, not measured from complete liners. Intake/exhaust labels are provisional bank aliases; the model does not establish flow direction. Generic accessories remain conservative aliases rather than unverified functional names.

## C. Mechanical setup

All values below are **source scene units**, not certified metres or millimetres.

- Crank axis: world **+Z**, through **(-0.18013035, -6.24422683, 0)**. The primary shaft surface fit has 2,110 supporting normal-pair votes.
- Cylinder movement: world **+Y**, supported by the block's vertical cutaway arcs and the piston cylindrical surface fit. Local piston +Y has over 2,000 supporting votes. Crown normals point +Y.
- Bore-center X: 0.836378, 0.836946, 0.836623, 0.836455.
- Bore-center Z: -0.119286, -2.639334, -5.159489, -7.679042. Cylinder spacing remains approximately 2.520 units.
- Corrected original piston tilts: 1.06728°, 1.62666°, 1.06728°, 1.62666°.
- Transverse X corrections: 0.83638, 0.18809, 0.83662, 0.18759. Z corrections: 0.09167, 0.03601, 0.08976, 0.03604. These substantial corrections are evidence of source inconsistency, not manufacturing tolerances.
- Local piston wrist point: approximately (0, 0.028490, 0). The stylized pin-opening fit is weak; this endpoint is an approximation constrained to the piston centerline.
- Rod pivots use fitted small-end and big-end centers, not exported origins. Local hinge direction is +Z. The manifest retains original rod matrices and both endpoints.

| Cylinder | Crank radius | Rod length | Prepared phase | TDC angle | BDC angle | Wrist Y at TDC / BDC |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 01 | 1.358294 | 3.861445 | 0° | 11.23° | 203.96° | -1.124423 / -3.956767 |
| 02 | 1.331238 | 3.858670 | 180° | 191.30° | 23.73° | -1.154953 / -3.930471 |
| 03 | 1.358294 | 3.861445 | 180° | 191.23° | 23.97° | -1.124472 / -3.956875 |
| 04 | 1.331238 | 3.858670 | 0° | 11.30° | 203.72° | -1.154855 / -3.930255 |

The source throws point upward at approximately +30° and -29°; they do not describe a conventional inline-four crank. The derived setup explicitly rephases the existing throw pieces to 0/180/180/0, aligns them with cylinder centers, straightens the counterweight planes, and leaves a 0.50-unit gap around rods of approximately 0.444-unit thickness. It retains the two measured radii. This is a documented preparation decision, not a claim that the source already had this phase arrangement or an established firing order.

All 15 crank parts use the same pivot transform after preparation. Their relative matrices remain constant through the entire cycle. The flywheel is recentered onto the measured shaft and rotates at the same angle. Separate removable journal sleeves and wrist pins bridge source joint gaps; no source hero geometry is merged or cut.

For each cylinder, the solver calculates the journal on its crank circle, solves the positive slider intersection `wristY = journalY + sqrt(rodLength² - transverseOffset²)`, then aligns the rod between those endpoints. It does not use independent piston sine waves. The full 0–360° cycle passes closure and parallel-axis tests; maximum measured endpoint error is **2.74e-15 units**. Analytic offset-slider dead centers are checked against 1,440 angle samples per cylinder.

Cam bank centers are approximately (1.323323, 2.326678) and (-0.668292, 2.326682), with +Z axes. Cams, valves, springs, and timing chain remain static. No cam timing or spring deformation is claimed.

## D. Optimization

| Metric | Source | Derived / rendered lab |
| --- | ---: | ---: |
| Asset triangles | 1,398,824 | **567,312** |
| Full lab triangles, including eight joint helpers | — | **568,464** |
| Primitive submissions before batching | 160 | 160 asset + 8 helpers |
| Measured full lab draw calls | — | **112**, reduced from 168 before instancing |
| GLB bytes | 63,660,668 | **5,996,832** |
| GLB MiB | 60.71 | **5.72** |
| Unique mesh definitions | 160 | **75** |

| Selectively simplified detail | Before triangles | After triangles |
| --- | ---: | ---: |
| Timing chain meshes | 732,600 | 117,429 |
| Valve assemblies, including springs | 227,584 | 63,696 |
| Bolts | 118,692 | 66,239 |

Applied: removal of unused UVs, welding, selective normal-aware Meshopt simplification, geometry/accessor deduplication, index reordering, and Meshopt buffer compression. Float position attributes are retained; the extension's QUANTIZE encoder mode does not itself apply a position quantization transform here. Every hero mesh retains its triangle count. Error bounds prevented some bolt meshes from reaching the requested reduction ratio.

Runtime hardware instancing creates 16 batches and saves 56 draw calls. Only identical geometry/material pairs within a semantic component are batched; mirrored transforms are excluded. Original nodes remain available for matrices and inspection, while their duplicate raster submissions are disabled. Instance matrices and visibility follow the canonical nodes during reconstruction. No animation assembly is merged away.

Draco was not combined with Meshopt because a second geometry codec adds decode/deployment complexity without a demonstrated need at 5.72 MiB. Static merging was avoided because the semantic inspector and staged separation need the current boundaries. No invisible or back-facing geometry was removed on an unproven assumption. No texture project was introduced.

Materials use restrained metalness/roughness variations, graphite casting, dark technical materials, silver machined parts, and existing warm metal accents. A generated studio environment provides reflections; soft key, rim, and fill lights keep cavities readable.

## E. Piston animation and remaining geometry problems

**Partially working:** continuous linkage, corrected parallel piston travel, proper rod pivots, rigid crank rotation, and flywheel coupling work. Full geometric clearance does not pass.

The collision sweep checks 191 component/mesh pairs at every integer crank angle. It checks triangle-edge intersections in both directions with a BVH and a 0.0001-unit endpoint tolerance. It is not a containment, coplanar-contact, or continuous-collision certificate. Derived helper pins and all accessory pairs are outside this sweep. These are detected intersections, not measured penetration depths.

| Moving component | Contacted source component | Inclusive sampled crank angles |
| --- | --- | --- |
| CrankshaftGroup | Frame.001_89 | 0–359° |
| CrankshaftGroup | Frame.000_85 | 0–359° |
| PistonGroup01 | Frame.001_89 | 0–29°, 105–134°, 157–246°, 264–288°, 354–359° |
| ConnectingRod01 | Frame.000_85 | 249–290° |
| ConnectingRod01 | Circle.003_32 | 41–128°, 135–265°, 268–343° |
| ConnectingRod02 | Circle.003_32 | 0–164°, 221–310°, 313–359° |
| ConnectingRod03 | Circle.003_32 | 0–85°, 88–163°, 222–308°, 315–359° |
| ConnectingRod04 | Circle.003_32 | 40–130°, 133–345° |
| PistonGroup01 | Drijfstang_79 | 34–45°, 135–146°, 217–323° |
| PistonGroup02 | Drijstang1_81 | 38–142°, 215–226°, 314–325° |
| PistonGroup03 | Drijfstang.001_80 | 37–143°, 214–225°, 315–326° |
| PistonGroup04 | Drijstang1.001_82 | 35–46°, 134–145°, 218–322° |

No piston/valve surface intersections were detected in the sampled pairs. This does not certify the valvetrain. [engine-validation.json](../static/models/engine/engine-validation.json) records first contact coordinates, source mesh names, exact sampled ranges, and validation scope. The lab displays an intersection indicator and exposes the ranges in its inspector. Parts are never automatically hidden to conceal conflicts.

The continuous source shaft occupies space needed by the articulating rods. Correcting that, piston internal clearances, and casting clearances requires a deliberate geometry repair on a separate derivative. It cannot be solved honestly by changing pivot origins alone. Such repairs were not approximated by shrinking hero components or hiding contact surfaces.

## F. Exploded view and exact reconstruction

Each semantic group has a fixed offset and smooth staged interval in the manifest. Accessories, pipes, gears, pulleys, chain, and flywheel move outward first; block and lower structure separate next; pistons, rods, and crank separate after the mechanism parks. Cams and valves lift as complete rigid assemblies.

`setTimeline({ engineMechanismProgress, explosionProgress, cameraProgress })` accepts normalized values independently of scroll events. `sourcePose` selects the uncorrected source reference. Playback stops as soon as separation begins; the crank smoothly parks at 45° over progress 0–0.35. Piston, rod, and crank separation starts at 0.4, after parking. All mechanical parts remain frozen thereafter. No wheel listener or homepage timeline is installed.

Every pose is recalculated from saved matrices and analytic kinematics. No frame-by-frame transform accumulation is used. Immutable records include position, Euler rotation, quaternion, scale, parent identity, local matrix, world matrix, and parent world matrix.

There are two intentionally different assembled states:

- **Source pose:** explosion progress zero copies the original loaded local matrices exactly; original parent relationships remain intact.
- **Prepared pose:** progress zero reconstructs the corrected mechanism at the requested crank angle. It cannot simultaneously preserve the source's misalignment. Repeating the same input reproduces exactly the same canonical matrices.

Twenty source explosion cycles restore zero matrix error and zero parent changes. Twenty prepared cycles reproduce identical matrices. Ten additional source cycles pass in the browser. Intermediate states are order-independent; near-zero source progress is continuous. Instanced hardware follows the canonical matrices and restores its exact deterministic Float32 representations.

## G. Camera and presentation

Five camera states: assembled hero, cylinder approach, piston/rod view, crankshaft view, and exploded hero. A normalized camera control interpolates positions and targets; explosion automatically widens framing. Near/far planes are 0.05/250 source units. The engine never auto-spins.

Twenty-one sampled assembled camera positions had minimum geometry depth **13.625 units**, safely beyond the near plane. Close views intentionally crop peripheral accessories; they do not attempt microscopic interior fly-throughs. Complete hero and exploded geometry stayed inside the frustum at 1366×768, 1920×1080, and 390×844, with correct canvas aspect and no horizontal overflow. This is sampled verification, not proof for arbitrary orbit controls or every possible user-combined state.

The lab provides play/pause, crank scrub, separation and camera sliders, source-pose comparison, wireframe, optional orbit, component visibility, and semantic inspection. Presentation mode hides lab controls. The palette is silver/graphite with studio lighting; the neutral background moves from soft white/silver to deep charcoal as the engine separates.

## H. Measured performance

Recorded in local Headless Chrome 153 on Windows, AMD Radeon RX 7900 GRE through ANGLE/D3D11; viewport 1440×1000, DPR 1. Approximately 182–183 frames per state. Raw evidence: [performance.json](../artifacts/engine-lab/performance.json).

| State | Observed cadence | Median interval | P95 interval | Median render/rig CPU | Draw calls | Submitted triangles |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Assembled | 238.1 fps | 4.2 ms | 4.3 ms | 1.0 ms | 112 | 568,464 |
| Moving mechanism | 238.1 fps | 4.2 ms | 5.1 ms | 1.2 ms | 112 | 568,464 |
| Fully exploded | 238.1 fps | 4.2 ms | 5.1 ms | 0.9 ms | 112 | 568,464 |
| Crank close view | 238.1 fps | 4.2 ms | 4.3 ms | 0.9 ms | 102 | 534,980 |

Local asset load plus decode: **100 ms** in this run. This is a local request measurement, not a cold Internet-download benchmark. Unique geometry ArrayBuffers total **10,791,136 bytes / 10.29 MiB**, with 83 renderer geometry objects including joint helpers. That is not total JS heap or GPU memory; environment textures, buffers, driver allocations, and render targets add memory. Runtime instancing adds a small instance-matrix allocation.

The cadence reflects this fast local machine and browser scheduling. No general 60 fps, mobile GPU performance, cold-network time, or GPU-timer claim is made. DPR is capped at 1.5 desktop / 1.25 mobile. There is no demonstrated GPU bottleneck here; decoded memory, network transfer, and low-end integrated-GPU behavior still need target-device profiling before release.

## I. Files

- Modified application entry: `src/App.jsx`, only the gated lazy lab route.
- Modified frontend tooling: `package.json` engine commands; `.gitignore` excludes `dist-engine-lab/`.
- Scene/UI: `src/engine-lab/EngineLab.jsx`, `engine-lab.css`, `createEngineLab.js`, `studio.js`.
- Rig: `createEngineRig.js`, `kinematics.js`, `referenceState.js`, `instanceHardware.js`.
- Preparation/inspection: `scripts/engine/source.mjs`, `measure.mjs`, `prepare.mjs`, `load-rig.mjs`.
- Contact validation: `scripts/engine/surface-contacts.mjs`, `validate.mjs`.
- Derived assets: `static/models/engine/engine-lab.glb`, `engine-manifest.json`, `engine-validation.json`.
- Tests: `tests/engine-lab.test.mjs`, `tests/engine-lab.spec.js`, `playwright.engine.config.js`.
- Documentation: this report and the frontend-root `ENGINE-LAB-REPORT.md` entry point.
- Ignored evidence: `artifacts/engine-lab/`, including screenshots, raw measurements, and browser results.

## J. Build and test results

- `npm run engine:prepare`: passed; reads source and recreates only derivative assets.
- `npm run engine:validate`: passed execution; reports the geometric conflicts above.
- `npm run test:engine`: **9 passed**.
- `npm run test:engine:browser`: **1 end-to-end scenario passed**, including controls, reconstruction, visibility, camera clearance, responsive framing, presentation mode, and unmount/remount; no browser errors recorded.
- `npm run build`: passed, normal production routing excludes the lab code.
- `npm run build:engine`: passed, standalone lab-enabled build in `dist-engine-lab/`.
- Vite emits bundle-size warnings for Three.js-related chunks. These are warnings, not build failures.
- Source hash and Git diff remain unchanged. No backend, API, auth behavior, homepage design, database, or business features were modified.

Run from `championsclub/frontend`: `npm run dev -- --port 5174`, then open `http://localhost:5174/#/engine-lab`. The browser test expects a running server on port 5174; `ENGINE_LAB_URL` overrides it. `npm run build:engine` is explicit opt-in; the normal build does still copy public static assets, including the unreferenced derivative files, unless deployment filters them.

## K. Final integration recommendation

Keep the lab isolated. The optimization, deterministic timeline, semantic mapping, material setup, and reversible explosion are suitable foundations for later scroll integration. **Do not present the current mechanism as a physically correct production engine.**

Before homepage integration, create another derived geometry revision that replaces the impossible continuous shaft regions with proper crank webs/journals, repairs piston wrist/rod clearance, and corrects intersecting castings. Preserve the current original and derivative as references. Repeat the complete collision sweep and visual checks, confirm phase and cam conventions, then profile on a representative laptop/mobile GPU and a cold network. Only after that should the homepage timeline drive this API through the existing scroll system.
