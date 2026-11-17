# Project page template

Every page under `projects/<id>/site/index.html` uses one shared template (decided 2026-11-17; see `CONSISTENCY.md` for why). Reference page: `projects/sleepy/site/index.html`.

## Files
| File | Role |
|------|------|
| `projects/_shared/base.css` | Tokens (same as the landing page), type, and every shared component. Do not copy it into a page. |
| `projects/_shared/base.js` | Theme + accent from the landing page, section list, lightbox, previous/next links. |
| `projects/<id>/site/project.css` | Only what is special to that project (diagrams, demos, simulators). Uses the shared tokens. |
| `projects/<id>/site/project.js` | Only that project's own scripts. |

## Decisions
- **One accent for all pages**: the colour picked on the landing page (`portfolio-ui` in localStorage; default teal). Pages never set their own accent. Meaning colours (`--ok --bad --warn`) are only for good / bad / caution.
- **Tokens**: `--bg --text --muted --border --hover --chip --accent --accent-ink --accent-soft`, fonts `--font-body` (Inter) and `--font-mono` (JetBrains Mono). Same names as `assets/css/site.css`.
- **One column width** (`--wrap`, 68rem). Anything wider than that is a deliberate exception inside `project.css`.
- Local copies may differ from the published claude.ai artifacts; media is kept as files next to the page, not base64.

## Page skeleton
```
<html lang="en" data-project="<id>">      id must be listed in PROJECTS in base.js
<head>  charset, viewport, title, description, color-scheme, icon, Inter + JetBrains Mono link,
        base.css, project.css, base.js (no defer: it sets the theme before first paint)
<body>
  a.skip
  nav.pbar > .pwrap > a.back, span.name, span.sp, button.pbtn.theme
  div.pwrap
    main#main
      header.hero    p.eyebrow, h1, p.tagline, p.lead, .stats > .stat > b + span
      section.block#id   .sec-head (p.eyebrow, h2, intro) then content
      ... last section: "What this page does not show" as .facts
    footer.pfoot     credits, source link (or "not published"), p.claim ("Not claimed: ...")
  script project.js
  (the previous / next nav is added by base.js)
```

## Components in base.css
`.stats/.stat`, `.stack`, `.trio`, `.mt`, `.note`, `.panel`, `figure/figcaption`, `.gallery` (+ `.wide`) with `a.zoom` for the lightbox, `.pair`, `.scroll` (wrap wide tables and diagrams), `dl.rows`, `ol.rules`, `ol.timeline`, `table` (`td.num` for numbers), `.facts`, `.callout`, `.chips/.chip`, `.btn/.tabs`, `pre/code`, labels (`.eyebrow`, `.cap`).

## Data colours are not the accent
Colours that carry meaning stay fixed: good / bad / caution (`--ok --bad --warn`), grade colours, material colours, the third chart series. Do not recolour them with the accent, and do not use the accent for a chart series when another series could look the same (the arm page uses a fixed orange `--series-3` for this reason).

## Lightbox
Wrap an image in `<a class="zoom" href="<full image>"><img ...></a>` inside a `<figure>`; the `figcaption` is shown under the enlarged image. One delegated handler in `base.js` covers links added later by a page's own script (set the `href` after creating the link).

## Pages that are not on the template
`projects/tile-inspection/site/plant3d.html` is a standalone full-screen three.js view that the Tile page embeds in an iframe; it keeps its own look. `projects/myownenigma/site/template.html` is the Enigma repo's un-inlined source and is not linked.

## Converting a page
1. Copy the head and bar from the reference page; set `data-project`, title, description.
2. Move the page's own CSS to `project.css`, renaming old tokens to the shared ones; drop anything `base.css` already has.
3. Replace old class names with the components above; keep the content.
4. Move base64 images to `img/` files; give every image `alt`, `width`/`height`, `loading="lazy"` (not the first one).
5. Add the page to `PROJECTS` in `base.js`. Run `python tools/check_site.py` (it now fails a project page that is not on the template), then view the page in light and dark at desktop and phone width. Pages with animation loops (Magnet, Tile) need `--timeout=7000` instead of `--virtual-time-budget` in headless Chrome.
