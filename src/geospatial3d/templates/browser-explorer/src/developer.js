// SPDX-License-Identifier: Apache-2.0
export function createDeveloperTools({ getLife }) {
  const panel = document.querySelector("#developer-panel"),
    toggle = document.querySelector("#developer-setting");
  let enabled = false,
    selected = null,
    last = 0;
  function clear() {
    selected = null;
    panel.hidden = true;
  }
  toggle.addEventListener("change", () => {
    enabled = toggle.checked;
    if (!enabled) clear();
  });
  document.querySelector("#developer-close").addEventListener("click", clear);
  document
    .querySelector("#developer-copy")
    .addEventListener("click", async () => {
      const record = getLife()?.inspect(selected);
      if (!record) return;
      try {
        await navigator.clipboard.writeText(JSON.stringify(record, null, 2));
        document.querySelector("#developer-status").textContent =
          "Seed and sampled properties copied.";
      } catch {
        document.querySelector("#developer-status").textContent =
          "Copy unavailable; select the seed and properties below.";
      }
    });
  function inspect(id) {
    if (!enabled) return false;
    const info = getLife()?.inspect(id);
    if (!info) return false;
    selected = id;
    panel.hidden = false;
    document.querySelector("#developer-title").textContent = info.id;
    document.querySelector("#developer-properties").textContent =
      JSON.stringify(
        {
          template: info.template,
          templateVersion: info.templateVersion,
          seed: info.seed,
          ...info.properties,
        },
        null,
        2,
      );
    document.querySelector("#developer-status").textContent = "";
    last = 0;
    return true;
  }
  return {
    inspect,
    get enabled() {
      return enabled;
    },
    get selected() {
      return selected;
    },
    update(now) {
      if (!selected || now - last < 250) return;
      last = now;
      const info = getLife()?.inspect(selected);
      if (!info) {
        clear();
        return;
      }
      document.querySelector("#developer-location").textContent =
        JSON.stringify(
          {
            path: info.path,
            slot: info.slot,
            position: info.position,
            state: info.state,
          },
          null,
          2,
        );
    },
  };
}
