/* Shared behaviour for every project page (pairs with base.css).
   Load it in <head> with `defer` NOT set, so the theme is applied before first paint:
     <script src="../../_shared/base.js"></script>
   It does five things:
     1. Applies the saved theme (same key as the landing page, "portfolio-ui") and wires the theme button (.pbtn.theme).
     2. Applies the accent colour chosen on the landing page (falls back to the CSS default, teal).
     3. Builds the section list (rail on wide screens, drawer behind a "Sections" button on narrow ones) from the page's <h2>s.
     4. Opens any a.zoom link in one shared <dialog> lightbox.
     5. Builds the previous / next project links from PROJECTS below.
   6. Motion: marks the top bar once the page scrolls, draws the reading-progress line, and eases each section's content in as it
      scrolls into view (skipped entirely when the visitor prefers reduced motion; the CSS then shows everything at once).
   To add a project: add a line to PROJECTS (landing-page order) and nothing else. */
(function () {
  "use strict";
  var KEY = "portfolio-ui";
  var root = document.documentElement;

  var PROJECTS = [   // landing-page order; id matches <html data-project="...">, dir is the folder under projects/
    { id: "magnet",  dir: "magnet-inserter",    name: "Magnet-Embed Print Assistant" },
    { id: "ros",     dir: "ros-lab",            name: "ROS 2 Mobile Robots" },
    { id: "tile",    dir: "tile-inspection",    name: "Tile Inspection Line" },
    { id: "arm",     dir: "plc-2dof-arm",       name: "PLC 2-DOF Robotic Arm" },
    { id: "sleepy",  dir: "sleepy",             name: "SLEEPY Assistant" },
    { id: "herc",    dir: "herc-26",            name: "HERC-26 Rover" },
    { id: "enigma",  dir: "myownenigma",        name: "MyOwnEnigma" },
    { id: "traffic", dir: "traffic-management", name: "Look-Ahead Signals" }
  ];
  var DEFAULT_ACCENT = { light: "#0b7a6f", dark: "#35d0c0" };   // same as DEFAULTS in assets/js/design-data.js

  /* ---------- storage ---------- */
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function writeTheme(theme) { try { var s = read(); s.theme = theme; localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage blocked: fine */ } }

  /* ---------- 1. theme ---------- */
  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t) return t === "dark";
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
  var motionOk = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) && "IntersectionObserver" in window;
  if (motionOk) root.classList.add("rv-ready");   // set before first paint so sections do not flash; undone below if anything fails
  var saved = read().theme;
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

  /* ---------- 2. accent ---------- */
  function hex(v) { return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : null; }
  function applyAccent() {
    var c = read().colours || {}, dark = isDark();
    var col = hex(dark ? c.dark : c.light) || DEFAULT_ACCENT[dark ? "dark" : "light"];
    root.style.setProperty("--accent", col);
    root.style.setProperty("--accent-ink", dark ? "#1d1e24" : "#ffffff");
  }
  applyAccent();
  window.addEventListener("storage", applyAccent);   // colour changed in another tab
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", applyAccent);
  }

  function labelTheme(btn) {
    var dark = isDark();
    btn.textContent = dark ? "Light" : "Dark";
    btn.setAttribute("aria-label", dark ? "Switch to the light theme" : "Switch to the dark theme");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btns = Array.prototype.slice.call(document.querySelectorAll(".pbtn.theme"));
    btns.forEach(function (btn) {
      labelTheme(btn);
      btn.addEventListener("click", function () {
        var next = isDark() ? "light" : "dark";
        root.setAttribute("data-theme", next);
        writeTheme(next);
      });
    });
    if (window.MutationObserver) {   // data-theme changed (by the button, or another script)
      new MutationObserver(function () { btns.forEach(labelTheme); applyAccent(); })
        .observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    }
    buildNext();
    buildNav();
    buildLightbox();
    try { buildNumbers(); } catch (e) { /* numbers are decoration */ }
    try { buildMotion(); } catch (e) { root.classList.remove("rv-ready"); }   // never leave content hidden
  });

  /* ---------- 5. previous / next project links ---------- */
  function buildNext() {
    var id = root.getAttribute("data-project"), k = -1;
    PROJECTS.forEach(function (p, i) { if (p.id === id) k = i; });
    if (k < 0) return;
    var prev = PROJECTS[(k + PROJECTS.length - 1) % PROJECTS.length], next = PROJECTS[(k + 1) % PROJECTS.length];
    function href(p) { return "../../" + p.dir + "/site/index.html"; }
    var nav = document.createElement("nav");
    nav.className = "pnext";
    nav.setAttribute("aria-label", "More projects");
    nav.innerHTML = '<div class="pwrap"><a href="' + href(prev) + '"><span>← Previous</span><b></b></a>' +
      '<a href="' + href(next) + '"><span>Next →</span><b></b></a>' +
      '<a class="all" href="../../../index.html">All projects</a></div>';
    var names = nav.querySelectorAll("b");
    names[0].textContent = prev.name;   // textContent, not innerHTML: names are data
    names[1].textContent = next.name;
    document.body.appendChild(nav);
  }

  /* ---------- 3. section list ---------- */
  var RAIL_W = 200, RAIL_GAP = 24;   // px: rail mode needs this much empty margin left of the content

  function slug(t) { return "s-" + t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48); }

  function buildNav() {
    var heads = Array.prototype.filter.call(document.querySelectorAll("main h2"), function (h) {
      return !h.closest("dialog, [hidden], template") && h.textContent.trim();
    });
    if (heads.length < 2) return;

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
    nav.className = "pnav";
    nav.id = "pnav";
    nav.setAttribute("aria-label", "Sections on this page");
    nav.tabIndex = -1;   // takes focus when the drawer opens, so Tab goes straight into the list
    nav.innerHTML = '<div class="pnav-head"><span>On this page</span><button type="button" class="pnav-x" aria-label="Close the section list">×</button></div>' +
      '<a class="top" href="#top">↑ Top</a><ol></ol>';
    var ol = nav.querySelector("ol");
    items.forEach(function (it) {
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = "#" + it.id;
      a.textContent = it.text;
      li.appendChild(a);
      ol.appendChild(li);
      it.a = a;
    });
    var ind = document.createElement("span");   // the sliding marker beside the current section
    ind.className = "pnav-ind";
    ind.setAttribute("aria-hidden", "true");
    nav.appendChild(ind);
    document.body.appendChild(nav);

    var shade = document.createElement("div");
    shade.className = "pshade";
    document.body.appendChild(shade);

    var bar = document.querySelector(".pbar .pwrap"), btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pbtn pnav-btn";
    btn.textContent = "Sections";
    btn.setAttribute("aria-controls", "pnav");
    btn.setAttribute("aria-expanded", "false");
    if (bar) bar.insertBefore(btn, bar.querySelector(".sp"));

    if (!document.getElementById("top")) {
      var top = document.createElement("span");
      top.id = "top";
      document.body.insertBefore(top, document.body.firstChild);
    }

    function open(on) {
      root.classList.toggle("pnav-open", on);
      btn.setAttribute("aria-expanded", String(on));
      place(true);
      if (on) nav.focus({ preventScroll: true });
      else if (document.activeElement && nav.contains(document.activeElement)) btn.focus();
    }
    btn.addEventListener("click", function () { open(!root.classList.contains("pnav-open")); });
    shade.addEventListener("click", function () { open(false); });
    nav.querySelector(".pnav-x").addEventListener("click", function () { open(false); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a") && !root.classList.contains("prail")) open(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && root.classList.contains("pnav-open")) open(false); });

    var h1 = document.querySelector("h1");
    function layout() {
      var left = h1 ? h1.getBoundingClientRect().left + window.scrollX : 0;
      var rail = left >= RAIL_W + RAIL_GAP + 16;
      root.classList.toggle("prail", rail);
      if (rail) { nav.style.left = Math.max(16, left - RAIL_W - RAIL_GAP) + "px"; open(false); }
      else nav.style.left = "";
    }
    layout();
    window.addEventListener("resize", layout);
    window.addEventListener("load", function () { layout(); spy(); place(true); });
    window.addEventListener("resize", function () { place(true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(true); });

    var curItem = null;
    function place(instant) {   // put the marker beside the current link; instant = no slide (first placement, layout changes)
      if (!curItem) { ind.classList.remove("on"); return; }
      var a = curItem.a;
      if (instant) ind.style.transition = "none";
      ind.style.height = a.offsetHeight + "px";
      ind.style.transform = "translate(" + a.offsetLeft + "px," + a.offsetTop + "px)";
      if (instant) { void ind.offsetWidth; ind.style.transition = ""; }
      ind.classList.add("on");
    }
    var ticking = false;
    function spy() {   // highlight the section being read
      ticking = false;
      var line = Math.min(160, window.innerHeight * 0.3), cur = null;
      items.forEach(function (it) { if (it.el.getBoundingClientRect().top <= line) cur = it; });
      items.forEach(function (it) { if (it === cur) it.a.setAttribute("aria-current", "true"); else it.a.removeAttribute("aria-current"); });
      curItem = cur;
      place(!ind.classList.contains("on"));   // first appearance: put it in position, do not fly in from the corner
      if (cur && root.classList.contains("prail")) {
        var r = cur.a.getBoundingClientRect(), n = nav.getBoundingClientRect();
        if (r.top < n.top + 40 || r.bottom > n.bottom - 10) nav.scrollTop += r.top - n.top - n.height / 3;
      }
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    spy();
  }

  /* ---------- 6a. section numbers ---------- */
  function buildNumbers() {
    var n = 0;
    Array.prototype.forEach.call(document.querySelectorAll("main .block"), function (sec) {
      var h = sec.querySelector("h2");
      if (!h) return;
      var label = String(++n).padStart(2, "0"), eb = sec.querySelector(".eyebrow");
      if (eb && !/^\d\d\s*·/.test(eb.textContent)) eb.insertBefore(document.createTextNode(label + " · "), eb.firstChild);
      else if (!eb) h.setAttribute("data-n", label);
    });
  }

  /* ---------- 6. motion ---------- */
  function buildMotion() {
    var bar = document.querySelector(".pbar"), ticking = false;
    function tick() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight, y = window.scrollY || 0;
      root.style.setProperty("--p", max > 0 ? Math.min(1, Math.max(0, y / max)).toFixed(4) : "0");
      if (bar) bar.classList.toggle("scrolled", y > 8);
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }, { passive: true });
    window.addEventListener("resize", tick);
    tick();

    if (!root.classList.contains("rv-ready")) return;
    var items = document.querySelectorAll(".block > *");
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.transitionDelay = Math.min(n++, 4) * 70 + "ms";   // items arriving together ripple in
        e.target.classList.add("in");
        (function (t) { setTimeout(function () { t.style.transitionDelay = ""; }, 1500); })(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ---------- 4. lightbox ---------- */
  // One delegated click handler, so a.zoom links added after load (galleries built by a page's own script) work too.
  function buildLightbox() {
    if (typeof HTMLDialogElement === "undefined") return;   // without it the link just opens the image
    var dlg = null, img, cap;
    function make() {
      dlg = document.createElement("dialog");
      dlg.className = "lightbox";
      dlg.setAttribute("aria-label", "Enlarged image");
      dlg.innerHTML = '<form method="dialog"><button class="pbtn lb-x" aria-label="Close">Close</button></form><img alt=""><div class="lb-cap"></div>';
      document.body.appendChild(dlg);
      img = dlg.querySelector("img");
      cap = dlg.querySelector(".lb-cap");
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });   // click on the backdrop
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a.zoom");
      if (!a || !a.getAttribute("href")) return;
      e.preventDefault();
      if (!dlg) make();
      var thumb = a.querySelector("img"), fig = a.closest("figure"), fc = fig && fig.querySelector("figcaption");
      img.src = a.getAttribute("href");
      img.alt = thumb ? thumb.alt : "";
      cap.textContent = fc ? fc.textContent : "";
      dlg.showModal();
    });
  }
})();
