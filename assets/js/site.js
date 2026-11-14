// Portfolio behaviour, shared by every page.
//   1. Applies the chosen design (DEFAULTS in design-data.js), plus the visitor's own colour and theme.
//   2. Colour and theme controls in the sidebar (remembered in the visitor's browser).
//   3. Live updates from the design lab, which shows this page in an iframe.
//   4. Topic filter on the projects page.
// Everything is an extra: the pages read fine with JavaScript turned off.

(function () {
  "use strict";

  var D = window.PortfolioDesign;
  var root = document.documentElement;
  root.classList.add("js");
  if (!D) return;                                  // design-data.js missing: leave the plain page as is

  var STORE_KEY = "portfolio-ui";                  // visitor choices: { theme, accent }
  var ICON_DIR = "design-lab/assets/icons/";
  var SPRITES_HREF = "design-lab/assets/sprites.css";
  var DARK_INK = "#1d1e24";

  var settings = merge(D.DEFAULTS, readVisitor());
  var fromLab = false;                             // true once the lab has sent settings
  var loadedFonts = {};

  // ---- helpers -----------------------------------------------------------
  function $(selector) { return document.querySelector(selector); }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function merge(base, extra) {
    var out = clone(base);
    Object.keys(extra || {}).forEach(function (key) {
      if (key === "icons" && extra.icons) {
        out.icons = Object.assign({}, out.icons, extra.icons);
        out.icons.overrides = Object.assign({}, base.icons.overrides, extra.icons.overrides);
      } else {
        out[key] = extra[key];
      }
    });
    return out;
  }

  function readVisitor() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      var out = {};
      if (["auto", "light", "dark"].indexOf(saved.theme) !== -1) out.theme = saved.theme;
      if (D.ACCENTS[saved.accent]) out.accent = saved.accent;
      return out;
    } catch (e) {
      return {};                                   // storage blocked or corrupt: use the defaults
    }
  }

  function saveVisitor() {
    if (fromLab) return;                           // the lab previews; it must not touch saved choices
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ theme: settings.theme, accent: settings.accent }));
    } catch (e) { /* storage blocked: the choice still applies for this visit */ }
  }

  function systemPrefersDark() {
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function isDark() {
    return settings.theme === "dark" || (settings.theme === "auto" && systemPrefersDark());
  }

  function accentColour() {
    if (settings.customAccent) return settings.customAccent;
    var entry = D.ACCENTS[settings.accent] || D.ACCENTS.teal;
    return isDark() ? entry.dark : entry.light;
  }

  function loadFont(font) {
    if (!font || !font.gf || loadedFonts[font.gf]) return;
    loadedFonts[font.gf] = true;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=" + font.gf + "&display=swap";
    document.head.appendChild(link);
  }

  function loadSprites() {
    if (document.querySelector('link[data-sprites]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = SPRITES_HREF;
    link.setAttribute("data-sprites", "");
    document.head.appendChild(link);
  }

  // ---- apply the settings to the page -----------------------------------
  function applyIcons() {
    var asCss = settings.icons.render === "css";
    if (asCss) loadSprites();

    document.querySelectorAll("img.ico[data-icon]").forEach(function (img) {
      var name = img.getAttribute("data-icon");
      var style = settings.icons.overrides[name] || settings.icons.base;
      if (!img.hasAttribute("data-orig")) img.setAttribute("data-orig", img.getAttribute("src"));
      img.src = style === "classic" ? img.getAttribute("data-orig") : ICON_DIR + style + "/" + name + ".png";

      var next = img.nextElementSibling;
      var sprite = next && next.classList.contains("sprite") ? next : null;
      if (asCss) {
        if (!sprite) {
          sprite = document.createElement("span");
          sprite.setAttribute("aria-hidden", "true");
          img.insertAdjacentElement("afterend", sprite);
        }
        var big = settings.iconSize === 64 && img.parentElement && img.parentElement.classList.contains("entry");
        sprite.className = "sprite spr-" + name + (big ? " s2" : "");
        sprite.hidden = false;
        img.hidden = true;
      } else {
        if (sprite) sprite.hidden = true;
        img.hidden = false;
      }
    });
  }

  function applyArt() {
    var banner = $(".banner");
    if (banner) {
      banner.className = "banner art" + (settings.banner !== "none" ? " art-" + settings.banner : "");
      banner.hidden = settings.banner === "none";
    }
    var slot = $(".hero-slot");
    if (slot) {
      if (settings.hero === "none") {
        slot.hidden = true;
        slot.textContent = "";
      } else {
        slot.hidden = false;
        slot.innerHTML = '<div class="css-art css-' + settings.hero + '" aria-hidden="true"><i></i><i></i><i></i></div>';
      }
    }
  }

  function apply() {
    // theme: "auto" removes the attribute so the system setting decides
    if (settings.theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", settings.theme);

    var colour = accentColour();
    root.style.setProperty("--accent", colour);
    root.style.setProperty("--accent-ink", isDark() ? DARK_INK : "#ffffff");

    var font = D.FONTS[settings.font] || D.FONTS.inter;
    loadFont(font);
    root.style.setProperty("--font-body", font.css);

    root.setAttribute("data-layout", settings.layout);
    root.setAttribute("data-entry", settings.entry);
    root.setAttribute("data-density", settings.density);
    root.setAttribute("data-tags", settings.tags);
    root.style.setProperty("--radius", settings.radius + "px");

    // CSS box-shadow icons only stay sharp at 32px and 64px
    var size = settings.icons.render === "css" && settings.iconSize === 48 ? 32 : settings.iconSize;
    root.style.setProperty("--icon-size", size + "px");

    applyIcons();
    applyArt();
    refreshControls();
  }

  // ---- colour and theme controls ----------------------------------------
  var colourButton = $("#colour-btn");
  var popover = $("#popover");
  var swatchBox = $("#swatches");
  var themeBox = $("#themes");
  var toggle = $("#theme-toggle");

  var THEME_CHOICES = [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]];

  function buildControls() {
    if (swatchBox) {
      Object.keys(D.ACCENTS).forEach(function (key) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "swatch";
        button.setAttribute("data-accent", key);
        button.setAttribute("aria-label", D.ACCENTS[key].label);
        button.addEventListener("click", function () {
          settings.accent = key;
          settings.customAccent = null;
          saveVisitor();
          apply();
        });
        swatchBox.appendChild(button);
      });
    }
    if (themeBox) {
      THEME_CHOICES.forEach(function (choice) {
        var button = document.createElement("button");
        button.type = "button";
        button.setAttribute("data-theme-choice", choice[0]);
        button.textContent = choice[1];
        button.addEventListener("click", function () { setTheme(choice[0]); });
        themeBox.appendChild(button);
      });
    }
  }

  function refreshControls() {
    var dark = isDark();
    document.querySelectorAll(".swatch").forEach(function (button) {
      var key = button.getAttribute("data-accent");
      button.style.setProperty("--sw", dark ? D.ACCENTS[key].dark : D.ACCENTS[key].light);
      button.setAttribute("aria-pressed", String(!settings.customAccent && key === settings.accent));
    });
    document.querySelectorAll("[data-theme-choice]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-theme-choice") === settings.theme));
    });
    if (toggle) toggle.setAttribute("aria-pressed", String(dark));
  }

  function setTheme(theme) {
    settings.theme = theme;
    saveVisitor();
    apply();
  }

  function setPopover(open) {
    if (!popover || !colourButton) return;
    popover.hidden = !open;
    colourButton.setAttribute("aria-expanded", String(open));
  }

  if (toggle) {
    toggle.addEventListener("click", function () { setTheme(isDark() ? "light" : "dark"); });
  }
  if (colourButton && popover) {
    colourButton.addEventListener("click", function (event) {
      event.stopPropagation();
      setPopover(popover.hidden);
    });
    document.addEventListener("click", function (event) {
      if (!popover.hidden && !popover.contains(event.target)) setPopover(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !popover.hidden) {
        setPopover(false);
        colourButton.focus();
      }
    });
  }

  if (window.matchMedia) {                         // follow the system when the theme is "auto"
    var query = window.matchMedia("(prefers-color-scheme: dark)");
    var onSystemChange = function () { if (settings.theme === "auto") apply(); };
    if (query.addEventListener) query.addEventListener("change", onSystemChange);
  }

  // ---- live updates from the design lab ---------------------------------
  window.addEventListener("message", function (event) {
    if (window.parent === window || event.source !== window.parent) return;   // only our parent frame
    var data = event.data;
    if (!data || data.type !== "portfolio-design" || typeof data.settings !== "object") return;
    fromLab = true;
    settings = merge(D.DEFAULTS, data.settings);
    apply();
  });

  // ---- topic filter (projects page) -------------------------------------
  function setUpFilter() {
    var topics = $("#topics");
    if (!topics) return;                           // not the projects page

    var tiles = topics.querySelectorAll(".topic");
    var entries = document.querySelectorAll(".entry");
    var years = document.querySelectorAll(".year");
    var emptyNote = $("#empty");

    function plural(n) { return n + (n === 1 ? " project" : " projects"); }

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
      tile.addEventListener("click", function () { filterBy(tile.getAttribute("data-topic")); });
    });
    topics.hidden = false;                         // JavaScript works, so show the chips
  }

  buildControls();
  setUpFilter();
  apply();
})();
