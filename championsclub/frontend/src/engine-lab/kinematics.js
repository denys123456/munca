export const clamp = value => Math.max(0, Math.min(1, value));
export const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const TAU = Math.PI * 2;
export const PARKED_ANGLE = Math.PI / 4;

export function solveCylinder(measurements, index, crankAngle, result = { journal: [0, 0, 0], wrist: [0, 0, 0] }) {
  const [cx, cy] = measurements.crankCenter;
  const [x, , z] = measurements.boreCenters[index];
  const { radius, phase } = measurements.throws[index];
  const length = measurements.rods[index].length;
  const theta = crankAngle + phase;
  const { journal, wrist } = result;
  journal[0] = cx + radius * Math.sin(theta);
  journal[1] = cy + radius * Math.cos(theta);
  journal[2] = z;
  const dx = x - journal[0];
  const discriminant = length * length - dx * dx;
  if (discriminant < 0) throw new Error(`Cylinder ${index + 1}: unreachable wrist pin at ${crankAngle}`);
  wrist[0] = x; wrist[1] = journal[1] + Math.sqrt(discriminant); wrist[2] = z;
  result.rodAngle = Math.atan2(wrist[1] - journal[1], dx);
  result.length = length; result.discriminant = discriminant;
  return result;
}

export function resolveTimeline(input = {}, result = {}) {
  const mechanismProgress = clamp(input.engineMechanismProgress ?? 0.125);
  const explosionProgress = clamp(input.explosionProgress ?? 0);
  const cameraProgress = clamp(input.cameraProgress ?? 0);
  const requestedAngle = mechanismProgress * TAU;
  const parkedMechanismProgress = clamp(input.parkedMechanismProgress ?? PARKED_ANGLE / TAU);
  const parkedAngle = parkedMechanismProgress * TAU;
  const lock = smooth(explosionProgress / 0.35);
  const difference = Math.atan2(Math.sin(parkedAngle - requestedAngle), Math.cos(parkedAngle - requestedAngle));
  result.engineMechanismProgress = mechanismProgress;
  result.explosionProgress = explosionProgress;
  result.cameraProgress = cameraProgress;
  result.parkedMechanismProgress = parkedMechanismProgress;
  result.sourcePose = Boolean(input.sourcePose);
  result.angle = requestedAngle + difference * lock;
  result.state = explosionProgress === 0 ? "ASSEMBLED" : explosionProgress < 0.35 ? "PARKING_MECHANISM" : "EXPLODED_MECHANISM_LOCKED";
  return result;
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
