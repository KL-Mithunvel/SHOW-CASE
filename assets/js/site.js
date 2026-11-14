// Landing page behaviour: theme toggle and "which section am I in" nav highlight.
// Everything else on the page works with JavaScript turned off.

(function () {
  "use strict";

  var THEME_KEY = "theme";

  // ---- theme toggle ------------------------------------------------------
  var root = document.documentElement;
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

  // ---- nav highlight -----------------------------------------------------
  var links = document.querySelectorAll(".nav a[data-section]");
  var sections = [];
  links.forEach(function (link) {
    var el = document.getElementById(link.getAttribute("data-section"));
    if (el) sections.push({ link: link, el: el });
  });

  function setActive(link) {
    links.forEach(function (l) {
      if (l === link) l.classList.add("active");
      else l.classList.remove("active");
    });
  }

  if (sections.length && "IntersectionObserver" in window) {
    // A section counts as "current" while it crosses a band near the top of the viewport.
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var match = sections.find(function (s) { return s.el === entry.target; });
          if (match) setActive(match.link);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    sections.forEach(function (s) { observer.observe(s.el); });
  }
})();
