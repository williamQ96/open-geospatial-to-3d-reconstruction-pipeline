// SPDX-License-Identifier: Apache-2.0
// Preview artifacts for local visual review. CI retains automatic screenshots
// and traces on failure; routine GPU readback can take 30 s per image there.
export async function capturePreview(page, path) {
  if (!process.env.CI) await page.screenshot({ path, animations: "disabled" });
}
