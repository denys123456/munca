# Engine production preparation and mechanical lab

The expanded audit, complete contact ranges, piston alignment measurements, and limitations are maintained in [docs/ENGINE_LAB.md](docs/ENGINE_LAB.md).

Verified on 2026-09-27. The isolated lab is implemented and tested. The linkage operates continuously, but the supplied casting geometry still intersects moving parts. This is a usable engineering test experience, not approval for final homepage integration.

## A. Source asset

- Original: `C:/Users/Jitu/OneDrive/Desktop/New folder/proiect munca/car_engine.glb`.
- Size: 63,660,668 bytes, 60.71 MiB.
- 1,398,824 triangles; 297 nodes; 160 mesh-bearing nodes, meshes and primitives; 10 materials.
- Zero textures, animations, skins and morph targets.
- SHA-256: `e5f57852816fcfbccf734599400b8d3adc53122a112f7078466d29f879e995e2`.
- Re-read and hash checked against the preparation manifest. Original bytes are unchanged. All optimization writes target `static/models/engine/`.

## B. Semantic map

`static/models/engine/engine-manifest.json` contains every original name, node index, original transform, semantic assignment, explosion offset and stage. All 123 top-level component roots are assigned once; all 297 source nodes are retained. Rings remain descendants of their piston assemblies.

| Semantic group | Original objects |
| --- | --- |
| EngineRoot | Runtime wrapper, original hierarchy preserved |
| EngineBlock | Frame.001_89 |
| LowerStructure | Frame.000_85, Frame.002_90 |
| PistonGroup01–04 | Cylinder.001_68, Cylinder.002_69, Cylinder.004_71, Cylinder.005_72 |
| ConnectingRod01–04, cylinder order | Drijfstang_79, Drijstang1_81, Drijfstang.001_80, Drijstang1.001_82 |
| CrankshaftGroup | Circle.001_30 through Circle.015_44, including main shaft Circle.003_32 |
| CamshaftIntakeGroup | Cube.003_57, Cube.004_58, Cube.005_59, Cube.011_65, Cube.012_66 |
| CamshaftExhaustGroup | Cube.006_60 through Cube.010_64 |
| ValveGroups | Klep1.001_91 through Klep1.016_106 |
| FlywheelGroup | Schijf_153 |
| GearGroups | Tandwiel_154 through Tandwiel.003_157, Cube.002_56, Cylinder.003_70 |
| PulleyGroups | Circle.018_51, Circle.020_52, Circle.021_53, Circle.022_54 |
| PipeGroups | Circle_29, Circle.017_45, NurbsPath.020_126 through NurbsPath.038_144, Pijpje_145 through Pijpje.003_148 |
| TimingChainGroup | Schakel1_151, Schakel1.001_152, BezierCircle.001_2, BezierCurve_3, BezierCurve.003_4 |
| AccessoryGroups | Bolt_5 through Bolt.023_28, Cube_55, Cube.013_67, Cylinder.007_77, Cylinder.009_78, Plane.002_149, Plane.004_150 |

Assignments were checked against geometry fits, source hierarchy and browser views. Intake/exhaust are provisional bank aliases: flow direction cannot be established from this asset. Generic accessory classification is not a claim about each accessory's engineering function.

## C. Mechanical setup

All measurements use source scene units; a physical metre scale is not established. Surface-normal circle fits identify shaft, journal and rod-eye centers. The block has paired open arcs rather than sealed cylindrical liners: their midpoint defines each prepared cylinder centerline. These are explicit geometry-derived approximations.

- Crank axis: `(0, 0, 1)` through `(-0.180130353, -6.244226828, 0)`.
- Parallel piston travel and crown axes: `(0, 1, 0)`; wrist-pin and rod hinge axes: Z.
- Local piston wrist height: `0.028489587`; local crown height: `1.040874481`.
- Cam axes: parallel Z through XY `(1.323322631, 2.326678347)` and `(-0.668291533, 2.326681631)`; grouped but static.

