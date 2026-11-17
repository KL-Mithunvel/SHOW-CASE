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

  var STORE_KEY = "portfolio-ui";                  // visitor choices: { theme, accent, colours }
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
      // "colours" lets the project pages (projects/_shared/showcase.js) use the same accent without loading design-data.js.
      var entry = D.ACCENTS[settings.accent] || D.ACCENTS.teal;
      localStorage.setItem(STORE_KEY, JSON.stringify({
        theme: settings.theme, accent: settings.accent, colours: { light: entry.light, dark: entry.dark }
      }));
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

  // ---- recolour the PNG icons -------------------------------------------
  // The icons are drawn with teal as their brand colour. Every teal pixel (hue 150-195, clearly
  // saturated) is moved to the accent's hue; greys, ambers, reds and so on stay as drawn.
  // Needs the page served over http(s): on file:// the browser blocks reading pixels, and the
  // icons simply keep their original colours.
  var TEAL_HUE = 174;
  var tinted = {};                                 // "url|#rrggbb" -> data URL

  function hexToHsl(hex) {
    var n = parseInt(hex.slice(1), 16);
    return rgbToHsl((n >> 16) & 255, (n >> 8) & 255, n & 255);
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, h = 0, s = 0, d = max - min;
    if (d) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else h = ((r - g) / d + 4) * 60;
    }
    return [h, s, l];
  }

  function hslToRgb(h, s, l) {
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }

  function needsTint(hex) {
    var hue = hexToHsl(hex)[0];
    return Math.abs(hue - TEAL_HUE) > 4;
  }

  function tintUrl(url, hex, done) {
    var key = url + "|" + hex;
    if (tinted[key]) return done(tinted[key]);
    var src = new Image();
    src.onload = function () {
      try {
        var canvas = document.createElement("canvas");
        canvas.width = src.naturalWidth;
        canvas.height = src.naturalHeight;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(src, 0, 0);
        var image = ctx.getImageData(0, 0, canvas.width, canvas.height), px = image.data;
        var target = hexToHsl(hex), satScale = Math.min(1.25, target[1] / 0.65);
        for (var i = 0; i < px.length; i += 4) {
          if (!px[i + 3]) continue;
          var hsl = rgbToHsl(px[i], px[i + 1], px[i + 2]);
          if (hsl[0] < 150 || hsl[0] > 195 || hsl[1] < 0.25) continue;
          var rgb = hslToRgb(target[0], Math.min(1, hsl[1] * satScale), hsl[2]);
          px[i] = rgb[0]; px[i + 1] = rgb[1]; px[i + 2] = rgb[2];
        }
        ctx.putImageData(image, 0, 0);
        tinted[key] = canvas.toDataURL("image/png");
        done(tinted[key]);
      } catch (e) { /* pixels not readable (file://): keep the original colours */ }
    };
    src.src = url;
  }

  // Show `url` on `target` (an <img> or the favicon <link>), recoloured to the current accent.
  function showTinted(target, attr, url) {
    var hex = accentColour();
    target.setAttribute(attr, url);
    if (!needsTint(hex)) return;
    var want = url + "|" + hex;
    target.setAttribute("data-want", want);
    tintUrl(url, hex, function (data) {
      if (target.getAttribute("data-want") === want) target.setAttribute(attr, data);
    });
  }

  // ---- apply the settings to the page -----------------------------------
  function applyIcons() {
    var asCss = settings.icons.render === "css";
    if (asCss) loadSprites();

    document.querySelectorAll("img.ico[data-icon]").forEach(function (img) {
      var name = img.getAttribute("data-icon");
      var style = settings.icons.overrides[name] || settings.icons.base;
      if (!img.hasAttribute("data-orig")) img.setAttribute("data-orig", img.getAttribute("src"));
      showTinted(img, "src", style === "classic" ? img.getAttribute("data-orig") : ICON_DIR + style + "/" + name + ".png");

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

  function applyFavicon() {
    var link = $('link[rel="icon"]');
    if (!link) return;
    if (!link.hasAttribute("data-orig")) link.setAttribute("data-orig", link.getAttribute("href"));
    showTinted(link, "href", link.getAttribute("data-orig"));
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
    applyFavicon();
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

  // ---- section links (profile / projects) --------------------------------
  // The sidebar links jump to a section; the one being read gets aria-current as you scroll.
  function setUpSectionLinks() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    if (!links.length || sections.indexOf(null) !== -1) return;

    var ticking = false;
    function update() {
      ticking = false;
      var line = window.innerHeight * 0.35, current = 0;
      sections.forEach(function (sec, i) { if (sec.getBoundingClientRect().top <= line) current = i; });
      var atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atEnd) current = sections.length - 1;
      links.forEach(function (a, i) {
        if (i === current) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
      });
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  buildControls();
  setUpFilter();
  setUpSectionLinks();
  apply();
})();
