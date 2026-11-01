// SPDX-License-Identifier: Apache-2.0
import { sceneAssetUrl } from "./presentation.js";

export function createSound(config, base, button) {
  if (!config?.music_url)
    return { step() {}, state: () => ({ enabled: false, configured: false }) };
  const music = new Audio(sceneAssetUrl(base, config.music_url));
  music.loop = true;
  music.volume = 0.18;
  music.preload = "auto";
  let enabled = true,
    waiting = false,
    unavailable = false,
    context,
    buffer,
    steps = 0,
    generation = 0;
  const sample = config.footstep_url
    ? fetch(sceneAssetUrl(base, config.footstep_url))
        .then((r) => {
          if (!r.ok) throw new Error("Footstep audio unavailable");
          return r.arrayBuffer();
        })
        .catch(() => null)
    : Promise.resolve(null);
  function paint() {
    button.hidden = false;
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", enabled ? "Mute sound" : "Enable sound");
    button.dataset.muted = String(!enabled);
    button.title = !enabled
      ? "Sound off"
      : unavailable
        ? "Sound unavailable"
        : waiting
          ? "Sound on · starts after interaction"
          : "Sound on";
  }
  async function play() {
    if (!enabled || document.hidden) return;
    const current = generation;
    try {
      await music.play();
      waiting = false;
    } catch (error) {
      waiting = error.name === "NotAllowedError";
      unavailable = !waiting && error.name !== "AbortError";
    }
    if (!enabled || document.hidden || current !== generation) music.pause();
    paint();
  }
  async function unlock() {
    if (!enabled || document.hidden) return;
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        context = new AudioContext();
        sample
          .then((data) => data && context.decodeAudioData(data.slice(0)))
          .then((decoded) => {
            buffer = decoded;
          })
          .catch(() => {});
      }
    }
    if (context?.state === "suspended") context.resume().catch(() => {});
    if (music.paused) void play();
  }
  function gesture(event) {
    if (event.target.closest?.("#sound-toggle")) return;
    void unlock();
  }
  document.addEventListener("pointerdown", gesture, { capture: true });
  document.addEventListener("keydown", gesture, { capture: true });
  document.addEventListener("visibilitychange", () => {
    generation++;
    if (document.hidden) {
      music.pause();
      context?.suspend().catch(() => {});
    } else if (enabled) {
      void play();
    }
  });
  button.addEventListener("click", () => {
    enabled = !enabled;
    generation++;
    if (!enabled) {
      music.pause();
      context?.suspend().catch(() => {});
    } else void unlock();
    paint();
  });
  music.addEventListener("error", () => {
    unavailable = true;
    paint();
  });
  paint();
  void play();
  return {
    step() {
      if (
        !enabled ||
        document.hidden ||
        context?.state !== "running" ||
        !buffer
      )
        return;
      const source = context.createBufferSource(),
        gain = context.createGain();
      source.buffer = buffer;
      source.playbackRate.value = 0.94 + (steps % 3) * 0.055;
      gain.gain.value = 0.24;
      source.connect(gain);
      gain.connect(context.destination);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
      };
      source.start();
      steps++;
    },
    state: () => ({
      configured: true,
      enabled,
      waiting,
      unavailable,
      musicPlaying: !music.paused,
      stepsPlayed: steps,
      context: context?.state || "locked",
    }),
  };
}
