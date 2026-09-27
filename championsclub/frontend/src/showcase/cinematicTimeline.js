import { clamp, smooth } from "../engine-lab/kinematics.js";

export const HANDOFF = 0.555;
export const EXPLOSION_START = 0.72;
export const PARKED_PROGRESS = 100 / 360;
export const segment = (progress, start, end) => clamp((progress - start) / (end - start));

export function cinematicState(progress) {
  const p = clamp(progress);
  const orbit = smooth(segment(p, 0.04, 0.44));
  return {
    progress: p,
    scene: p < HANDOFF ? "car" : "engine",
    theta: 2.35 + Math.PI * 2 * orbit,
    radius: 6.2 - 0.3 * smooth(segment(p, 0, 0.04)),
    approach: smooth(segment(p, 0.47, HANDOFF)),
    reveal: smooth(segment(p, HANDOFF, 0.625)),
    tone: smooth(segment(p, 0.43, 0.64)),
    engineMechanismProgress: (30 + 70 * smooth(segment(p, 0.635, 0.715))) / 360,
    parkedMechanismProgress: PARKED_PROGRESS,
    explosionProgress: smooth(segment(p, EXPLOSION_START, 0.96)),
    cameraProgress: smooth(segment(p, 0.72, 0.96)),
    chapter: p < 0.12 ? 0 : p < HANDOFF ? 1 : p < 0.86 ? 2 : 3,
  };
}

export function createProgressDamping(initial = 0) {
  let rendered = initial, raw = initial, direction = 0, speed = 0;
  return {
    target(next, elapsed = 0.016) {
      next = clamp(next);
      const difference = next - raw;
      const nextDirection = Math.sign(difference);
      if (nextDirection && direction && nextDirection !== direction) {
        rendered = next;
        speed = 0;
      }
      if (nextDirection) direction = nextDirection;
      speed = Math.min(2, Math.abs(difference) / Math.max(0.008, elapsed));
      raw = next;
    },
    step(delta, maximum = 1, reduced = false) {
      const target = Math.min(raw, maximum);
      const tau = reduced ? 0 : 0.055 + Math.min(0.045, speed * 0.035);
      rendered += (target - rendered) * (tau ? 1 - Math.exp(-Math.min(delta, 0.05) / tau) : 1);
      for (const boundary of [HANDOFF, EXPLOSION_START, 0.96]) {
        if (target < boundary && rendered >= boundary) rendered = target;
        if (target >= boundary && direction < 0 && rendered < boundary) rendered = target;
      }
      if (Math.abs(rendered - target) < 0.00001) rendered = target;
      return rendered;
    },
    get settled() { return Math.abs(rendered - raw) < 0.00001; },
    get raw() { return raw; },
    get rendered() { return rendered; },
  };
}
