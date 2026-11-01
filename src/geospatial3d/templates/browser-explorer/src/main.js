// SPDX-License-Identifier: Apache-2.0
// Load exactly one world. Full-document transitions release the previous WebGL world.
import "@fontsource-variable/dm-sans";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./style.css";
const interior = new URL(location.href).searchParams.get("interior");
try {
  if (interior) await import("./interior-app.js");
  else await import("./campus.js");
} catch (error) {
  console.error(error);
  const loading = document.querySelector("#loading"),
    errorPanel = document.querySelector("#error");
  if (loading) loading.hidden = true;
  if (errorPanel) {
    errorPanel.hidden = false;
    errorPanel.querySelector("p").textContent = error.message;
  } else {
    const message = document.createElement("p");
    message.setAttribute("role", "alert");
    message.textContent =
      "Unable to prepare classroom. Return to campus and try again.";
    document.querySelector("#app").append(message);
  }
}
