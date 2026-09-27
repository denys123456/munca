import { readEngine, cylinderCandidates } from "./source.mjs";

const source = await readEngine(new URL("../../../../car_engine.glb", import.meta.url));
for (const [mesh, axis, world] of [[93, 1, true], [72, 1, false], [72, 2, false], [87, 2, false], [89, 2, false], [30, 2, true], [28, 2, true], [31, 2, true]]) {
  console.log(JSON.stringify({ mesh, axis, world, candidates: cylinderCandidates(source.points(mesh, world), axis).slice(0, 16) }));
}