| Cylinder | Bore X | Bore Z | Crank radius | Rod length | Prepared phase | TDC angle | BDC angle |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 0.836377639 | -0.119285786 | 1.358294453 | 3.861445065 | 0° | 11.23° | 203.96° |
| 2 | 0.836945809 | -2.639333891 | 1.331238182 | 3.858670018 | 180° | 191.30° | 23.73° |
| 3 | 0.836622504 | -5.159488997 | 1.358294453 | 3.861445065 | 180° | 191.23° | 23.97° |
| 4 | 0.836454932 | -7.679042398 | 1.331238182 | 3.858670018 | 0° | 11.30° | 203.72° |

The source throws have inconsistent angular and axial positions. The derived rig rephases them to 0/180/180/0, aligns them with cylinder stations, straightens counterweight planes and establishes a 0.50-unit inner gap around approximately 0.444-unit rods. This is a deliberate prepared arrangement, not a claim that the original crank was correctly phased. Unequal measured radii are retained. Eight new sleeve/pin meshes bridge gaps between the source journal caps and rod eyes without decimating hero geometry.

The solver computes each journal from crank rotation, then solves the offset slider-crank constraint for the wrist position and rod angle. Rod transforms pivot around measured big-end centers, not export origins. All crank members use one common pivot transform; flywheel alignment is corrected and rotates with it. Source geometry is not merged destructively.

Every degree from 0 through 360 passes linkage and parallel-axis tests. Maximum measured joint closure error is `2.7353327477566552e-15` units. Crank-member relative matrices remain constant throughout the cycle. Analytic dead centers were checked against 1,440 sampled positions per cylinder. Exact coordinates are in `engine-validation.json`.

## D. Optimization

| Metric | Source | Derived |
| --- | ---: | ---: |
| Asset triangles | 1,398,824 | 567,312 |
| Scene triangles including added pins/sleeves | — | 568,464 |
| Full-engine draw calls | 160 primitive baseline | 112 measured |
| File bytes | 63,660,668 | 5,996,832 |
| File MiB | 60.71 | 5.72 |
| Unique mesh definitions | 160 | 75 |
| Source mesh instances retained | 160 | 160 |
| Chain-related triangles | 732,600 | 117,429 |
| Valve assembly triangles | 227,584 | 63,696 |
| Bolt triangles | 118,692 | 66,239 |

Selective normal-aware simplification targets chain details, valves/springs and bolts. Error limits can prevent reaching requested ratios; bolts were not forced down to the target at the expense of shape. All other mesh triangle counts are preserved, including pistons, rods, crank, block, flywheel and important gears.

The pipeline welds vertices, removes unused texture coordinates, deduplicates identical geometry, reorders buffers and applies lossless Meshopt encoding without position quantization. Runtime instancing uses 16 batches of identical static/cam geometry and saves 56 draws relative to the prepared unbatched scene's 168. Canonical source nodes remain available for exact reconstruction and inspection; their duplicate render layers are disabled. Negative-determinant transforms are excluded from instancing.

Draco was not combined with Meshopt. Static merging was deferred to retain semantic visibility and independent explosion groups. No supposedly invisible source parts were deleted. Materials use restrained steel, graphite, rubber and warm-metal values with studio environment reflections; no texture authoring or uniform chrome conversion.

## E. Piston animation and geometry limitations

Status: **partially working as a full engine; working as a linked mechanism**. Play, pause and angle scrubbing work through a full cycle. All four pistons are aligned and the rod endpoints track their journals and wrist pins. Collision-free operation inside the supplied castings is not achieved.

The full-degree surface-intersection scan reports:

