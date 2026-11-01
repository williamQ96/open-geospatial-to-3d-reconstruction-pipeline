import { test, expect } from "@playwright/test";

test("direct indoor link works when session storage is denied and exit falls back safely", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new DOMException("Disabled", "SecurityError");
      },
    }),
  );
  await page.goto("/?interior=generic-room");
  await page.waitForFunction(() => window.__interior?.getState().ready);
  expect(await page.evaluate(() => !!window.__campus)).toBe(false);
  await page.getByRole("button", { name: /Return to campus/ }).click();
  await page.waitForFunction(() => window.__campus?.getState().ready);
});

async function atEntrance(page, view = "first") {
  await page.goto("/");
  await page.waitForFunction(() => window.__campus?.getState().ready);
  const entry = await page.evaluate(() =>
    __campus.entranceInfo().find((e) => e.walkable),
  );
  await page.evaluate(
    ({ entry, view }) =>
      sessionStorage.setItem(
        "explorer:outdoor-return:v1",
        JSON.stringify({
          version: 1,
          buildingId: entry.id,
          buildingName: entry.name,
          player: [entry.approach[0], entry.ground, entry.approach[1]],
          view,
          yaw: Math.atan2(entry.outward[0], entry.outward[1]),
          pitch: 0,
          followDistance: 7.5,
          density: 0,
          motionLevel: 1,
        }),
      ),
    { entry, view },
  );
  await page.goto("/?return=1");
  await page.waitForFunction(() => window.__campus?.getState().ready);
  await expect
    .poll(() => page.evaluate(() => __campus.getState().nearbyEntrance))
    .toBe(entry.id);
  return entry;
}

test("E enters a shared classroom without outdoor assets; exit restores position and view", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await atEntrance(page, "third");
  const before = await page.evaluate(() => __campus.getState()),
    requests = [];
  page.on("request", (r) => requests.push(new URL(r.url()).pathname));
  await page.locator("#viewport").focus();
  await page.keyboard.press("KeyE");
  await page.waitForFunction(() => window.__interior?.getState().ready);
  expect(await page.evaluate(() => !!window.__campus)).toBe(false);
  expect(
    requests.filter((p) =>
      /\/scene\/(manifest\.json|.*\.glb|.*navigation.*|.*activity.*)/.test(p),
    ),
  ).toEqual([]);
  expect(
    (await page.evaluate(() => __interior.getState())).roomMeshes,
  ).toBeLessThan(12);
  await page.getByRole("button", { name: "3 Overview", exact: true }).click();
  expect((await page.evaluate(() => __interior.getState())).view).toBe(
    "aerial",
  );
  await page.getByRole("button", { name: /Return to campus/ }).click();
  await page.waitForFunction(() => window.__campus?.getState().ready);
  const after = await page.evaluate(() => __campus.getState());
  expect(after.view).toBe(before.view);
  expect(after.player).toEqual(before.player);
  expect(after.life?.densityLevel ?? 0).toBe(0);
  expect(errors).toEqual([]);
});

test("mouse can click the actual door; E exits near the classroom door", async ({
  page,
}) => {
  await atEntrance(page);
  const box = await page.locator("#viewport").boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForFunction(() => window.__interior?.getState().ready);
  await page.locator("#viewport").focus();
  await page.keyboard.press("KeyE");
  await page.waitForFunction(() => window.__campus?.getState().ready);
});

test("mobile taps a door to enter, analog movement works inside, return is responsive", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await atEntrance(page);
  await page.touchscreen.tap(195, 422);
  await page.waitForFunction(() => window.__interior?.getState().ready);
  await expect(page.locator(".touch-run")).toHaveCount(0);
  const cdp = await context.newCDPSession(page),
    point = (y) => ({ id: 1, x: 90, y, radiusX: 4, radiusY: 4, force: 1 });
  const before = await page.evaluate(() => __interior.getState().player);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(600)],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [point(560)],
  });
  await expect
    .poll(async () =>
      Math.abs(
        (await page.evaluate(() => __interior.getState().player))[2] -
          before[2],
      ),
    )
    .toBeGreaterThan(0.1);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: /Return to campus/ }).tap();
  await page.waitForFunction(() => window.__campus?.getState().ready);
  await context.close();
});
