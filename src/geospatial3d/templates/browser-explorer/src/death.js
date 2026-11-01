// SPDX-License-Identifier: Apache-2.0
const instances = new WeakMap();
export function createDeathFlow({ pause = () => {} } = {}) {
  const dialog = document.querySelector("#death-dialog"),
    shade = document.querySelector("#death-shade");
  if (instances.has(dialog)) return instances.get(dialog);
  let dead = false;
  dialog.addEventListener("cancel", (event) => event.preventDefault());
  document
    .querySelector("#death-restart")
    .addEventListener("click", () => location.reload());
  const flow = {
    show() {
      if (dead) return;
      dead = true;
      document.querySelector("#app").dataset.dead = "true";
      pause();
      shade.hidden = false;
      dialog.showModal();
      document.querySelector("#death-restart").focus();
    },
    get dead() {
      return dead;
    },
  };
  instances.set(dialog, flow);
  return flow;
}
