# Cross-project consistency review

Compared 2026-11-14: the seven project pages under `projects/*/site/` (Enigma, Traffic, Magnet, Tile, 2-DOF arm, ROS lab, HERC-26), read from source (CSS, markup, scripts). **Not yet viewed side by side in a browser**, so visual impressions below are inferred from the CSS. Content differences are expected; this lists the *presentation and plumbing* differences only.

## Status — resolved 2026-11-17
All eight project pages (SLEEPY, HERC-26, Look-Ahead Signals, MyOwnEnigma, ROS lab, 2-DOF arm, Magnet, Tile) are now built on one template: `projects/_shared/base.css` + `base.js`, one `project.css` / `project.js` per page. Rules, skeleton and components: `projects/TEMPLATE.md`. Owner's decisions: one accent for all pages (the landing page's), local copies may diverge from the published artifacts, template first then one page per commit. `tools/check_site.py` now fails any project page that is not on the template. Embedded base64 media (Enigma, Traffic, ROS, HERC) was moved to real files. The old overlay (`showcase.css/js`, `tools/apply_shared_theme.py`) is gone. Everything below is the original audit and the earlier first pass, kept as the record of why.

## Earlier status — first pass 2026-11-14 (superseded)
- `projects/_shared/showcase.css` + `showcase.js`, wired into all 7 pages by `tools/apply_shared_theme.py` (re-run it after re-copying any page from its source; already-themed pages are skipped).
- Shared now: one type family (IBM Plex Sans / Sans Condensed / Mono), one set of neutrals in light and dark, sentence-case headings, 16px body, a top bar ("← All projects", name, theme button) and previous/next project links at the bottom. Theme choice is stored under the landing page's key, so it carries across pages.
- Each page keeps its own accent and meaning colours. Enigma keeps Special Elite for the machine's own lettering only. Tile keeps its own theme button (it stores the theme under a different key).
- Page fixes: `lang="en"`, `utf-8` charset, `<title>`/`<style>` moved into `<head>` on the 5 artifact copies, a real document wrapper for Enigma, meta descriptions, `loading="lazy"` on all images but the first.
- Side navigation on all 7 pages, built by `showcase.js` from each page's `<h2>` headings (no page edits). Wide screens with room in the left margin get a fixed "On this page" list with the current section highlighted; narrower screens get a "Sections" button in the top bar that opens the same list as a drawer. Headings without an id get one added at runtime.
- No page content was removed. Still different: corner radii, card and table styles, captions, image viewers, breakpoints (section C–E below).

## What is already shared (keep)
- Same overall recipe: one long scrolling page, hero then `<section>`s, light **and** dark via `prefers-color-scheme` plus a `data-theme` override (`:root:not([data-theme="light"])` and `:root[data-theme="dark"]`), `prefers-reduced-motion` handled (except ROS, Tile partly), 1px hairline cards, no shadows.
- Body font is IBM Plex Sans in 5 of 7; mono is IBM Plex Mono in 5 of 7; Barlow Condensed is the display face in 4 of 7.
- Every `<img>` has alt text. Most use `loading="lazy"`.
- All are English, plain-fact tone, with an honest "what is not proven" section in most.

## Differences, grouped by how much they matter

### A. Structural / technical (fix first, low risk)
| # | Item | Enigma | Traffic | Magnet | Tile | Arm | ROS | HERC |
|---|------|--------|---------|--------|------|-----|-----|------|
| 1 | `<html lang="en">` | missing | missing | **yes** | missing | missing | missing | missing |
| 2 | Real `<head>`/`<body>` structure | no `<html>` at all | ok | ok | ok | ok | ok | `<title>`/`<style>` sit **inside `<body>`** |
| 3 | `<meta charset>` | `utf-8` | `utf8` | `utf-8` | `utf8` | `utf8` | `utf8` | `utf-8` |
| 4 | `<meta name="description">` / og tags | none | none | none | **yes** (+og) | none | none | none |
| 5 | Skip link | no | no | no | no | no | **yes** | **yes** |
| 6 | `loading="lazy"` on images | 6 of 11 | **0 of 5** | 5 of 5 | 26 of 31 | 45 of 47 | 24 of 24 | 7 of 11 |
| 7 | Landmarks | no `<main>`, no `<nav>` | `<main>` only | `<nav>`, no `<main>` | `<main>`+3 `<nav>` | none | none | none |
| 8 | CSS location | inline | inline | inline | **external file** | inline | inline | inline |
| 9 | JS location | inline | inline | external (`sim.js`, 806 KB `sim-data.js`) | external (`site.js`) | inline | inline | inline |
| 10 | Self-contained vs files | base64 images, 1.6 MB | base64, 320 KB | separate files | separate files (7 MB + 47 MB video) | separate `img/` | **13.6 MB single file** | base64, 1.2 MB |
| 11 | Mojibake risk | fixed | – | – | – | – | – | `I²C` fine now; watch it |
| 12 | Leftover artifact wrapper | `<meta name="claude:viewport-fit-sides">` + wrapper `:root{padding-top:env(safe-area…)}` present in 6 of 7 (Magnet clean-ish) | | | | | | |