| Moving component | Target | Sampled crank-angle ranges |
| --- | --- | --- |
| CrankshaftGroup, including Object_65 | Frame.001_89 / Object_178 | 0–359° |
| CrankshaftGroup, including Object_65 | Frame.000_85 / Object_174 | 0–359° |
| PistonGroup01 / Object_141 | Frame.001_89 / Object_178 | 0–29°, 105–134°, 157–246°, 264–288°, 354–359° |
| ConnectingRod01 / Object_166 | Frame.000_85 / Object_174 | 249–290° |
| ConnectingRod01 | Circle.003_32 | 41–128°, 135–265°, 268–343° |
| ConnectingRod02 | Circle.003_32 | 0–164°, 221–310°, 313–359° |
| ConnectingRod03 | Circle.003_32 | 0–85°, 88–163°, 222–308°, 315–359° |
| ConnectingRod04 | Circle.003_32 | 40–130°, 133–345° |
| PistonGroup01 | Drijfstang_79 | 34–45°, 135–146°, 217–323° |
| PistonGroup02 | Drijstang1_81 | 38–142°, 215–226°, 314–325° |
| PistonGroup03 | Drijfstang.001_80 | 37–143°, 214–225°, 315–326° |
| PistonGroup04 | Drijstang1.001_82 | 35–46°, 134–145°, 218–322° |

These contacts are shown in the lab; geometry is not automatically hidden to conceal them. The optional explicit linkage-isolation control exists for inspection. Correcting the casting clearances requires further derived geometry work rather than fake piston motion or arbitrary axis shifts.

The expanded scan tests mesh edges against target triangles in both directions with BVH acceleration at one-degree intervals and 0.0001-unit endpoint tolerance. Its 191 component/mesh pairs cover pistons/rods/crank against block/lower structure, every rod against every crank mesh, and pistons against their rods and all valves. It is not a continuous collision certificate, solid-containment test, or all-pairs clearance analysis. Derived helper-pin contacts are not certified. The continuous central shaft and piston interiors require geometry repair as well as the castings. Valves, cams, springs, belts, gears and chain stay static during playback; no firing order or valve timing is claimed.

## F. Explosion and reconstruction

One normalized `explosionProgress` drives fixed per-group offsets with smooth staged interpolation. Accessories, pipes, gears and pulleys separate first; structures then move aside; pistons rise, rods move left, crank/lower structure descend, cams rise and flywheel moves axially. Every evaluation starts from immutable matrices; no frame-to-frame transform accumulation occurs.

The state machine is ASSEMBLED at zero, PARKING_MECHANISM below 0.35 and EXPLODED_MECHANISM_LOCKED from 0.35. Any positive separation stops time-based playback and smoothly parks the mechanism at 45°. Piston/rod/crank separation begins at 0.4, after parking. This avoids independent piston motion after linkage separation.

Source and prepared poses are separate explicit modes. Original source pose reconstructs the exact source matrices and parents. Prepared pose reconstructs the corrected assembly at the requested crank angle. It cannot simultaneously match the misaligned source and the corrected assembly. Twenty source cycles and twenty prepared cycles passed with no drift; ten additional source cycles passed in the browser. Source local-matrix error and changed-parent count are both zero. Frozen references retain position, Euler rotation, quaternion, scale, parent, local matrix and world matrix.

## G. Camera and presentation

Five interpolated views: assembled hero, cylinder approach, piston/rod study, crankshaft study and exploded hero. Near plane is 0.05 units. A 21-position path check verifies every canonical mesh vertex remains in front of the near plane; the minimum measured depth is recorded in `artifacts/engine-lab/performance.json`. This does not certify every possible orbit-control position. Technical closeups intentionally crop peripheral upper components at the viewport edge; full hero/exploded views preserve the complete engine.

Assembled and exploded vertex framing passed at 1366×768, 1920×1080 and 390×844 with no offscreen engine vertices or horizontal overflow. Canvas and camera aspect ratios match. Portrait framing increases camera distance; pixel ratio is capped. Basic orbit inspection, wireframe, component visibility and semantic inspection are development tools. Presentation mode hides lab controls. Browser screenshots show the metal finish, readable exploded layout and intact hero silhouettes.

## H. Performance

Measured in local Headless Chrome 153 on AMD Radeon RX 7900 GRE, Windows, 1440×1000 viewport, DPR 1. Each scenario sampled approximately 180 animation frames. Results are local browser cadence, not GPU timer-query measurements or mobile guarantees.

