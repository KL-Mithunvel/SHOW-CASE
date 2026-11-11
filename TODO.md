# TODO

## In Progress
- [ ] Build the combined showcase site from `projects/` (layout, landing page, one page per project).
- [ ] Supply the 3 missing Tile team photos (`team_mithunvel`, `team_teja`, `team_madhumitha`) and the optional report PDF — see `projects/SOURCES.md` "Known missing files".
- [ ] Wire the 2-DOF arm and ROS lab pages into the combined site (layout, landing page).


## Done
- [x] Write the HERC-26 showcase page, publish it as the artifact "HERC-26 Rover" and save it to `projects/herc-26/site/index.html`; provenance in `projects/SOURCES.md`. Not yet committed.
- [x] Re-sync the 2-DOF arm site from `PLC-2-DOF-manipulator` commit 49f2362: 6 HMI screenshots and page edits. Not yet committed.
- [x] Pull the updated Tile artifact (114 files): 9 photos, 6 videos with posters, edited page/CSS/JS; `site.js` merged with the 2026-11-11 gallery additions. Not yet committed.
- [x] Add 32 Tile images not yet on the site (5 report figures, 2 camera frames and 2 tile photos, 4 re-converted loose images, 19 dataset contact sheets) as new Gallery entries in `site/assets/js/site.js`; remove the now-duplicate loose `images/` folder. Not yet committed.
- [x] Add `grid_overload.mp4` to the Traffic page (`site/videos/`, new "Replay video" block); delete 6 loose Tile images that duplicated site media (05-analyze, 08-label-tool, 09-test-tile, camera_tile_gallery, project_overview_flowchart, conveyor_crossing.gif). Not yet committed.
- [x] Copy the 2-DOF arm site (`projects/plc-2dof-arm/`, 7 MB) and ROS lab portfolio page (`projects/ros-lab/`) from their repos; provenance in `projects/SOURCES.md`. Not yet committed.
- [x] Add `<meta charset="utf-8">` as the first line of both Enigma pages (`projects/myownenigma/site/`); the garbled "Â·" / "â†’" characters are gone in the rendered page. Not yet committed.
- [x] Copy the published Traffic page and the full Tile site (93 files) from their claude.ai artifacts into `projects/traffic-management/site/` and `projects/tile-inspection/site/`; checked every path over local HTTP (only the 16 known placeholder files are missing). Not yet committed.
- [x] Collect showcase assets from MyOwnEnigma, Traffic-management, Creality-Ender-3-V3-SE- and Tile_Sorting into `projects/` (19 MB, only what the pages use or will use) — provenance in `projects/SOURCES.md`. Not yet committed.
- [x] Create the `machine-vision` branch holding the claude_MV baseline (four gates, docs, tools, Roboflow skills) — pushed to origin (924a9c1 on `machine-vision`).
- [x] Add generic rules from the machine-vision work to `CLAUDE-COMMON.md` — Documentation Discipline, Secrets & Credentials, Preflight Gates (with three example gates), "no hardcoded parameters" for all projects, Standard Project Layout, and a Preflight Gates slot in the skeleton and in `CLAUDE.md`.
- [x] Add baseline `.gitignore` and `tools/compute_survey.py` (generalised docstring; verified on Windows 11).

- [x] Integrate `origin/main` PR #3 (Documentation Discipline + "ok KLM" opener) — merged; removed the duplicate Documentation Discipline section, keeping the `docs/` version. The "ok KLM" opener is now on `main`.
- [x] ~~Merge `main` into `machine-vision`~~ — CANCELLED. The owner keeps the two branches as separate personal copies and never merges them. Added a "Branch Policy" section to `.CLAUDE/CLAUDE.md` so future AI sessions know.

## Not Started
- [ ] Later: compare the eight separately made showcase pages (Enigma, Traffic, Magnet, Tile index + 3D plant, 2-DOF arm, ROS lab, HERC-26) and make them consistent across projects: fonts, colours and dark/light theme, header, nav and footer, section and caption style, how images, videos and galleries are shown, mobile layout. Start by listing the differences, then pick one shared look and decide whether to share one CSS file. Do this before building the combined landing page.
- [ ] Later: add "HERC" and "Time in Team Movis" (owner's wording; exact projects and source repos to be confirmed) as further projects on the showcase page.
- [ ] Pin dependencies that silently break: record the pin, the reason, and a verification command (machine-vision Development Rule 7).
- [ ] Record failed experiments and attempts with their numbers (machine-vision Development Rule 8).
- [ ] Label provisional values as provisional in code and docs until confirmed (machine-vision Development Rule 6, needs rewording beyond hardware thresholds).
- [ ] Honest-reporting rule: state what each number was measured on, compare like with like, treat tiny deltas as noise (needs rewording without model/val-set language).
- [ ] "Rule → evidence" style: every template rule carries a one-line "why this exists".
- [ ] Housekeeping: pick one log file location and name. `CLAUDE-COMMON.md` says root `Claude_log.md`; this repo keeps `.CLAUDE/CLAUDE-LOG.md` and the index points there.
- [ ] Personal preference to decide: whether "explain before acting" gets an "unless autonomous completion was asked for" clause. (The "ok KLM" opener is done — see Done.)
