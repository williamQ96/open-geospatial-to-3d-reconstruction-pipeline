// SPDX-License-Identifier: Apache-2.0
import { createRouteView } from "./navigation-view.js";
import { distance } from "./routing.js";

export function createNavigation({
  scene,
  router,
  ground,
  getView,
  getPlayer,
  focusSearch,
  fitRoute,
  canPin,
}) {
  const $ = (s) => document.querySelector(s),
    panel = $("#directions-panel"),
    routeView = createRouteView(scene, ground);
  let a = null,
    b = null,
    pending = null,
    active = false,
    current = null,
    lastArrivalCheck = -10,
    walkingStart = null;
  const live = () => getView() !== "aerial",
    playerPoint = () => {
      const p = getPlayer();
      return [p.x, -p.z];
    };
  const status = (text) => ($("#route-status").textContent = text);
  function render() {
    $("#route-a").textContent = live()
      ? walkingStart && active
        ? "You · fixed starting point"
        : "You · position when route starts"
      : a?.label || "Choose starting point";
    $("#route-b").textContent = b?.label || "Choose destination";
    panel
      .querySelectorAll('[data-endpoint="a"]')
      .forEach((el) => (el.hidden = live()));
    panel
      .querySelectorAll("[data-pin]")
      .forEach((el) => (el.disabled = live()));
    $("#route-start").disabled = !(b && (live() || a));
    $("#route-fit").disabled = !current;
    $("#directions-open").setAttribute("aria-expanded", String(!panel.hidden));
    $("#app").classList.toggle("directions-visible", !panel.hidden);
    $("#viewport").classList.toggle("pinning", !!pending?.pin);
    panel.classList.toggle("is-pinning", !!pending?.pin);
  }
  function plan() {
    // Capture once per walking route. The player/minimap marker stays live;
    // the blue origin and route geometry remain anchored to the saved point.
    if (live() && !walkingStart) walkingStart = playerPoint();
    const start = live() ? { point: walkingStart } : a;
    if (!start || !b) return;
    current = router.route(start.point, b.point, {
      startBuilding: !!start.building,
      endBuilding: !!b.building,
    });
    routeView.set(current);
    if (!current) {
      status(
        "No connected outdoor route found. Try a nearby path or another pin.",
      );
      render();
      return;
    }
    status(
      `${Math.round(current.distance)} m · Approximate outdoor route${b.building ? " to building approach" : ""}.`,
    );
    render();
  }
  function choose(endpoint, value) {
    if (endpoint === "a") a = value;
    else b = value;
    pending = null;
    active = false;
    walkingStart = null;
    current = null;
    routeView.clear();
    status("Ready when both endpoints are chosen.");
    render();
  }
  $("#directions-open").addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    pending = null;
    render();
  });
  $("#directions-close").addEventListener("click", () => {
    panel.hidden = true;
    pending = null;
    render();
  });
  panel.querySelectorAll("[data-route-search]").forEach((button) =>
    button.addEventListener("click", () => {
      pending = { endpoint: button.dataset.endpoint };
      status(
        `Search for ${pending.endpoint.toUpperCase()}, then choose a building.`,
      );
      focusSearch();
      render();
    }),
  );
  panel.querySelectorAll("[data-pin]").forEach((button) =>
    button.addEventListener("click", () => {
      pending = { endpoint: button.dataset.endpoint, pin: true };
      status(
        `Click or tap walkable ground to place ${pending.endpoint.toUpperCase()}.`,
      );
      render();
    }),
  );
  $("#route-start").addEventListener("click", () => {
    walkingStart = live() ? playerPoint() : null;
    active = true;
    plan();
    if (current && !live()) fitRoute(current.points);
  });
  $("#route-fit").addEventListener("click", () => {
    if (current) fitRoute(current.points);
  });
  $("#route-clear").addEventListener("click", () => {
    active = false;
    walkingStart = null;
    current = null;
    pending = null;
    a = b = null;
    routeView.clear();
    status("Choose A and B in Overview, or a destination while walking.");
    render();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && pending) {
      pending = null;
      status("Point selection cancelled.");
      render();
    }
  });
  render();
  return {
    acceptBuilding(record) {
      if (!pending || pending.pin) return false;
      const ring = record.footprint_enu_m;
      choose(pending.endpoint, {
        point: [
          ring.reduce((s, p) => s + p[0], 0) / ring.length,
          ring.reduce((s, p) => s + p[1], 0) / ring.length,
        ],
        label: record.name,
        building: true,
      });
      return true;
    },
    pin(point) {
      if (!pending?.pin || live()) return false;
      if (!canPin(point)) {
        status("Place the pin outside buildings, on walkable ground.");
        return true;
      }
      choose(pending.endpoint, {
        point,
        label: `Pinned point ${pending.endpoint.toUpperCase()}`,
      });
      return true;
    },
    get picking() {
      return !!pending?.pin;
    },
    modeChanged() {
      pending = null;
      if (active && (live() || a)) plan();
      else {
        current = null;
        routeView.clear();
        if (active) status("Choose a starting point A for Overview.");
      }
      render();
    },
    update(time) {
      routeView.update(time);
      if (active && live() && time - lastArrivalCheck > 1) {
        lastArrivalCheck = time;
        if (current && distance(playerPoint(), current.points.at(-1)) < 5)
          status("You have reached the approximate destination approach.");
      }
    },
    get points() {
      return current?.points || [];
    },
    state() {
      return {
        active,
        originMode: live() ? "player" : "manual",
        walkingStart: walkingStart ? [...walkingStart] : null,
        a,
        b,
        picking: pending?.endpoint || null,
        distance: current?.distance || 0,
        points: current?.points || [],
      };
    },
  };
}
