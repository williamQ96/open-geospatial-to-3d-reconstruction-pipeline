// SPDX-License-Identifier: Apache-2.0
export const DENSITY_NAMES = ["No", "Low", "Mid", "High"];
export const DENSITY_COUNTS = [
  { walk: 0, bicycle: 0, scooter: 0, car: 0, squirrel: 0, props: 0 },
  { walk: 2, bicycle: 0, scooter: 0, car: 1, squirrel: 2, props: 2 },
  { walk: 8, bicycle: 2, scooter: 2, car: 4, squirrel: 8, props: 5 },
  { walk: 20, bicycle: 5, scooter: 5, car: 10, squirrel: 20, props: 14 },
];
export function densityIndex(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n < 4 ? n : 2;
}
export function createWalkMotion() {
  let phase = 0,
    envelope = 0,
    travel = 0,
    steps = 0;
  return {
    update(dt, metres, { grounded, enabled, reducedMotion = false }) {
      const walking = enabled && grounded && metres > 0.0001;
      envelope += (Number(walking) - envelope) * (1 - Math.exp(-dt * 12));
      let step = false;
      if (walking) {
        phase += (metres / 1.25) * Math.PI * 2;
        travel += metres;
        if (travel >= 0.72) {
          travel %= 0.72;
          steps++;
          step = true;
        }
      } else travel = 0;
      return {
        step,
        steps,
        bobY: reducedMotion ? 0 : Math.sin(phase * 2) * 0.018 * envelope,
        bobX: reducedMotion ? 0 : Math.sin(phase) * 0.009 * envelope,
        roll: reducedMotion ? 0 : Math.sin(phase) * 0.0025 * envelope,
        walking,
      };
    },
    reset() {
      phase = envelope = travel = 0;
    },
  };
}
