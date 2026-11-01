// SPDX-License-Identifier: Apache-2.0
// Opt-in first-level experiments. Each feature owns a reversible lifecycle.
export function createBetaRegistry(container) {
  const features = new Map();
  let active = null;
  function register({ id, title, description, start, stop }) {
    const label = document.createElement("label");
    label.className = "setting-row";
    const span = document.createElement("span");
    span.textContent = title;
    const small = document.createElement("small");
    small.textContent = description;
    span.append(small);
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("aria-label", title);
    label.append(span, input);
    container.append(label);
    const feature = { id, input, start, stop };
    features.set(id, feature);
    input.addEventListener("change", () => {
      if (active) {
        const old = features.get(active);
        old.stop();
        old.input.checked = false;
        active = null;
      }
      if (input.checked) {
        try {
          start();
          active = id;
        } catch (error) {
          stop();
          input.checked = false;
          container.querySelector("[role=status]").textContent = error.message;
        }
      }
    });
  }
  return {
    register,
    state: () => ({ active }),
    stop() {
      if (active) {
        const f = features.get(active);
        f.stop();
        f.input.checked = false;
        active = null;
      }
    },
  };
}
