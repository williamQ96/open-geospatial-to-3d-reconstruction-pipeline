// SPDX-License-Identifier: Apache-2.0
// Content and branding stay outside the reusable scene/navigation runtime.
export function applyProfile(profile, manifest, field) {
  const text = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };
  const safeUrl = (value) => {
    const url = new URL(value, document.baseURI);
    if (!["https:", "http:"].includes(url.protocol))
      throw new Error("Unsupported profile URL protocol.");
    return url.href;
  };
  const image = (selector, value, alt = "") => {
    const element = document.querySelector(selector);
    element.hidden = !value;
    if (value) {
      element.src = safeUrl(value);
      element.alt = alt;
    }
  };
  const links = (id, items = []) => {
    const container = document.getElementById(id);
    container.replaceChildren();
    for (const item of items) {
      const anchor = document.createElement("a");
      anchor.href = safeUrl(item.url);
      anchor.textContent = item.label + " ↗";
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      container.append(anchor);
    }
    container.hidden = !items.length;
  };
  const title = profile.title || manifest.title || "Geospatial Explorer";
  document.title = title;
  document.querySelector('meta[name="description"]').content =
    profile.description || title;
  document
    .getElementById("viewport")
    .setAttribute("aria-label", profile.viewport_label || "3D scene explorer");
  image(".brand-logo", profile.logo, profile.brand_name || title);
  image("#loading-mark", profile.mark);
  text("brand-name", profile.brand_name || title);
  document.getElementById("brand-name").hidden = !!profile.logo;
  text("brand-kicker", profile.kicker || "3D EXPLORER");
  if (profile.favicon)
    document.getElementById("favicon").href = safeUrl(profile.favicon);
  text("map-label", profile.map_label || "SCENE MAP");
  text("about-title", profile.about_title || manifest.title || title);
  text(
    "about-summary",
    profile.about_summary ||
      "Placeholder geometry is intended for inspection and refinement. Check the source records before interpreting it as a measured reconstruction.",
  );
  text(
    "about-limitations",
    profile.about_limitations ||
      manifest.limitations?.join(" ") ||
      "Scene quality and coverage depend on the supplied data.",
  );
  text(
    "project-description",
    profile.project_description ||
      "This viewer consumes reusable scene exports. Project-specific data, branding and source acknowledgements are configured separately.",
  );
  text(
    "about-footer",
    profile.footer || "Independent geospatial visualization.",
  );
  text("loading-message", profile.loading_message || "Loading the scene…");
  links("source-links", profile.source_links);
  links("repository-links", profile.repository_links);
  text("license-notice", profile.license_notice || "");
  links("license-links", profile.license_links);
  text("building-count", String(manifest.buildings.length));
  text(
    "named-count",
    String(manifest.buildings.filter((building) => building.name).length),
  );
  text(
    "coverage-stat",
    `${manifest.aoi_size_m.toLocaleString("en")} × ${manifest.aoi_size_m.toLocaleString("en")} m`,
  );
  text(
    "map-size",
    `${manifest.aoi_size_m / 1000} × ${manifest.aoi_size_m / 1000} km`,
  );
  const dates = [...new Set(manifest.source_dates || [])];
  text("source-year", dates.map((date) => date.slice(0, 4)).join(" / ") || "—");
  text(
    "source-date",
    profile.source_description ||
      `${manifest.source_ids?.length || 0} registered sources. ${dates.length ? "Acquisition dates: " + dates.join(", ") + "." : "See source records for provenance."}`,
  );
  const rmse = manifest.quality?.holdout_rmse_m;
  text(
    "terrain-quality",
    `${field.spacing_m} m ground grid. ${Number.isFinite(rmse) ? "Internal interpolation holdout RMSE: " + rmse + " m. " : ""}No independent survey-control accuracy validation.`,
  );
  const corridors = manifest.corridors;
  const providers = (corridors?.sources || [])
    .map((source) =>
      [source.provider, source.title || source.id].filter(Boolean).join(" — "),
    )
    .join("; ");
  text(
    "road-source",
    corridors
      ? `Roads and paths: ${providers}. ${corridors.features.length} clipped centerline segments. Widths are estimated for display; surfaces follow the ground, without bridge decks, surveyed curbs, lane markings or a routing network.`
      : "",
  );
}
