// SPDX-License-Identifier: Apache-2.0
export const RETURN_KEY = "explorer:outdoor-return:v1";
export function validReturn(value) {
  return (
    value?.version === 1 &&
    typeof value.buildingId === "string" &&
    Array.isArray(value.player) &&
    value.player.length === 3 &&
    value.player.every(Number.isFinite) &&
    [value.yaw, value.pitch, value.followDistance].every(Number.isFinite) &&
    ["first", "third", "aerial"].includes(value.view)
  );
}
export function readReturn(storage) {
  try {
    storage ??= globalThis.sessionStorage;
    const value = JSON.parse(storage.getItem(RETURN_KEY));
    return validReturn(value) ? value : null;
  } catch {
    return null;
  }
}
export function enterInterior(building, snapshot) {
  const value = {
    ...snapshot,
    version: 1,
    buildingId: building.id,
    buildingName: building.name || "Campus building",
  };
  try {
    sessionStorage.setItem(RETURN_KEY, JSON.stringify(value));
  } catch {
    // Navigation still works without storage; exit falls back to the map start.
  }
  const url = new URL(location.href);
  url.searchParams.delete("return");
  url.searchParams.set("interior", building.id);
  url.searchParams.set(
    "interior_mode",
    snapshot.interiorMode === "overview" ? "overview" : "visit",
  );
  location.assign(url.href);
}
export function leaveInterior() {
  const url = new URL(location.href);
  url.searchParams.delete("interior");
  url.searchParams.delete("interior_mode");
  url.searchParams.set("return", "1");
  location.assign(url.href);
}
