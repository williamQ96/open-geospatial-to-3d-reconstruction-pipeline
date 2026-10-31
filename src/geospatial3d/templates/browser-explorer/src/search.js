// SPDX-License-Identifier: Apache-2.0
const normalize = (text) =>
  text
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function createBuildingSearch(root, { onSelect, onClear, onFocus }) {
  const input = root.querySelector("input"),
    clear = root.querySelector(".search-clear"),
    dropdown = root.querySelector(".search-dropdown"),
    list = root.querySelector("[role=listbox]"),
    status = root.querySelector(".search-status");
  let index = [],
    results = [],
    active = -1;
  function close() {
    dropdown.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }
  function updateActive() {
    [...list.children].forEach((button, i) =>
      button.setAttribute("aria-selected", String(i === active)),
    );
    if (active >= 0 && results[active]) {
      input.setAttribute("aria-activedescendant", `building-result-${active}`);
      list.children[active]?.scrollIntoView({ block: "nearest" });
    } else input.removeAttribute("aria-activedescendant");
  }
  function choose(i) {
    if (!results[i]) return;
    input.value = results[i].building.name;
    clear.hidden = false;
    close();
    onSelect(results[i].building.id);
  }
  function render() {
    const query = normalize(input.value),
      tokens = query.split(" ").filter(Boolean);
    results = index
      .map((item) => {
        const score = !query
          ? 1
          : item.name === query
            ? 1000
            : item.acronyms.includes(query)
              ? 900
              : item.name.startsWith(query)
                ? 700
                : tokens.every((token) =>
                      item.name
                        .split(" ")
                        .some((word) => word.startsWith(token)),
                    )
                  ? 500
                  : tokens.every((token) => item.name.includes(token))
                    ? 300
                    : 0;
        return { ...item, score };
      })
      .filter((item) => item.score)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.building.name.localeCompare(b.building.name, "en"),
      );
    active = -1;
    list.replaceChildren();
    results.forEach((item, i) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "search-option";
      option.id = `building-result-${i}`;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.tabIndex = -1;
      const name = document.createElement("span"),
        abbreviation = document.createElement("small");
      name.textContent = item.building.name;
      abbreviation.textContent = item.acronyms[0].toUpperCase();
      option.append(name, abbreviation);
      option.addEventListener("pointerdown", (event) => event.preventDefault());
      option.addEventListener("pointerenter", () => {
        active = i;
        updateActive();
      });
      option.addEventListener("click", () => choose(i));
      list.append(option);
    });
    status.textContent = results.length
      ? `${results.length} building${results.length === 1 ? "" : "s"} · Enter to locate`
      : "No buildings found. Try a name or abbreviation.";
    dropdown.hidden = false;
    input.setAttribute("aria-expanded", "true");
    input.removeAttribute("aria-activedescendant");
    clear.hidden = !input.value;
  }
  input.addEventListener("input", render);
  input.addEventListener("focus", () => {
    onFocus();
    render();
  });
  input.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key))
      return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === "Escape") {
      close();
      input.blur();
      return;
    }
    if (dropdown.hidden) render();
    if (event.key === "Enter") {
      choose(Math.max(0, active));
      return;
    }
    if (!results.length) return;
    active =
      (active +
        (event.key === "ArrowDown" ? 1 : active < 0 ? 0 : -1) +
        results.length) %
      results.length;
    updateActive();
  });
  clear.addEventListener("click", () => {
    input.value = "";
    onClear();
    input.focus();
    render();
  });
  root.addEventListener("focusout", (event) => {
    if (!root.contains(event.relatedTarget)) close();
  });
  document.addEventListener("pointerdown", (event) => {
    if (!root.contains(event.target)) close();
  });
  return {
    populate(buildings) {
      index = buildings
        .filter((building) => building.name)
        .map((building) => {
          const name = normalize(building.name),
            words = name
              .split(" ")
              .filter((word) => !["of", "the", "and"].includes(word));
          return {
            building,
            name,
            acronyms: [
              ...new Set([
                words.map((word) => word[0]).join(""),
                words
                  .filter((word) => !["hall", "building"].includes(word))
                  .map((word) => word[0])
                  .join(""),
              ]),
            ],
          };
        });
      input.disabled = false;
    },
    setSelection(building) {
      input.value = building?.name || "";
      clear.hidden = !input.value;
      close();
    },
  };
}
