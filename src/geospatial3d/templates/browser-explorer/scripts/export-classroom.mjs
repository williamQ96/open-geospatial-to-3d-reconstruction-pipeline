// SPDX-License-Identifier: Apache-2.0
// Run with the local viewer server: node scripts/export-classroom.mjs <output.glb> <url>
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
const output = process.argv[2] || "artifacts/classroom-v1.glb";
const url = process.argv[3] || "http://127.0.0.1:5174/";
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
  headless: true,
});
try {
  const page = await browser.newPage();
  await page.goto(new URL("?interior=classroom-template-export", url).href);
  const bytes = await page.evaluate(async () => {
    const { createClassroom } = await import("/src/classroom.js");
    const { GLTFExporter } =
      await import("/node_modules/three/examples/jsm/exporters/GLTFExporter.js");
    const data = await new GLTFExporter().parseAsync(createClassroom().root, {
      binary: true,
      copyright:
        "Copyright 2026 Open Campus contributors. Original model output: CC BY 4.0.",
    });
    return [...new Uint8Array(data)];
  });
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, Buffer.from(bytes));
  console.log(
    `Exported original classroom: ${bytes.length} bytes -> ${output}`,
  );
} finally {
  await browser.close();
}
