// SPDX-License-Identifier: Apache-2.0
// Pointer roles are chosen on contact and stay fixed until that finger lifts.
export function createTouchControls(
  canvas,
  { enabled, onLook, onMove, onTap = () => {} },
) {
  const axes = { forward: 0, right: 0 };
  const contacts = new Map();
  const stick = document.createElement("div");
  stick.className = "touch-stick";
  stick.hidden = true;
  stick.setAttribute("aria-hidden", "true");
  stick.innerHTML = "<span></span>";
  canvas.parentElement.append(stick);
  const knob = stick.firstElementChild;
  function reset() {
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
        startX: event.clientX,
        startY: event.clientY,
        travelled: 0,
        started: performance.now(),
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
      contact.travelled = Math.max(
        contact.travelled,
        Math.hypot(
          event.clientX - contact.startX,
          event.clientY - contact.startY,
        ),
      );
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
    if (
      event.type === "pointerup" &&
      contact.travelled < 6 &&
      performance.now() - contact.started < 400
    )
      onTap(event);
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
  }
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    canvas.addEventListener(name, finish, true);
  return {
    axes,
    reset,
    get running() {
      return Math.hypot(axes.forward, axes.right) * 4.6 > 2.15;
    },
  };
}

// Keyboard and analog touch share world speeds; preserve fractional stick magnitude.
export function movementInput(
  forward,
  right,
  sprint,
  touch = { forward: 0, right: 0 },
) {
  const length = Math.max(1, Math.hypot(forward, right));
  const keySpeed = sprint ? 4.6 : 1.7;
  const f = (forward / length) * keySpeed + touch.forward * 4.6;
  const r = (right / length) * keySpeed + touch.right * 4.6;
  const speed = Math.hypot(f, r),
    scale = Math.min(1, 4.6 / (speed || 1));
  return {
    forward: f * scale,
    right: r * scale,
    speed: speed * scale,
    running: speed * scale > 2.15,
  };
}
