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
export function clipTimeFromPhase(phase, duration, offset = 0) {
  return ((((phase / (Math.PI * 2) + offset) % 1) + 1) % 1) * duration;
}
export function createWalkMotion() {
  let phase = 0,
    envelope = 0,
    travel = 0,
    steps = 0;
  return {
    update(
      dt,
      metres,
      {
        grounded,
        enabled,
        reducedMotion = false,
        running = false,
        motionLevel = 1,
      },
    ) {
      const walking = enabled && grounded && metres > 0.0001;
      envelope += (Number(walking) - envelope) * (1 - Math.exp(-dt * 12));
      let step = false;
      if (walking) {
        const stepLength = running ? 1.5 : 0.95;
        phase += (metres / (stepLength * 2)) * Math.PI * 2;
        travel += metres / stepLength;
        if (travel >= 1) {
          travel %= 1;
          steps++;
          step = true;
        }
      } else travel = 0;
      const amount = reducedMotion
        ? 0
        : [0, 1, 2, 3.5][densityIndex(motionLevel)];
      return {
        step,
        steps,
        phase,
        running,
        bobY: amount ? Math.sin(phase * 2) * 0.003 * envelope * amount : 0,
        bobX: amount ? Math.sin(phase) * 0.001 * envelope * amount : 0,
        roll: 0,
        walking,
      };
    },
    reset() {
      phase = envelope = travel = 0;
    },
  };
}
