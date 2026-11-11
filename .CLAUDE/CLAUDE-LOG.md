# Claude Log

## 2026-11-12 — HERC-26 page: roles and livestream links
- The artifact had a newer version (owner edits). Merged onto it instead of my local copy: added a "Five roles in two years" timeline (Member, Finance Manager, Team Lead, Safety Officer, Programming Team Lead; Team Lead and Safety Officer highlighted) and links to NASA's HERC 2026 Day 1 and Day 2 livestreams. Republished as version 1794434786-292b; `projects/herc-26/site/index.html` re-synced.
- Roles came from the private notes (LinkedIn, about May 2026) because LinkedIn returned HTTP 999. LinkedIn lists "Team Lead", not "captain"; used the LinkedIn wording.

## 2026-11-12 — HERC-26 showcase page
- Owner asked for a showcase of `KL-Mithunvel/HERC-26`. Read the local repo (CLAUDE.md, firmware header, validation module, docs, git log), wrote a new page and published it as the private artifact "HERC-26 Rover" (`claude.ai/artifact/HGZYp7ecD6Qi6KCa19n9vY`); saved it to `projects/herc-26/site/index.html` with a `SOURCES.md` entry.
- Page has two interactive parts (the Mega's 9-byte status frame, the Pi's validation timers) and real numbers from git (321 commits, weekly counts). One check: headless Chrome at desktop width plus a 400px frame overflow test.
- Decisions: no contributor names, no competition result, no claim that the I²C fix was verified on the rover.
- Found and flagged to the owner: plaintext proxy credentials in the `HERC-26` README; and `docs/img.png` says a higher `SLOP_FACTOR` feels softer while the firmware ramps faster with a higher value (left off the page).
- Corrected my own hand count of the ramp (11 ticks) to 10 after computing it from the firmware formula.

## 2026-11-12 — Update check across all six projects
- Checked every source repo (`MyOwnEnigma`, `Traffic-management`, `Creality-Ender-3-V3-SE-`, `Tile_Sorting`, `PLC-2-DOF-manipulator`, `ROS_LAB`) against the commit in `projects/SOURCES.md`, and every artifact's version. Nothing new to copy: all match what is in `projects/`. (`ROS_LAB` has newer commits for the tunnel rig and Coin-D6 lidar; they are untested hardware code.)
- Decision (owner): leave the tunnel rig and the lidar out of the ROS showcase.
- Not compared: the Enigma and Magnet artifacts against the repo copies (Magnet `index.html` is 51606 bytes in the artifact vs 51312 here; repo copies kept).

## 2026-11-11/12 — Add the 2-DOF arm and ROS lab; Tile and Traffic updates
- Added `projects/plc-2dof-arm/` (from `PLC-2-DOF-manipulator/docs/website`, re-synced 2026-11-12 from 49f2362 for the 6 HMI screenshots) and `projects/ros-lab/` (the 13.6 MB "Mithunvel ROS 2 Portfolio" artifact, which replaced the older 4.4 MB `showcase/portfolio.html`). The ROS capture folders (30 MB) were left out: the page is self-contained.
- Traffic: added the `grid_overload.mp4` replay video to the page (`site/videos/`). Owner picked it; `corridor_surge.mp4` stays unused in `videos/`.
- Tile: deleted the 6 loose images that duplicated site media, then moved the 4 that differed into the Gallery and removed the loose `images/` folder. Added 32 more images from `Tile_Sorting` (report figures, belt frames, tile photos, 19 dataset contact sheets) as Gallery entries in `site.js`. Left out a COCO-BOX screenshot (not our software), Roboflow v2/v3 plots and YOLO run plots.
- Tile artifact updated 2026-11-11 (114 files): pulled 9 rig photos, 6 videos (47 MB), page, CSS and JS; `site.js` 3-way merged so the Gallery additions stayed. Still missing: 3 team photos and the optional report PDF.
- Searched Drive and the repos for the missing Tile photos and videos: nothing there beyond what the artifact later supplied.
- Ran the Tile master GUI in demo mode by mistake when the owner wanted the showcase's own 3D demo (`plant3d.html`); stopped it and served the showcase site instead. Preview servers were stopped at the end.
- Commits on `main`: 97da372, 860817c, 18521fb, 4ed4d8a, 04a4c60 (all pushed).

## 2026-11-03 — Record two more future showcase projects
- Owner asked to add "HERC" and "Time in Team Movis" to the page later. Recorded as one Not Started item in `TODO.md`. No searching or copying done; source repos still to be confirmed with the owner.

