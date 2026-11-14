// Single source of truth for every design option.
// Used by the site (assets/js/site.js) and by the design lab (design-lab/lab.js).
//
// DEFAULTS is the owner's chosen look. To change the site's look, edit DEFAULTS
// (or paste the settings JSON the design lab gives you). Visitors can only change
// "theme" and "accent" themselves; those are remembered in their own browser.

window.PortfolioDesign = (function () {
  "use strict";

  var ICON_NAMES = [
    "tile", "rover", "traffic", "enigma", "arm", "ros", "magnet", "logo",
    "projects", "about", "robotics", "vision", "embedded", "control", "simulation", "cad"
  ];

  // Pixel-art icon styles (folders in design-lab/assets/icons/). "classic" is also the site default set.
  var STYLES = [
    { key: "classic", label: "Classic" },
    { key: "soft", label: "Soft pastel" },
    { key: "flat", label: "Flat" },
    { key: "line", label: "Line art" },
    { key: "neon", label: "Neon" },
    { key: "candy", label: "Candy" },
    { key: "earth", label: "Earth" },
    { key: "gameboy", label: "Game Boy" },
    { key: "mono", label: "Mono ink" },
    { key: "synthwave", label: "Synthwave" },
    { key: "sepia", label: "Sepia" },
    { key: "blueprint", label: "Blueprint" }
  ];

  // Accent colours: one value for the light theme, one for the dark theme (both checked for text contrast).
  var ACCENTS = {
    teal:   { label: "Teal",   light: "#0b7a6f", dark: "#35d0c0" },
    coral:  { label: "Coral",  light: "#c0392b", dark: "#ff7b72" },
    blue:   { label: "Blue",   light: "#1d5fc4", dark: "#6cb0ff" },
    violet: { label: "Violet", light: "#6a45c9", dark: "#b79bff" },
    amber:  { label: "Amber",  light: "#9a5b00", dark: "#ffb84d" },
    green:  { label: "Green",  light: "#2b7a30", dark: "#6fdc7a" },
    pink:   { label: "Pink",   light: "#b4286f", dark: "#ff7eb8" },
    slate:  { label: "Slate",  light: "#3b4a66", dark: "#a9b8d6" }
  };

  // Body fonts. "gf" is the Google Fonts family spec (null = already on the device).
  var FONTS = {
    inter:  { label: "Inter",         css: '"Inter", system-ui, sans-serif',         gf: "Inter:wght@400;500;600;700" },
    system: { label: "System",        css: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', gf: null },
    plex:   { label: "IBM Plex Sans", css: '"IBM Plex Sans", system-ui, sans-serif', gf: "IBM+Plex+Sans:wght@400;500;600;700" },
    source: { label: "Source Sans",   css: '"Source Sans 3", system-ui, sans-serif', gf: "Source+Sans+3:wght@400;500;600;700" },
    dmsans: { label: "DM Sans",       css: '"DM Sans", system-ui, sans-serif',       gf: "DM+Sans:wght@400;500;600;700" },
    space:  { label: "Space Grotesk", css: '"Space Grotesk", system-ui, sans-serif', gf: "Space+Grotesk:wght@400;500;600;700" },
    nunito: { label: "Nunito",        css: '"Nunito", system-ui, sans-serif',        gf: "Nunito:wght@400;500;600;700" },
    lora:   { label: "Lora (serif)",  css: '"Lora", Georgia, serif',                 gf: "Lora:wght@400;500;600;700" }
  };

  // Pure-CSS banner backgrounds (assets/css/art.css, classes art-<key>).
  var BANNERS = [
    { key: "blueprint", label: "Blueprint grid" },
    { key: "dots", label: "Dot matrix" },
    { key: "scanlines", label: "Scanlines" },
    { key: "circuit", label: "Circuit traces" },
    { key: "checker", label: "Pixel checker" },
    { key: "mesh", label: "Gradient mesh" },
    { key: "stripes", label: "Diagonal stripes" },
    { key: "stars", label: "Starfield" },
    { key: "rings", label: "Rings" },
    { key: "bands", label: "Retro bands" }
  ];

  // Pure-CSS illustrations drawn with divs and gradients only (assets/css/art.css, classes css-<key>).
  var HEROES = [
    { key: "robot", label: "Robot" },
    { key: "traffic", label: "Traffic light" },
    { key: "chip", label: "Microchip" },
    { key: "magnet", label: "Magnet" },
    { key: "eye", label: "Eye" },
    { key: "cube", label: "Cube" }
  ];

  var DEFAULTS = {
    theme: "auto",                 // auto | light | dark          (visitors can change)
    accent: "teal",                // a key of ACCENTS             (visitors can change)
    customAccent: null,            // "#rrggbb" or null (design lab only)
    icons: { base: "classic", overrides: {}, render: "image" },   // render: image | css
    iconSize: 32,                  // 32 | 48 | 64
    font: "inter",
    layout: "sidebar",             // sidebar | top
    entry: "rows",                 // rows | cards | compact
    radius: 10,                    // corner radius in px
    density: "cozy",               // compact | cozy | roomy
    tags: "pills",                 // pills | plain | hidden
    banner: "none",                // none | a key of BANNERS
    hero: "none"                   // none | a key of HEROES
  };

  return {
    ICON_NAMES: ICON_NAMES, STYLES: STYLES, ACCENTS: ACCENTS, FONTS: FONTS,
    BANNERS: BANNERS, HEROES: HEROES, DEFAULTS: DEFAULTS
  };
})();