Notes: the pages published as claude.ai artifacts carry the artifact wrapper (`color-scheme:light`, safe-area padding, `claude:viewport-fit-sides`). That wrapper's `color-scheme:light` is overridden in dark mode but is dead weight on a normal host.

### B. Design tokens (the visible inconsistency)
| Token | Enigma | Traffic | Magnet | Tile | Arm | ROS | HERC |
|-------|--------|---------|--------|------|-----|-----|------|
| Page background var | `--bg` | `--bg` | `--bg` | `--paper` | `--bg` | `--bg` | `--paper` |
| Card var | `--surface` | `--surface` | `--surface` | `--sheet` | `--surface` | `--surface` | `--sheet` |
| Text var | `--ink` | `--ink` | `--ink` | `--ink` | `--ink` | `--ink` | `--ink` |
| Secondary text | `--ink-2` | `--ink-soft` | `--muted` | `--muted` | `--muted` | `--muted` | `--muted` |
| Border var | `--line` | `--rule` | `--line` | `--rule` | `--line` | `--line` | `--rule` |
| Font vars | `--font-*` | `--font-*` | `--f-*` | `--f-*` | `--display/--body/--mono` | `--f-*` | `--f-*` |
| Accent | amber `#9C5700` | amber `#B36A00` | **green** `#1D8A4E` | teal+clay | orange `#D2601A` | orange `#C2410C` | rust `#B3431A` |
| Display font | Special Elite | Barlow Cond. | Chakra Petch | Archivo | Barlow Cond. | Archivo | Barlow Cond. |
| Body font | Plex Sans | Plex Sans | Plex Sans | Plex Sans | **Public Sans** | **Archivo** | Plex Sans |
| Mono font | Plex Mono | Plex Mono | Plex Mono | Plex Mono | **JetBrains Mono** | Plex Mono | Plex Mono |
| Body size | 16px | **17px** | 16px | 1rem (`--step-0`) | 16px | 16px | 16px |
| Content width | 1080 | **1040** | 1080 | **1180** (+1000) | 1080 (text col 780) | 1080 | 1080 |
| Corner radius | 10–12 | 14 / 50% | 8–14 | 6 (`--radius`) | 3–8 | **square** | 3–6 |

Findings:
- Same *roles* but **three naming schemes** for the same tokens (`--bg/--paper`, `--surface/--sheet`, `--line/--rule`, `--ink-2/--ink-soft/--muted`, `--font-x/--f-x/--display`). Renaming costs nothing and is the precondition for sharing a stylesheet.
- Dark-mode values are all different but *principled* (cool dark grey-green/blue, one lifted accent). Light backgrounds range from warm-grey `#E8ECE9` to cool `#F3F5F7`; there is no single neutral.
- The accent is the project's colour, which is fine, **but Magnet's green is the only non-warm accent** and also reads as "success". Tile uses 5 grade colours plus two accents.
- Fonts: 4 body fonts (Plex Sans, Public Sans, Archivo) and 6 display fonts across 7 pages. Public Sans and JetBrains Mono (Arm) are loaded only for one page.
- Sizes: Traffic's 17px body and 1040px column are the odd ones; Tile's 1180px wrap is a deliberate wide layout (3D demo, galleries).

### C. Page anatomy
| Item | Enigma | Traffic | Magnet | Tile | Arm | ROS | HERC |
|------|--------|---------|--------|------|-----|-----|------|
| Header | `<header>` title + stat tiles | `.nav` sticky div + hero grid | hero with video card | sticky `topbar` + split hero | photo-led hero | hero + left label rail | `<header>` + eyebrow |
| Top nav | none | sticky bar (links) | small `.nav` | sticky + mobile menu + **theme toggle** | none | left rail labels | none |
| In-page anchors (section ids) | 8/8 | 11/12 | 7/9 | 12/12 | **1/11** | 5/5 | 14/14 |
| Theme toggle | none | none | none | **only here** | none | none | none |
| Image enlarge | none | none | yes (lightbox) | yes (`<dialog>` lightbox) | yes (`<dialog>`) | none | none |
| Section marker | h2 only | label + h2 | label + h2 | numbered kicker + h2 | mono eyebrow + h2 | rail label | eyebrow + h2 |
| H2 style | sentence | sentence | sentence w/ full stop | sentence w/ full stop | sentence | title-ish | sentence |
| Footer | credits + shell commands | credits, disclaimer | credits | credits + 4 links | credits | provenance note | credits + source |
| Source repo link | yes | yes | **none ("not published")** | yes (2 repos) | yes | upstream links only | yes |
| "Back to portfolio" link | none anywhere | | | | | | |
| Team credit | names in footer | names in footer | names in footer | own section "Who built it" | own section "Team" | none (solo) | own section "Team MOVIS" |
| Date shown | no | no | "26 October 2026" in a heading | "October 2026" in footer | "2026" | none | footer + timeline |