| Scenario | Median frame interval | Observed cadence | P95 interval | CPU render/update median | Draws | Rendered triangles |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Assembled | 4.2 ms | 238.1 fps | 4.3 ms | 1.0 ms | 112 | 568,464 |
| Moving mechanism | 4.2 ms | 238.1 fps | 5.1 ms | 1.2 ms | 112 | 568,464 |
| Exploded | 4.2 ms | 238.1 fps | 5.1 ms | 0.9 ms | 112 | 568,464 |
| Crank close | 4.2 ms | 238.1 fps | 4.3 ms | 0.9 ms | 102 | 534,980 |

Measured local fetch/decode/rig setup: 100 ms, excluding a guaranteed first rendered frame. Network/cache state was not controlled. Resident unique geometry buffers: 10,791,136 bytes, approximately 10.29 MiB; 83 geometries. This excludes GPU duplication, render targets, environment maps and total browser heap. No sustained-memory-growth or low-end-device benchmark was performed. Runtime cleanup aborts fetches, cancels animation, disconnects resize observers, disposes instancing, geometries/materials/environment/renderer and releases the WebGL context. Browser navigation away and remount passed.

## I. Files

Paths below are relative to `championsclub/frontend/` unless noted.

- Modified: `src/App.jsx` (development/explicit lab-mode lazy route only), `package.json` (engine commands), `.gitignore` (lab build output).
- Runtime: `src/engine-lab/EngineLab.jsx`, `createEngineLab.js`, `createEngineRig.js`, `kinematics.js`, `referenceState.js`, `instanceHardware.js`, `studio.js`, `engine-lab.css`.
- Preparation/validation: `scripts/engine/source.mjs`, `measure.mjs`, `prepare.mjs`, `load-rig.mjs`, `surface-contacts.mjs`, `validate.mjs`.
- Derived assets: `static/models/engine/engine-lab.glb`, `engine-manifest.json`, `engine-validation.json`.
- Tests: `tests/engine-lab.test.mjs`, `tests/engine-lab.spec.js`, `playwright.engine.config.js`.
- Report: `ENGINE-LAB-REPORT.md`.
- Local evidence: `artifacts/engine-lab/` screenshots, `performance.json`, `browser-results.json`, `mechanical-validation.json`.
- Local build output: `dist/`, `dist-engine-lab/`.

No backend, API, authentication implementation, application feature or homepage design was changed. No commit or push was made.

## J. Build and test results

- `npm run test:engine`: 9 passed.
- `npm run test:engine:browser`: 1 end-to-end test passed; no browser errors. Includes controls, matrices, visibility, presentation mode, camera near-plane checks, viewport framing and unmount/remount.
- `npm run engine:validate`: complete 360-degree sampled scan; linkage passes, contacts reported above.
- `npm run build`: passed; lab route excluded from normal production code.
- `npm run build:engine`: passed; explicit lab preview bundle available separately.
- Vite reports a large Three.js-related chunk warning. Both builds succeed.
- Browser visual verification with agent-browser passed for page load, controls and absence of runtime errors.

Run from the frontend directory:

```powershell
npm run dev -- --port 5174
```

Open `http://localhost:5174/#/engine-lab` using the port Vite actually prints. The hash route matches the existing router. Browser tests default to 5174; set `ENGINE_LAB_URL` when using another port. No backend is required for the lab assets or controls.

```powershell
npm run engine:prepare
npm run engine:validate
npm run test:engine
npm run test:engine:browser
npm run build
npm run build:engine
```

Preparation rewrites derived files only. Regenerate validation after changing the derived rig or source interpretation. The normal Vite static-directory copy still includes derived engine files in normal build output, but no production navigation or homepage loads them.

## K. Final integration recommendation

Keep this isolated until the casting contacts are resolved in a separate derived mesh revision and approved camera shots receive low-end-device checks. The prepared solver, semantic map, instancing and reversible explosion are ready for further integration work; the asset is not yet collision-free production geometry.

The controller exposes `setTimeline({ engineMechanismProgress, explosionProgress, cameraProgress, sourcePose })`, with normalized values and no wheel-event coupling. Later scroll integration can drive this API deterministically. Default final-site playback should not be enabled until the known contact ranges and static valvetrain limitations are intentionally addressed.
