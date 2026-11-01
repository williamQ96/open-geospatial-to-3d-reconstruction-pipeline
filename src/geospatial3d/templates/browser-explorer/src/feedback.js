// SPDX-License-Identifier: Apache-2.0
export function feedbackDraft({
  repository,
  title = "",
  content,
  coordinates = "",
  iteration = "development",
  view = "",
  now = new Date(),
}) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository || ""))
    throw new Error("Invalid feedback repository.");
  if (!content?.trim()) throw new Error("Please describe your feedback.");
  const id = now.toISOString().replace(/\D/g, "").slice(0, 17);
  const subject = title.trim() || `Feedback #${id} · iteration ${iteration}`;
  const body = [
    content.trim(),
    "",
    "---",
    `Iteration: ${iteration}`,
    `View: ${view}`,
    `Draft created: ${now.toISOString()}`,
    ...(coordinates.trim()
      ? [`Coordinates (provided by reporter): ${coordinates.trim()}`]
      : []),
  ].join("\n");
  const base = `https://github.com/${repository}/issues/new`;
  const full = `${base}?${new URLSearchParams({ title: subject, body })}`;
  const needsPaste = full.length > 7500;
  return {
    title: subject,
    body,
    needsPaste,
    url: needsPaste
      ? `${base}?${new URLSearchParams({ title: subject })}`
      : full,
  };
}

export function createFeedback(
  config,
  { iteration, getView, getPosition, pause, resume },
) {
  if (!config?.repository) return;
  const $ = (s) => document.querySelector(s),
    dialog = $("#feedback-dialog");
  $("#feedback-open").hidden = false;
  $("#feedback-iteration").textContent = `Iteration ${iteration}`;
  let lastDraft;
  $("#feedback-open").addEventListener("click", () => {
    pause();
    dialog.showModal();
    $("#feedback-content").focus();
  });
  $("#feedback-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", resume);
  $("#feedback-position").addEventListener("click", () => {
    $("#feedback-coordinates").value = getPosition();
  });
  $("#feedback-copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(lastDraft.body);
      $("#feedback-status").textContent =
        "Copied. Paste this text into the GitHub issue, then confirm creation there.";
    } catch {
      $("#feedback-status").textContent =
        "Copy was unavailable. Select and copy your feedback from the form before continuing on GitHub.";
    }
  });
  $("#feedback-form").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      lastDraft = feedbackDraft({
        repository: config.repository,
        title: $("#feedback-title").value,
        content: $("#feedback-content").value,
        coordinates: $("#feedback-coordinates").value,
        iteration,
        view: getView(),
      });
      const link = $("#feedback-continue");
      link.href = lastDraft.url;
      link.hidden = false;
      $("#feedback-copy").hidden = !lastDraft.needsPaste;
      $("#feedback-status").textContent = lastDraft.needsPaste
        ? "This draft is long. Copy the feedback, open GitHub and paste it into the issue body. Your draft remains here."
        : "Continue on GitHub to sign in and confirm issue creation. Your draft remains here.";
      // A long draft stays here until its body is copied; never silently truncate it.
      if (!lastDraft.needsPaste)
        window.open(lastDraft.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      $("#feedback-status").textContent = error.message;
    }
  });
}
