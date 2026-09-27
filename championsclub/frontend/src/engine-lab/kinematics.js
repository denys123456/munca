export const clamp = value => Math.max(0, Math.min(1, value));
export const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const TAU = Math.PI * 2;
export const PARKED_ANGLE = Math.PI / 4;

export function solveCylinder(measurements, index, crankAngle) {
  const [cx, cy] = measurements.crankCenter;
  const [x, , z] = measurements.boreCenters[index];
  const { radius, phase } = measurements.throws[index];
  const length = measurements.rods[index].length;
  const theta = crankAngle + phase;
  const journal = [cx + radius * Math.sin(theta), cy + radius * Math.cos(theta), z];
  const dx = x - journal[0];
  const discriminant = length * length - dx * dx;
  if (discriminant < 0) throw new Error(`Cylinder ${index + 1}: unreachable wrist pin at ${crankAngle}`);
  const wrist = [x, journal[1] + Math.sqrt(discriminant), z];
  return { journal, wrist, rodAngle: Math.atan2(wrist[1] - journal[1], dx), length, discriminant };
}

export function resolveTimeline(input = {}) {
  const mechanismProgress = clamp(input.engineMechanismProgress ?? 0.125);
  const explosionProgress = clamp(input.explosionProgress ?? 0);
  const cameraProgress = clamp(input.cameraProgress ?? 0);
  const requestedAngle = mechanismProgress * TAU;
  const parkedMechanismProgress = clamp(input.parkedMechanismProgress ?? PARKED_ANGLE / TAU);
  const parkedAngle = parkedMechanismProgress * TAU;
  const lock = smooth(explosionProgress / 0.35);
  const difference = Math.atan2(Math.sin(parkedAngle - requestedAngle), Math.cos(parkedAngle - requestedAngle));
  return {
    engineMechanismProgress: mechanismProgress,
    explosionProgress,
    cameraProgress,
    parkedMechanismProgress,
    sourcePose: Boolean(input.sourcePose),
    angle: requestedAngle + difference * lock,
    state: explosionProgress === 0 ? "ASSEMBLED" : explosionProgress < 0.35 ? "PARKING_MECHANISM" : "EXPLODED_MECHANISM_LOCKED",
  };
}

export function deadCenters(measurements, index) {
  const cylinder = measurements.throws[index];
  const offset = measurements.boreCenters[index][0] - measurements.crankCenter[0];
  const length = measurements.rods[index].length;
  const tdc = Math.asin(offset / (length + cylinder.radius)) - cylinder.phase;
  const bdc = Math.PI + Math.asin(offset / (length - cylinder.radius)) - cylinder.phase;
  return {
    tdcAngle: ((tdc % TAU) + TAU) % TAU,
    bdcAngle: ((bdc % TAU) + TAU) % TAU,
    tdcWrist: solveCylinder(measurements, index, tdc).wrist,
    bdcWrist: solveCylinder(measurements, index, bdc).wrist,
  };
}
