# Automotive asset audit

Audited on 17 September 2026 before the frontend rebuild.

| Status | Asset | Decision |
| --- | --- | --- |
| Available | ChampionsClub SVG mark | Project branding exists. The new experience uses a typographic wordmark. |
| Available | `src/assets/automotive-dashboard.png` | A flat showroom image with no recorded vehicle licensing information. Not used in the 3D experience. |
| Available | Screenshots under `artifacts` | Verification evidence only. Not scene assets. |
| Usable | Existing application data, demo identities and API adapters | Preserved. |
| Temporary | Original procedural unbranded grand tourer, inline-four engine and drivetrain | Built in code to validate every timeline stage. These are designed placeholders, not production automotive CAD. |
| Temporary | Procedural floating-point studio environment | Generates PBR reflections locally without a network request. |
| Missing | Authorized final vehicle GLB | No GLB, GLTF, FBX or OBJ exists in the project. |
| Missing | Detailed engine GLB | No mechanically accurate engine asset exists in the project. |
| Missing | Final drivetrain GLB and studio HDR | Optional replacements for procedural assets. |

## Drop-in asset contract

Edit `frontend/public/models/manifest.json` when licensed assets are available. Null URLs mean procedural fallback. Model URLs are relative to the site root. Models are preloaded and shader programs compiled before the timeline is revealed. A rejected model falls back before the experience begins and is disclosed in the model information panel.

Use GLB with meters, Y up and the vehicle nose facing negative X. Apply transforms before export. Keep moving parts under the named groups below. Preserve each part's assembled pivot. The loader wraps each named group with an animation pivot so its rest transform stays intact. Nested moving groups are not allowed.

- Vehicle: `Body`, `Hood`, `Doors`, `Wheels`, `Interior`, `Chassis`, `EngineProxy`. Prefer individual wheel groups `WheelFL`, `WheelFR`, `WheelRL`, `WheelRR`. Vehicle wheelbase approximately 3.1 m, overall length 5 m. Engine mount defaults to `[-1.25, 0.54, 0]` and can be changed in the manifest.
- Engine: `EngineBlock`, `CylinderHead`, `Pistons`, `ConnectingRods`, `Crankshaft`, `Intake`, `Turbo`, `Exhaust`, `Accessories`. Prefer individual groups `Piston1` through `Piston4` and `Rod1` through `Rod4`. Engine coordinates are centered on the crankshaft with cylinders extending along X. The assembled engine is about 2.3 units long before the configured mount scale.
- Drivetrain: `Transmission`, `Driveshaft`. Optional. Procedural parts stay when omitted.

Each manifest model has `url`, `scale` and `nodes`. Map conceptual names to authored node names through `nodes`. The vehicle entry also has `enginePosition` and `engineScale`. Invalid required groups reject the replacement rather than leaving a broken exploded sequence.

Uncompressed GLB and Meshopt-compressed meshes work immediately. Draco and KTX2 are supported when local decoder directories are configured in `decoders`. Copy the matching decoder files from the installed Three.js package into those public directories before enabling them. No third-party CDN decoder request is made. Textures should use KTX2 where appropriate, ordinarily 1K or 2K. Inspect imported PBR materials before approving final assets.

Budget targets: vehicle below 150k triangles, engine below 120k, combined visible draws below 180, textures below 96 MB and compressed initial assets below 12 MB. These are production targets, not a claim that unprovided final assets meet them. Supply authorized base color, normal and metalness/roughness textures with each model. Volkswagen assets or branding require explicit authorization and are not included.