## 2026-11-03 — Fix Enigma page encoding
- Owner approved the charset fix. Added `<meta charset="utf-8">` as the first line of `projects/myownenigma/site/index.html` and `template.html` (the files were already valid UTF-8; only the declaration was missing). Re-rendered over local HTTP: the header now reads correctly. No other bytes changed.
- Explained the CRLF warning to the owner; `.gitattributes` not added yet (awaiting owner's decision).

## 2026-11-03 — Copy the Traffic and Tile pages from artifacts
- Searched `Tile_Sorting` and `Traffic-management` (all branches, history, disk): neither holds a showcase page. Found them as artifacts instead: "Look-Ahead Signals" (Traffic) and "Tile Inspection Line" (Tile, 93 files).
- Copied them into `projects/traffic-management/site/` and `projects/tile-inspection/site/`; provenance and versions in `projects/SOURCES.md`.
- Verified over local HTTP with headless Chrome plus a static path check: all referenced assets load except 16 files the Tile page expects but the artifact never contained (10 photos, 5 videos, report PDF) — listed in `SOURCES.md`. Traffic page contains no video.
- Found while testing: the two Enigma pages have no `<meta charset>`, so text garbles without a UTF-8 header. Not fixed; awaiting owner's go-ahead.
- Decisions: kept the earlier loose hero-pick images (not deleted); 2-DOF arm and ROS lab noted as future projects. Nothing committed yet.

## 2026-11-03 — Collect showcase assets from four source repos
- Copied (never moved) curated assets into `projects/` on `main`: `myownenigma/`, `traffic-management/`, `magnet-inserter/`, `tile-inspection/` — 19 MB total. Provenance, source paths, commit hashes and skipped items are in `projects/SOURCES.md`.
- Decision (owner): copy only what goes on a webpage, not whole repos. The Enigma page embeds its images as base64, so only its two HTML files were copied; the Ender page's 10 referenced files were copied and checked present; Traffic and Tile have no site, so a small hero set was picked.
- Skipped on purpose: Tile raw dataset (~3.4 GB) and large videos, the Ender 13.9 MB GIF (unused by its page), Traffic `test.mp4`.
- Open: owner to confirm the Tile/Traffic picks; the Tile "demo" is a 4.9 MB GIF, not a video. Nothing committed yet.

## 2026-09-28 — Record the never-merge branch policy
- Owner clarified that `main` and `machine-vision` are separate personal copies and are never to be merged. Added a "Branch Policy" section (marked repo-specific, not to be copied into new projects) at the top of `.CLAUDE/CLAUDE.md` on `main`, and matching notices on `machine-vision`.
- Cancelled the TODO item to merge `main` into `machine-vision`; recorded the reason there. The earlier merge of `origin/main` into `main` is unaffected — that was the same branch on the remote.
- Improvements are shared between the branches by copying text by hand as a separate commit on the target branch, after asking the owner.

## 2026-09-28 — Move claude_MV to a branch; bring generic rules back to main
- Created and pushed branch `machine-vision` (924a9c1) with the full contents of KL-Mithunvel/claude_MV. `main` stays the generic template.
- Reviewed the vision material for generic value and applied the selected items to `main`:
  - `.CLAUDE/CLAUDE-COMMON.md`: added Documentation Discipline (non-code docs go in `docs/`, not `project/` — decided to match the new Standard Project Layout), Secrets & Credentials, and Preflight Gates with three generic example gates (understand the existing state, survey the environment, confirm where it will run). Added a "no hardcoded parameters" rule for all projects, a Preflight Gates slot in the template skeleton, and a Standard Project Layout section.
  - `.CLAUDE/CLAUDE.md`: added a `## Preflight Gates` placeholder section.
  - New `.gitignore` (generic subset — vision image/weights blocks left on the branch) and `tools/compute_survey.py` (docstring generalised; ran it on this machine, works on Windows: RTX 1000 Ada, 6 GB VRAM, torch not installed).
  - `.CLAUDE/CLAUDE_INDEX.md` now committed on `main` with a Tooling and Defaults section.
- Edited `CLAUDE-COMMON.md` at the owner's request, despite the `update-docs` skill's note that it is normally not edited.
- Not applied (recorded in `TODO.md`): dependency-pin rule, failed-experiments rule, provisional-values rule, honest-reporting rule, rule → evidence style, log-file naming housekeeping, and the personal-preference items.
- Left for later: merging `main` into `machine-vision` will conflict in `CLAUDE-COMMON.md` and `CLAUDE_INDEX.md`.
- Decision: `compute_survey.py` was run with system Python because this repo has no venv; it is standard library only and read-only.
- Push of `main` was rejected: `origin/main` already had PR #3 (Documentation Discipline + "ok KLM" opener in `PROJ_STARTER.md`, merged 2026-06-18). Merged it into local `main` (no force-push). Git merged cleanly but left two Documentation Discipline sections in `CLAUDE-COMMON.md`; removed the remote's copy and kept the `docs/` version (owner's decision). The "ok KLM" opener is now active on `main`.
