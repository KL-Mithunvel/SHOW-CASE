/* Shared behaviour for every project page: applies the saved theme before first paint,
   then wires the theme button in the shared top bar.
   The theme is stored under the same key as the landing page ("portfolio-ui"),
   so a choice made on any page carries over to the others. */
(function () {
  "use strict";
  var KEY = "portfolio-ui";
  var root = document.documentElement;

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function write(theme) {
    try { var s = read(); s.theme = theme; localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage blocked: fine */ }
  }
  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t) return t === "dark";
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  var saved = read().theme;
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

  /* Accent colour: the landing page saves the chosen colour (both its light and dark value) under
     "portfolio-ui"; with no saved choice, use the site default (teal, same as DEFAULTS in
     assets/js/design-data.js). The page's own main accent is bridged to it in showcase.css. */
  var DEFAULT_ACCENT = { light: "#0b7a6f", dark: "#35d0c0" };
  function hex(v) { return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : null; }
  function applyAccent() {
    var c = read().colours || {};
    var dark = isDark();
    var col = hex(dark ? c.dark : c.light) || DEFAULT_ACCENT[dark ? "dark" : "light"];
    var s = root.style;
    s.setProperty("--sc-accent", col);
    s.setProperty("--sc-accent-ink", dark ? "#1d1e24" : "#ffffff");
    s.setProperty("--sc-accent-soft", "color-mix(in srgb, " + col + " " + (dark ? "22%" : "14%") + ", var(--sc-sheet))");
    root.classList.add("sc-accent");
  }
  applyAccent();
  window.addEventListener("storage", applyAccent);   // colour changed in another tab
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", applyAccent);
  }

  function label(btn) {
    var dark = isDark();
    btn.textContent = dark ? "Light" : "Dark";
    btn.setAttribute("aria-label", dark ? "Switch to the light theme" : "Switch to the dark theme");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btns = document.querySelectorAll(".sc-theme");
    Array.prototype.forEach.call(btns, function (btn) {
      label(btn);
      btn.addEventListener("click", function () {
        var next = isDark() ? "light" : "dark";
        root.setAttribute("data-theme", next);
        write(next);
        Array.prototype.forEach.call(btns, label);
      });
    });
    // Keep the label right if the page's own controls or the system change the theme.
    if (window.MutationObserver) {
      new MutationObserver(function () { Array.prototype.forEach.call(btns, label); applyAccent(); })
        .observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    }
    buildNav();
  });

  /* ---------- Side navigation ----------
     Built from the page's own <h2> section headings, so no page needs editing.
     Wide screens: a fixed list in the empty left margin, shown only when the margin is wide enough.
     Narrow screens: a "Sections" button in the top bar opens the same list as a drawer. */
  var RAIL_W = 200, RAIL_GAP = 24;

  function slug(t) {
    return "s-" + t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  }

  function buildNav() {
    var heads = Array.prototype.filter.call(document.querySelectorAll("h2"), function (h) {
      return !h.closest(".sc-bar, .sc-foot, .sc-nav, dialog, [hidden], template") && h.textContent.trim();
    });
    if (heads.length < 2) return;

    // Each entry points at the heading's section if it has an id, else at the heading itself.
    var used = {};
    var items = heads.map(function (h) {
      var sec = h.closest("section[id]");
      var target = sec && !used[sec.id] ? sec : h;
      if (!target.id) {
        var id = slug(h.textContent), n = 2;
        while (document.getElementById(id)) id = slug(h.textContent) + "-" + n++;
        target.id = id;
      }
      used[target.id] = 1;
      return { id: target.id, el: target, text: h.textContent.replace(/\s+/g, " ").trim() };
    });

    var nav = document.createElement("nav");
    nav.className = "sc-nav";
    nav.id = "sc-nav";
    nav.setAttribute("aria-label", "Sections on this page");
    nav.tabIndex = -1; // receives focus when the drawer opens, so Tab moves straight into the list
    nav.innerHTML = '<div class="sc-nav-head"><span>On this page</span>' +
      '<button type="button" class="sc-nav-x" aria-label="Close the section list">×</button></div>' +
      '<a class="sc-nav-top" href="#top">↑ Top</a><ol></ol>';
    var ol = nav.querySelector("ol");
    items.forEach(function (it) {
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = "#" + it.id;
      a.textContent = it.text;
      li.appendChild(a);
      ol.appendChild(li);
      it.a = a;
    });
    document.body.appendChild(nav);

    var shade = document.createElement("div");
    shade.className = "sc-shade";
    shade.hidden = true;
    document.body.appendChild(shade);

    // "Sections" button in the shared top bar
    var bar = document.querySelector(".sc-bar .sc-in");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sc-theme sc-nav-btn";
    btn.textContent = "Sections";
    btn.setAttribute("aria-controls", "sc-nav");
    btn.setAttribute("aria-expanded", "false");
    if (bar) bar.insertBefore(btn, bar.querySelector(".sc-sp"));

    // "Top" target
    if (!document.getElementById("top")) {
      var top = document.createElement("span");
      top.id = "top";
      document.body.insertBefore(top, document.body.firstChild);
    }

    function open(on) {
      root.classList.toggle("sc-nav-open", on);
      shade.hidden = !on;
      btn.setAttribute("aria-expanded", String(on));
      if (on) nav.focus({ preventScroll: true }); else if (document.activeElement && nav.contains(document.activeElement)) btn.focus();
    }
    btn.addEventListener("click", function () { open(!root.classList.contains("sc-nav-open")); });
    shade.addEventListener("click", function () { open(false); });
    nav.querySelector(".sc-nav-x").addEventListener("click", function () { open(false); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a") && !root.classList.contains("sc-rail")) open(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && root.classList.contains("sc-nav-open")) open(false); });

    // Rail mode when the left margin beside the page's content is wide enough.
    var h1 = document.querySelector("h1");
    function layout() {
      var left = h1 ? h1.getBoundingClientRect().left + window.scrollX : 0;
      var rail = left >= RAIL_W + RAIL_GAP + 16;
      root.classList.toggle("sc-rail", rail);
      if (rail) { nav.style.left = Math.max(16, left - RAIL_W - RAIL_GAP) + "px"; open(false); }
      else nav.style.left = "";
    }
    layout();
    window.addEventListener("resize", layout);
    window.addEventListener("load", layout);

    // Highlight the section being read.
    var ticking = false;
    function spy() {
      ticking = false;
      var line = Math.min(160, window.innerHeight * 0.3), cur = null;
      items.forEach(function (it) { if (it.el.getBoundingClientRect().top <= line) cur = it; });
      items.forEach(function (it) {
        if (it === cur) it.a.setAttribute("aria-current", "true"); else it.a.removeAttribute("aria-current");
      });
      if (cur && root.classList.contains("sc-rail")) {
        var r = cur.a.getBoundingClientRect(), n = nav.getBoundingClientRect();
        if (r.top < n.top + 40 || r.bottom > n.bottom - 10) nav.scrollTop += r.top - n.top - n.height / 3;
      }
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    spy();
  }
})();
