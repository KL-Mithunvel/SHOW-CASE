# Showcase sources

Everything under `projects/` is a **copy** of material from the owner's other repos. Nothing was moved; the source repos are untouched. Only items that go on a showcase webpage were copied (decision 2026-11-03).

| Folder | Source repo (local) | Origin | Commit at copy time |
|--------|---------------------|--------|---------------------|
| `myownenigma/` | `PycharmProjects/MyOwnEnigma` | github.com/KL-Mithunvel/MyOwnEnigma | f221cc7 |
| `traffic-management/` | `PycharmProjects/Traffic-management` | github.com/KL-Mithunvel/Traffic-management | 924c5e5 |
| `magnet-inserter/` | `PycharmProjects/Creality-Ender-3-V3-SE-` | github.com/KL-Mithunvel/Creality-Ender-3-V3-SE- | 0a99120 |
| `tile-inspection/` | `PycharmProjects/Tile_Sorting` (+ its `Acoustic-Analysis` submodule) | github.com/KL-Mithunvel/Tile_Sorting | d5c24b2 |

## myownenigma/site
- `index.html`, `template.html` ← `showcase/`. The page is **self-contained**: its 11 images are embedded as base64, so it has no separate image files. The 24 original photos, CAD renders and PDFs stay in the source repo (`images/`, `cad/`, `ppts/`) and were not copied.

## magnet-inserter/site
- `index.html`, `sim.js`, `sim-data.js`, `cad_front.png`, `cad_iso.png`, `demo.mp4`, `f_1.jpg`, `f_7.jpg`, `f_13.jpg`, `f_30.jpg` ← `showcase/`. These are exactly the files `index.html` references; verified none are missing.
- Skipped: `docs/images/simulation_run.gif` (13.9 MB) and `simulation_run.mp4` — not used by the page.

## traffic-management (no site yet — hero set picked for the future page)
- `images/` ← `runs/shots/`: `corridor_normal`, `corridor_overload`, `grid_test`, `short_collapse`.
- `videos/` ← `runs/video/`: `corridor_surge.mp4`, `grid_overload.mp4`. Skipped `test.mp4`.
- `docs/` ← `docs/PROJECT_OVERVIEW.md`, `docs/RESULTS.md`, `docs/results/final_headline_corridor.md`, `docs/results/final_fair.md`.
- Caveat: `PROJECT_OVERVIEW.md` describes the **2024 SIH prototype** (it never fully worked) as the starting point for the rebuild; check it against `RESULTS.md` before quoting claims on the page.

## tile-inspection (no site yet — hero set picked for the future page)
- `images/` ← `Acoustic-Analysis/docs/final_report_figures/` (`fig1_architecture`, `fig2_strike_states`, `camera_tile_gallery`, `camera_real_frame_pipeline`), `Acoustic-Analysis/docs/screenshots/` (`05-analyze`, `08-label-tool`, `09-test-tile`), `documents/deliverables/project_overview/project_overview_flowchart.png`, `development/output/conveyor_crossing.gif`, `camera_models/cam_yolo/runs/tile_grade_cls-aug-n-gpu/confusion_matrix_normalized.png`.
- Not copied: the raw dataset (~3.4 GB of JPGs, `data/`), all large videos including `development/output/conveyor_annotated.mp4` (23.8 MB). The GIF stands in as the demo clip; say if you want a real video instead.
- Caveat: the confusion matrix is from one training run chosen by name; confirm it is the run you want to show before it goes on the page.
