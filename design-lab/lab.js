// Design lab: pick options on the left, watch the real site (in the iframe) change.
// Every option comes from assets/js/design-data.js, so the lab and the site never disagree.
// The chosen settings are sent to the site with postMessage (see site.js) and kept in this
// browser's localStorage. "Copy settings" gives you JSON to send to Claude.

(function () {
  "use strict";

  var D = window.PortfolioDesign;
  var LAB_KEY = "portfolio-design-lab";
  var ICON_DIR = "assets/icons/";
  var PREVIEW_ICONS = ["tile", "rover", "arm", "robotics", "vision", "magnet"];   // fits one row per card

  var controls = document.getElementById("controls");
  var frame = document.getElementById("frame");
  var frameWrap = document.getElementById("frame-wrap");
  var jsonBox = document.getElementById("json");
  var customInput;
  var radiusInput;
  var radiusOutput;

  var state = load();

  // ---- state -------------------------------------------------------------
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function load() {
    var base = clone(D.DEFAULTS);
    try {
      var saved = JSON.parse(localStorage.getItem(LAB_KEY) || "null");
      if (saved && typeof saved === "object") {
        Object.assign(base, saved);
        base.icons = Object.assign(clone(D.DEFAULTS.icons), saved.icons || {});
        base.icons.overrides = Object.assign({}, (saved.icons || {}).overrides);
      }
    } catch (e) { /* storage blocked or corrupt: start from the defaults */ }
    return base;
  }

  function save() {
    try { localStorage.setItem(LAB_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function effectiveStyle(icon) {
    return state.icons.overrides[icon] || state.icons.base;
  }

  // ---- DOM helpers -------------------------------------------------------
  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function section(title, hint) {
    var box = make("section", "section");
    box.appendChild(make("h2", null, title));
    if (hint) box.appendChild(make("p", "hint", hint));
    controls.appendChild(box);
    return box;
  }

  function grid(parent, columns) {
    var node = make("div", "grid cols" + columns);
    parent.appendChild(node);
    return node;
  }

  // An option button. group + value say what it sets; sync() marks the active one.
  function option(parent, group, value, className) {
    var button = make("button", "opt " + (className || ""));
    button.type = "button";
    button.setAttribute("data-group", group);
    button.setAttribute("data-value", value);
    parent.appendChild(button);
    return button;
  }

  function textOption(parent, group, value, label) {
    var button = option(parent, group, value, "text");
    button.textContent = label;
    return button;
  }

  function iconImg(style, name) {
    var img = document.createElement("img");
    img.src = ICON_DIR + style + "/" + name + ".png";
    img.alt = "";
    img.width = 32;
    img.height = 32;
    return img;
  }

  // ---- change handling ---------------------------------------------------
  function set(group, value) {
    var icons = state.icons;
    if (group === "iconBase") {
      if (value === "css") {
        icons.render = "css";
      } else {
        icons.render = "image";
        icons.base = value;
        icons.overrides = {};
      }
    } else if (group === "iconAll") {
      icons.render = "image";
      icons.base = value;
      icons.overrides = {};
    } else if (group === "iconMix") {
      var parts = value.split("|");
      icons.render = "image";
      if (parts[1] === icons.base) delete icons.overrides[parts[0]];
      else icons.overrides[parts[0]] = parts[1];
    } else if (group === "iconSize") {
      state.iconSize = Number(value);
    } else if (group === "accent") {
      state.accent = value;
      state.customAccent = null;
    } else {
      state[group] = value;
    }
    changed();
  }

  function isActive(group, value) {
    var icons = state.icons;
    switch (group) {
      case "iconBase": return value === "css" ? icons.render === "css" : icons.render === "image" && icons.base === value;
      case "iconAll": return icons.render === "image" && icons.base === value;
      case "iconMix": var p = value.split("|"); return icons.render === "image" && effectiveStyle(p[0]) === p[1];
      case "iconSize": return state.iconSize === Number(value);
      case "accent": return !state.customAccent && state.accent === value;
      default: return String(state[group]) === value;
    }
  }

  function sync() {
    document.querySelectorAll("[data-group]").forEach(function (node) {
      node.setAttribute("aria-pressed", String(isActive(node.getAttribute("data-group"), node.getAttribute("data-value"))));
    });
    // the lab's own --accent follows the chosen colour, so CSS-art tiles preview in it
    var entry = D.ACCENTS[state.accent] || D.ACCENTS.teal;
    document.documentElement.style.setProperty("--accent", state.customAccent || entry.dark);
    if (radiusInput) { radiusInput.value = state.radius; radiusOutput.textContent = state.radius + " px"; }
    if (customInput && state.customAccent) customInput.value = state.customAccent;
    jsonBox.value = JSON.stringify(state, null, 2);
  }

  function push() {
    if (frame.contentWindow) frame.contentWindow.postMessage({ type: "portfolio-design", settings: state }, "*");
  }

  function changed() {
    save();
    sync();
    push();
  }

  // ---- sections ----------------------------------------------------------
  function buildIconStyles() {
    var box = section("Pixel-art style (whole set)",
      "Every icon on the site switches to this style. The last card draws the same icons in pure CSS (box-shadow art).");
    var cards = grid(box, 2);
    D.STYLES.forEach(function (style) {
      var card = option(cards, "iconBase", style.key);
      var strip = make("div", "strip");
      PREVIEW_ICONS.forEach(function (name) { strip.appendChild(iconImg(style.key, name)); });
      card.appendChild(strip);
      card.appendChild(make("span", "label", style.label));
    });
    var css = option(cards, "iconBase", "css");
    var strip = make("div", "strip");
    PREVIEW_ICONS.forEach(function (name) {
      var span = make("span", "sprite spr-" + name);
      strip.appendChild(span);
    });
    css.appendChild(strip);
    css.appendChild(make("span", "label", "CSS art (box-shadow)"));
  }

  function buildMatrix() {
    var box = section("Mix and match",
      "Pick a style for each icon on its own. Click a style name at the top to apply it to every icon.");
    var wrap = make("div", "matrix-wrap");
    var table = make("table", "matrix");

    var head = table.createTHead().insertRow();
    head.appendChild(make("th"));
    D.STYLES.forEach(function (style) {
      var th = make("th");
      var button = make("button", null, style.label);
      button.type = "button";
      button.setAttribute("data-group", "iconAll");
      button.setAttribute("data-value", style.key);
      button.style.opacity = "1";
      th.appendChild(button);
      head.appendChild(th);
    });

    var body = table.createTBody();
    D.ICON_NAMES.forEach(function (name) {
      var row = body.insertRow();
      row.appendChild(make("th", null, name));
      D.STYLES.forEach(function (style) {
        var cell = row.insertCell();
        var button = make("button", "cell");
        button.type = "button";
        button.title = name + " - " + style.label;
        button.setAttribute("data-group", "iconMix");
        button.setAttribute("data-value", name + "|" + style.key);
        button.appendChild(iconImg(style.key, name));
        cell.appendChild(button);
      });
    });

    wrap.appendChild(table);
    box.appendChild(wrap);
  }

  function buildIconSize() {
    var box = section("Icon size", "Size of the icon beside each project. 32 and 64 stay sharpest.");
    var row = grid(box, 3);
    [32, 48, 64].forEach(function (size) { textOption(row, "iconSize", String(size), size + " px"); });
  }

  function buildBanners() {
    var box = section("Banner art (pure CSS)", "A strip of CSS-drawn pattern above the page title. It uses your accent colour.");
    var row = grid(box, 3);
    var none = textOption(row, "banner", "none", "None");
    none.style.minHeight = "5.2rem";
    D.BANNERS.forEach(function (banner) {
      var card = option(row, "banner", banner.key);
      card.appendChild(make("div", "tile-art art art-" + banner.key));
      card.appendChild(make("span", "label", banner.label));
    });
  }

  function buildHeroes() {
    var box = section("Illustration (pure CSS)", "A small CSS-drawn picture at the right of the page title. Built from divs and gradients, no image files.");
    var row = grid(box, 3);
    var none = textOption(row, "hero", "none", "None");
    none.style.minHeight = "9rem";
    D.HEROES.forEach(function (hero) {
      var card = option(row, "hero", hero.key);
      var tile = make("div", "tile-hero");
      tile.innerHTML = '<div class="css-art css-' + hero.key + '"><i></i><i></i><i></i></div>';
      card.appendChild(tile);
      card.appendChild(make("span", "label", hero.label));
    });
  }

  function buildColour() {
    var box = section("Colour and theme", "Visitors can also change these on the site, with the dot and sun buttons.");
    var swatches = grid(box, 4);
    Object.keys(D.ACCENTS).forEach(function (key) {
      var card = option(swatches, "accent", key);
      var chip = make("div", "swatch-lab");
      chip.style.setProperty("--sw", D.ACCENTS[key].dark);
      card.appendChild(chip);
      card.appendChild(make("span", "label", D.ACCENTS[key].label));
    });

    var custom = make("label", "custom-colour", "Or pick any colour ");
    customInput = document.createElement("input");
    customInput.type = "color";
    customInput.value = D.ACCENTS.teal.dark;
    customInput.addEventListener("input", function () {
      state.customAccent = customInput.value;
      changed();
    });
    custom.appendChild(customInput);
    box.appendChild(custom);

    box.appendChild(make("h3", null, "Theme"));
    var themes = grid(box, 3);
    textOption(themes, "theme", "auto", "Auto (system)");
    textOption(themes, "theme", "light", "Light");
    textOption(themes, "theme", "dark", "Dark");
  }

  function buildFonts() {
    var box = section("Typography", "The font for all text on the site. Dates and tags stay monospace.");
    var row = grid(box, 2);
    Object.keys(D.FONTS).forEach(function (key) {
      var card = option(row, "font", key);
      var sample = make("div", "font-sample");
      sample.style.fontFamily = D.FONTS[key].css;
      sample.appendChild(document.createTextNode("Tile Inspection Line"));
      sample.appendChild(make("small", null, D.FONTS[key].label));
      card.appendChild(sample);
    });
  }

  function buildLayout() {
    var box = section("Layout");
    box.appendChild(make("h3", null, "Page layout"));
    var layout = grid(box, 2);
    textOption(layout, "layout", "sidebar", "Sidebar (like tania.dev)");
    textOption(layout, "layout", "top", "Top bar");

    box.appendChild(make("h3", null, "Project entries"));
    var entry = grid(box, 3);
    textOption(entry, "entry", "rows", "Rows");
    textOption(entry, "entry", "cards", "Cards");
    textOption(entry, "entry", "compact", "Compact");

    box.appendChild(make("h3", null, "Spacing"));
    var density = grid(box, 3);
    textOption(density, "density", "compact", "Tight");
    textOption(density, "density", "cozy", "Cozy");
    textOption(density, "density", "roomy", "Roomy");

    box.appendChild(make("h3", null, "Tags"));
    var tags = grid(box, 3);
    textOption(tags, "tags", "pills", "Pills");
    textOption(tags, "tags", "plain", "Plain");
    textOption(tags, "tags", "hidden", "Hidden");

    box.appendChild(make("h3", null, "Corner roundness"));
    var range = make("div", "range");
    radiusInput = document.createElement("input");
    radiusInput.type = "range";
    radiusInput.min = "0";
    radiusInput.max = "24";
    radiusInput.step = "1";
    radiusOutput = document.createElement("output");
    radiusInput.addEventListener("input", function () {
      state.radius = Number(radiusInput.value);
      changed();
    });
    range.appendChild(radiusInput);
    range.appendChild(radiusOutput);
    box.appendChild(range);
  }

  // ---- wiring ------------------------------------------------------------
  document.addEventListener("click", function (event) {
    var node = event.target.closest("[data-group]");
    if (node) set(node.getAttribute("data-group"), node.getAttribute("data-value"));
  });

  document.getElementById("bar-page").addEventListener("click", function (event) {
    var button = event.target.closest("[data-page]");
    if (!button) return;
    frame.src = button.getAttribute("data-page");
    document.querySelectorAll("#bar-page button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === button)); });
  });

  document.getElementById("bar-width").addEventListener("click", function (event) {
    var button = event.target.closest("[data-width]");
    if (!button) return;
    frameWrap.classList.toggle("phone", button.getAttribute("data-width") === "phone");
    document.querySelectorAll("#bar-width button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === button)); });
  });

  document.getElementById("reset").addEventListener("click", function () {
    state = clone(D.DEFAULTS);
    changed();
  });

  document.getElementById("copy").addEventListener("click", function () {
    var button = this;
    var done = function (ok) {
      button.textContent = ok ? "Copied!" : "Select the JSON below";
      if (!ok) { document.getElementById("json-box").open = true; jsonBox.select(); }
      setTimeout(function () { button.textContent = "Copy settings"; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonBox.value).then(function () { done(true); }, function () { done(false); });
    } else {
      done(false);
    }
  });

  document.getElementById("download").addEventListener("click", function () {
    var blob = new Blob([jsonBox.value], { type: "application/json" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "design-settings.json";
    link.click();
    URL.revokeObjectURL(link.href);
  });

  frame.addEventListener("load", push);

  buildIconStyles();
  buildMatrix();
  buildIconSize();
  buildBanners();
  buildHeroes();
  buildColour();
  buildFonts();
  buildLayout();
  sync();
})();
