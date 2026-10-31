import test from "node:test";
import assert from "node:assert/strict";
import { createAnalytics } from "../src/analytics.js";

function fixture() {
  let script;
  const sent = [];
  const env = {
    window: {
      location: {
        hostname: "map.example",
        pathname: "/map/",
        search: "?secret=test",
      },
      navigator: {},
    },
    document: {
      title: "Map",
      createElement: () => ({ dataset: {} }),
      head: {
        append: (value) => {
          script = value;
        },
      },
    },
  };
  const config = {
    enabled: true,
    provider: "goatcounter",
    site_code: "example-map",
    allowed_hosts: ["map.example"],
  };
  return {
    env,
    config,
    sent,
    load() {
      env.window.goatcounter.count = (value) => sent.push(value);
      script.onload();
    },
    get script() {
      return script;
    },
  };
}

test("analytics is off without configuration and for local/automated/privacy-opted-out visits", () => {
  const f = fixture();
  assert.equal(createAnalytics(null, f.env).enabled, false);
  f.env.window.location.hostname = "localhost";
  assert.equal(createAnalytics(f.config, f.env).enabled, false);
  f.env.window.location.hostname = "map.example";
  for (const option of ["webdriver", "globalPrivacyControl", "doNotTrack"]) {
    f.env.window.navigator = { [option]: option === "doNotTrack" ? "1" : true };
    assert.equal(createAnalytics(f.config, f.env).enabled, false);
  }
  assert.equal(f.script, undefined);
});

test("analytics queues a sanitized pageview, accepts only fixed events and deduplicates", () => {
  const f = fixture();
  const analytics = createAnalytics(f.config, f.env);
  analytics.event("view-first");
  analytics.event("view-first");
  analytics.event("private search text");
  f.load();
  assert.equal(f.sent.length, 2);
  assert.deepEqual(f.sent[0], { path: "/map/", title: "Map", referrer: "" });
  assert.equal(f.sent[1].path, "view-first");
  assert.equal(f.sent[1].event, true);
  f.env.window.goatcounter.count = () => {
    throw Error("blocked");
  };
  assert.doesNotThrow(() => analytics.event("view-third"));
});
