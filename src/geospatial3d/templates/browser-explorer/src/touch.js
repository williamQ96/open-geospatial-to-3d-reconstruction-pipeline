// SPDX-License-Identifier: Apache-2.0
// Pointer roles are chosen on contact and stay fixed until that finger lifts.
export function createTouchControls(canvas, { enabled, onLook, onMove }) {
  const axes = { forward: 0, right: 0 };
  const contacts = new Map();
  let running = false;
  const run = document.createElement("button");
  run.className = "touch-run";
  run.textContent = "Run";
  run.setAttribute("aria-label", "Hold to run");
  run.setAttribute("aria-pressed", "false");
  canvas.parentElement.append(run);
  function setRunning(value) {
    running = value;
    run.setAttribute("aria-pressed", String(value));
  }
  run.addEventListener("pointerdown", (event) => {
    if (!enabled()) return;
    event.preventDefault();
    event.stopPropagation();
    setRunning(true);
    run.setPointerCapture(event.pointerId);
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    run.addEventListener(type, (event) => {
      event.preventDefault();
      event.stopPropagation();
      setRunning(false);
    });
  run.addEventListener("keydown", (event) => {
    if (["Space", "Enter"].includes(event.code)) {
      event.preventDefault();
      event.stopPropagation();
      if (enabled()) setRunning(true);
    }
  });
  run.addEventListener("keyup", (event) => {
    if (["Space", "Enter"].includes(event.code)) {
      event.preventDefault();
      event.stopPropagation();
      setRunning(false);
    }
  });
  const stick = document.createElement("div");
  stick.className = "touch-stick";
  stick.hidden = true;
  stick.setAttribute("aria-hidden", "true");
  stick.innerHTML = "<span></span>";
  canvas.parentElement.append(stick);
  const knob = stick.firstElementChild;
  function reset() {
    setRunning(false);
    contacts.clear();
    axes.forward = axes.right = 0;
    stick.hidden = true;
  }
  function consume(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  canvas.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType !== "touch" || !enabled()) return;
      consume(event);
      canvas.parentElement.focus({ preventScroll: true });
      const box = canvas.getBoundingClientRect();
      const role = event.clientY - box.top >= box.height / 2 ? "move" : "look";
      if ([...contacts.values()].some((contact) => contact.role === role))
        return;
      contacts.set(event.pointerId, {
        role,
        x: event.clientX,
        y: event.clientY,
      });
      canvas.setPointerCapture(event.pointerId);
      if (role === "move") {
        stick.style.left = `${event.clientX - box.left}px`;
        stick.style.top = `${event.clientY - box.top}px`;
        knob.style.transform = "translate(0px, 0px)";
        stick.hidden = false;
      }
    },
    true,
  );
  canvas.addEventListener(
    "pointermove",
    (event) => {
      const contact = contacts.get(event.pointerId);
      if (!contact) return;
      consume(event);
      if (!enabled()) {
        reset();
        return;
      }
      const dx = event.clientX - contact.x,
        dy = event.clientY - contact.y;
      if (contact.role === "look") {
        onLook(dx, dy);
        contact.x = event.clientX;
        contact.y = event.clientY;
      } else {
        const distance = Math.hypot(dx, dy),
          radius = 48;
        const strength = Math.min(
          1,
          Math.max(0, (distance - 6) / (radius - 6)),
        );
        axes.right = distance ? (dx / distance) * strength : 0;
        axes.forward = distance ? (-dy / distance) * strength : 0;
        const scale = distance > radius ? radius / distance : 1;
        knob.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
        if (strength) onMove();
      }
    },
    true,
  );
  function finish(event) {
    const contact = contacts.get(event.pointerId);
    if (!contact) return;
    consume(event);
    contacts.delete(event.pointerId);
    if (contact.role === "move") {
      axes.forward = axes.right = 0;
      stick.hidden = true;
    }
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
  }
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    canvas.addEventListener(name, finish, true);
  return {
    axes,
    reset,
    get running() {
      return running;
    },
  };
}
