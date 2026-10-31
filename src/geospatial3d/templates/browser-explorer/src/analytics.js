// SPDX-License-Identifier: Apache-2.0
// Optional aggregate analytics. No search text, building IDs, coordinates or URLs
// with query strings are sent. Missing configuration never affects the explorer.
const EVENTS = new Set([
  "view-first",
  "view-third",
  "view-aerial",
  "building-search-selected",
  "settings-open",
  "return-to-start",
  "touch-walk",
]);

export function createAnalytics(config, env = globalThis) {
  const inactive = { enabled: false, event() {} };
  const win = env.window,
    doc = env.document;
  if (
    !config?.enabled ||
    config.provider !== "goatcounter" ||
    !/^[a-z0-9][a-z0-9-]{1,60}$/.test(config.site_code || "") ||
    !win ||
    !doc
  )
    return inactive;
  if (
    !config.allowed_hosts?.includes(win.location.hostname) ||
    win.navigator.webdriver ||
    win.navigator.doNotTrack === "1" ||
    win.navigator.globalPrivacyControl
  )
    return inactive;
  let ready = false,
    failed = false;
  const queue = [
    { path: win.location.pathname, title: doc.title, referrer: "" },
  ];
  const seen = new Set();
  function send(payload) {
    if (failed) return;
    if (!ready) {
      if (queue.length < 32) queue.push(payload);
      return;
    }
    try {
      win.goatcounter.count(payload);
    } catch {
      /* Statistics cannot break navigation. */
    }
  }
  win.goatcounter = { no_onload: true, no_events: true };
  const script = doc.createElement("script");
  script.async = true;
  script.src = "https://gc.zgo.at/count.js";
  script.dataset.goatcounter = `https://${config.site_code}.goatcounter.com/count`;
  script.onload = () => {
    if (
      typeof win.goatcounter.count !== "function" ||
      win.goatcounter.filter?.()
    ) {
      failed = true;
      queue.length = 0;
      return;
    }
    ready = true;
    for (const payload of queue.splice(0)) send(payload);
  };
  script.onerror = () => {
    failed = true;
    queue.length = 0;
  };
  doc.head.append(script);
  return {
    enabled: true,
    event(name) {
      if (!EVENTS.has(name) || seen.has(name)) return;
      // One event of each type per page load, rather than pointer/frame spam.
      seen.add(name);
      send({ path: name, title: name, event: true, referrer: "" });
    },
  };
}