Findings:
- **Only Tile has a theme toggle** (and the landing page); all others follow the OS setting silently, though all are written to support `data-theme`.
- Navigation ranges from none to a full sticky bar with mobile menu. A visitor arriving on Arm or HERC cannot jump between 11–14 sections.
- Three different lightbox implementations (Magnet custom, Tile `<dialog>`, Arm `<dialog>`); the other four have no way to enlarge a figure.
- Team/credits appear in four different places and formats. Magnet and Enigma credit a person as "Taja Pavan"/"Josika P." in footers only; Traffic's footer carries a long disclaimer.
- Heading style mixes full stops (Magnet, Tile) and none.
- Names are written differently across pages: "KL Mithunvel", "Mithunvel K L", "Mithunvel KL", "kl mithunvel" (Traffic, lower case), "Mithunvel" (ROS title). Teammate "Taja Pavan" (Magnet) vs "Teja" (Tile photo filename).

### D. Media handling
| | Enigma | Traffic | Magnet | Tile | Arm | ROS | HERC |
|-|--------|---------|--------|------|-----|-----|------|
| Figures | 12 | 6 | 5 | 34 | 46 | 30 | 10 |
| Caption style | `figcaption` grid | `figcaption` grid | `figcaption b` mono label | plain | left accent bar | standard | standard |
| Image border | 10px radius | square | 8px radius | 6px | 6px | square | 6px |
| Video | none | 1 (no poster) | 1 (poster) | 7 (6 posters; hero one autoplays) | none | 3 | none (2 YouTube links) |
| Video attrs | – | `controls muted loop` | `controls muted loop` | `controls`, some `muted`, one `preload="none"` | – | varies | – |
| Gallery pattern | grid | grid | grid | JS gallery (`site.js`) | `<dialog>` grid | grid | grid |
| Image formats | embedded PNG/JPG | embedded | jpg/png | **webp** | jpg/png | embedded | embedded |
| Missing assets | none | video | none | 3 team photos + report PDF | none | none | none |

### E. Responsive behaviour
- Breakpoints: Tile defines **10+ ad hoc max-widths** (480–1000); Arm 5 (480–620); Magnet 3; Enigma 4; HERC 2; ROS 1 (760); Traffic 1 (640). No shared set.
- Side gutter: Arm uses `min(1080px, 100vw - 32px)`; others pad differently. Not checked on a real phone.

### F. Content conventions
- Disclaimer style differs: Traffic ("all traffic simulated"), HERC ("no placing is claimed"), ROS ("waypoints belong to the Gazebo room"), Tile (honest-limits section), Magnet (status section), Enigma (self-check). Same honesty rule, six different wordings and positions. A one-line "what this page does not claim" slot in the footer or last section would unify it.
- Hero has a project label ("Mechatronics project · FFF 3D printing", eyebrow, etc.) in some pages, none in Tile/Enigma.

## Suggested path to consistency (smallest effective steps)
1. **Mechanical clean-up (no visual change), all 7 pages:** add `lang="en"`, `utf-8` charset first in `<head>`, move HERC's `<title>`/`<style>` into `<head>`, add Enigma `<html>`, strip the artifact wrapper, add `loading="lazy"` + `decoding="async"` everywhere (Traffic has none), add `<main>`, add a skip link, add `description` + og meta.
2. **Rename tokens** to one scheme (suggest the landing page's: `--bg --surface --text --muted --border --accent`, plus `--font-display/-body/-mono`) in all pages. Keep each page's *values*.
3. **Pick a shared type baseline**: IBM Plex Sans body + IBM Plex Mono (5 of 7 already), 16px, 1080px column; allow one per-project display face and accent. That moves Arm (Public Sans/JetBrains Mono), ROS (Archivo body) and Traffic (17px, 1040px) and keeps Tile's wide layout as an explicit exception.
4. **Shared chrome**: one slim top bar on every page with "← Portfolio", project name, section links and the theme toggle (the toggle code already exists in Tile and on the landing page). One footer: credits, source link or "not published", and the "what this page does not claim" line.
5. **One lightbox and one gallery pattern** (Tile's `<dialog>` version) extracted to a shared `projects/_shared/site.js`.
6. **Decide on a shared `projects/_shared/base.css`** (tokens, type, figure, caption, table, chip, footer) with each page keeping a small `project.css`. This only works for pages that live as files; the base64-embedded and single-file artifacts (Enigma, Traffic, ROS, HERC) would need their CSS pulled out first, so they stop being copies of the published artifacts. **This is the real decision for the owner.**
7. Fix naming: one spelling of the owner's and teammates' names (check with the owner).

## Open questions for the owner
- Keep the project pages byte-identical to the published claude.ai artifacts, or let the local copies diverge (needed for steps 4–6)?
- Is Magnet's lack of a public repo deliberate? (Footer says source is not published; `SOURCES.md` lists a GitHub origin.)
- Is one accent per project the intended identity, or should all projects use the landing page's teal?
