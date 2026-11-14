// Portfolio behaviour: theme toggle (every page) and topic filter (projects page).
// Both are extras: the pages read fine with JavaScript turned off.

(function () {
  "use strict";

  var THEME_KEY = "theme";
  var root = document.documentElement;

  // ---- theme toggle ------------------------------------------------------
  var toggle = document.getElementById("theme-toggle");

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set === "light" || set === "dark") return set;
    return systemPrefersDark() ? "dark" : "light";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* storage blocked: the theme still changes for this visit */
    }
    if (toggle) toggle.setAttribute("aria-pressed", String(theme === "dark"));
  }

  if (toggle) {
    toggle.setAttribute("aria-pressed", String(currentTheme() === "dark"));
    toggle.addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  }

  // ---- topic filter ------------------------------------------------------
  var topics = document.getElementById("topics");
  if (!topics) return;                       // not the projects page

  var tiles = topics.querySelectorAll(".topic");
  var entries = document.querySelectorAll(".entry");
  var years = document.querySelectorAll(".year");
  var emptyNote = document.getElementById("empty");

  function plural(n) {
    return n + (n === 1 ? " project" : " projects");
  }

  function filterBy(topic) {
    var shown = 0;

    entries.forEach(function (entry) {
      var tags = (entry.getAttribute("data-topics") || "").split(" ");
      var match = topic === "all" || tags.indexOf(topic) !== -1;
      entry.hidden = !match;
      if (match) shown += 1;
    });

    years.forEach(function (year) {
      var visible = year.querySelectorAll(".entry:not([hidden])").length;
      year.hidden = visible === 0;
      var count = year.querySelector(".count");
      if (count) count.textContent = plural(visible);
    });

    tiles.forEach(function (tile) {
      tile.setAttribute("aria-pressed", String(tile.getAttribute("data-topic") === topic));
    });

    if (emptyNote) emptyNote.hidden = shown !== 0;
  }

  tiles.forEach(function (tile) {
    tile.addEventListener("click", function () {
      filterBy(tile.getAttribute("data-topic"));
    });
  });

  topics.hidden = false;                     // JavaScript works, so show the tiles
})();
