// SPDX-License-Identifier: Apache-2.0
// Versioned, replayable appearance samples. These are fictional avatars.
export const TEMPLATE_VERSION = 1;
export const RUN_THRESHOLD = 2.15;
export const HAIR_STYLES = ["buzz", "short", "bob", "curls", "ponytail", "bun"];
export const BAG_STYLES = [
  "none",
  "tote",
  "backpack",
  "single-left",
  "single-right",
];
export function seedNumber(value) {
  let h = 2166136261;
  for (const c of String(value)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function randomSource(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function npcProperties(kind, seed) {
  const rng = randomSource(seed),
    pick = (a) => a[Math.floor(rng() * a.length)],
    range = (a, b) => a + (b - a) * rng();
  const base = {
    template: kind === "walk" ? "student" : kind === "car" ? "vehicle" : kind,
    templateVersion: TEMPLATE_VERSION,
    seed,
  };
  if (kind === "walk") {
    let height;
    do {
      height =
        1.71 +
        0.115 *
          Math.sqrt(-2 * Math.log(Math.max(1e-9, rng()))) *
          Math.cos(2 * Math.PI * rng());
    } while (height < 1.4 || height > 2);
    const skin = rng(),
      undertone = range(-3, 3),
      dark = [55, 30, 21],
      light = [245, 214, 205];
    const rgb = dark.map((v, i) =>
      Math.round(
        v +
          (light[i] - v) * skin +
          (i === 0 ? undertone : i === 1 ? -undertone : 0),
      ),
    );
    const sex = rng() < 0.5 ? "m" : "f",
      speed = +range(0.75, 3.15).toFixed(3);
    return {
      ...base,
      sex,
      heightM: +height.toFixed(3),
      skinRGB: rgb,
      skinColor: "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join(""),
      bag: pick(BAG_STYLES),
      bagColor: pick(["#344b3f", "#a17d48", "#4d5d77", "#874f45"]),
      hair: pick(HAIR_STYLES),
      hairColor: pick([
        "#211b18",
        "#503523",
        "#806043",
        "#b99c5e",
        "#713d29",
        "#302825",
      ]),
      shirtColor: pick(["#245b45", "#52725d", "#d3b347", "#6e8790", "#995f4b"]),
      trouserColor: pick(["#343f43", "#49575c", "#655b4b"]),
      speedMps: +speed.toFixed(3),
      runThresholdMps: RUN_THRESHOLD,
      gait: speed > RUN_THRESHOLD ? "run" : "walk",
      bodyWidth: sex === "f" ? 0.94 : 1.02,
    };
  }
  if (kind === "car" || kind === "prop")
    return {
      ...base,
      vehicle: pick(["car", "suv", "van", "pickup"]),
      color: pick([
        "#406b5a",
        "#d9d6c4",
        "#a7b5bb",
        "#405965",
        "#a56449",
        "#c3ac72",
        "#4c5059",
      ]),
      scale: +range(0.92, 1.08).toFixed(3),
      speedMps: kind === "prop" ? 0 : +range(3.2, 6.2).toFixed(3),
    };
  if (kind === "squirrel")
    return {
      ...base,
      scale: +range(0.72, 1.18).toFixed(3),
      speedMps: +range(0.85, 2.15).toFixed(3),
      pauseSeconds: +range(0.7, 2).toFixed(2),
      activeSeconds: +range(2.8, 5.5).toFixed(2),
      furColor: pick(["#765032", "#63452f", "#896443", "#584535"]),
    };
  return {
    ...base,
    color: pick(["#426e5b", "#9d765d", "#648196"]),
    rider: npcProperties("walk", seedNumber(`${seed}:rider`)),
    speedMps: +range(2.3, 4.2).toFixed(3),
  };
}
