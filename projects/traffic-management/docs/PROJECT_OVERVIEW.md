# Traffic-management — Project Overview

An AI-based traffic-signal project built for SIH (Smart India Hackathon) in September 2024. It was a prototype that never fully worked. This document records what the project set out to do, what the code actually does, and why it falls short. Its purpose is to serve as a starting point for rebuilding it.

> **Sources.** The *Intent* section is the owner's recollection, not something stated in the code. Everything under *What the code does* and *Problems found* was read directly from the source files.

---

## 1. Intent

Fixed-time traffic lights ignore what is happening on the road. The aim was a system that:

1. **Understands how junctions and roads are laid out**, so it knows which approaches feed which junctions.
2. **Understands traffic flow**, in particular how the flow leaving one junction becomes the demand arriving at the next one.
3. **Sets signal timings ahead of time** from that understanding, instead of reacting only to what is queued right now.

The key idea is the second one: junctions are not independent. A long green at junction A releases a platoon of vehicles that reaches junction B some seconds later. If B knows this in advance, it can prepare, for example by starting its green so the platoon passes without stopping. A network of lights managed together should beat the same lights run independently on fixed timers.

The problem statement in `README.md` frames it the same way: monitor traffic in real time, adapt signal timings, and handle heavy traffic from multiple directions.

---

## 2. What the code does

The repo is three loosely related pieces. None of them feeds the next.

```
  (A) DETECTION                 (B) PREDICTION                  (C) SIMULATION
  Object Tracking/              AI_Prediction_of_Signal_        final.py
  YOLOv8 + Tracker              Timings.py                      pygame, 3 junctions
  counts / speed of cars        vehicle count -> timings        draws signals + cars
        │                              │                              ▲
        └──── not connected ───────────┴──── not connected ───────────┘
                                                                data.csv (hand-typed)
```

### (A) Detection — `Object Tracking/`
- `Counter_main.py` and `speed.py` run YOLOv8 (`yolov8s.pt`) on a video (`veh2.mp4`), keep only detections whose class name contains "car", and track them with `tracker.py`.
- `speed.py` places two horizontal lines (`line_y1 = 322`, `line_y2 = 368`) in the frame and times how long a tracked car takes to cross from one to the other. It assumes the lines are 10 m apart, giving a speed in km/h. It counts "going down" and "going up" separately.
- Output is only drawn on screen. Nothing is written to a file or passed to the other pieces.

### (B) Prediction — `AI_Prediction_of_Signal_Timings.py`, `trainingmodel_trafficcluster.py`
- A scikit-learn `MLPRegressor` (two hidden layers, 50 and 30 units) maps **one number, a vehicle count, to three numbers**: `[green, red, yellow]`.
- It is trained on **five made-up points** (counts 10–50 → timings such as `[20, 10, 5]` … `[40, 20, 7]`). The code comments say "replace this with actual data".
- For a row of counts `S1..S4` (one per signal), it predicts a green and yellow for each, then sets each signal's red time to the sum of green + yellow of all the *others*. This is a round-robin cycle: one green at a time.
- `AI_Prediction_of_Signal_Timings.py` watches three junction input CSVs, re-predicts when the file changes (using `portalocker` to avoid half-written reads), and writes a `*_signals_updated.csv`. `trainingmodel_trafficcluster.py` does the same once, in batch.
- Both use file paths on other team members' machines (`C:\Users\91934\Downloads\…`, `C:/Users/madhu/…`).

### (C) Simulation — `final.py`
- A pygame window (1400×800) over `images/intersection.png` showing **three four-way junctions**: one at the left and two at the right. Each has four signals with a countdown timer.
- Each junction cycles one signal at a time: green → yellow (5 s) → red, then the next signal. The green durations come from `data.csv`, one row per junction (columns `S1..S4`, in seconds).
- A background thread spawns one random vehicle per second (car, bus, truck or bike) into one of **eight entry directions**: `right`, `down`, `left`, `up`, `up1`, `up2`, `down1`, `left1`. Vehicles drive forward, queue behind the one ahead, and stop at the stop line when their signal is not green.
- `up1` and `left1` vehicles make a 90° turn at a fixed coordinate.
- The older `traffic1.py` is the same program for a single junction with fixed 10 s greens. `signal.py` is the 3-junction signal logic without vehicles. `gui.py` is unfinished scratch work (two pasted drafts, one of which loads a car path from a CSV with `eval`).

---

## 3. How well the intent was met

| Intent | In the code? |
|--------|--------------|
| Model the road/junction layout | **No.** Roads are pixel coordinates in dictionaries (`x`, `y`, `stopLines`, `defaultStop`). There is no graph of junctions and roads. `road.py` and `vehicle.py` were an early attempt at this and are unused. |
| Model how flow from one junction reaches the next | **No.** The three junctions are independent. Nothing carries vehicles or counts from one to another. |
| Predict timings from traffic | **Barely.** One junction's count maps to that junction's timings using a model trained on 5 invented points. |
| Adapt in real time | **No.** The simulation reads `data.csv` once at start-up and never again. The file-watching loop in (B) writes CSVs that nothing reads. |
| Beat a regular fixed-time system | **Never measured.** There is no baseline, no delay or queue metric, and no comparison run. |

---

## 4. Problems found

These are the reasons the project does not work, roughly in order of how much they matter.

**Design gaps**
1. **No road network.** Without a representation of which road leads to which junction, and how long it takes to travel between them, the central idea (flow propagating to the next junction) cannot be expressed.
2. **No data pipeline.** Detection, prediction and simulation are separate programs. The simulation's timings are hand-typed.
3. **The model is a stub.** One input, five fabricated training rows. It cannot learn anything about flow, and "red" is derived by formula, not predicted.
4. **No evaluation.** The simulation shows motion but records no waiting time, queue length or throughput.

**Bugs in `final.py`**
5. **Junctions 2 and 3 are decoration.** `Vehicle.move()` only ever checks `currentGreen` and `currentYellow` (junction 1's state). Vehicles in the right-hand junctions never consult `signals2`/`signals3`, so those lights change colour but control nothing.
6. **Wrong junction in `repeat2()`/`repeat3()`.** Both reset vehicle stop positions using `currentGreen` (junction 1), not their own junction's index.
7. **Queue spacing is silently not applied.** The queue-stop lines in `Vehicle.__init__` are written as `self.stop = a` on one line and `- b - c` on the next lines. Python treats each continuation line as a separate expression, so the vehicle-length and gap offsets are discarded and queued cars stop at the same point as the leader.
8. **Lane 0 is never used, and turning lanes stall.** Vehicles spawn in lanes 1–2 only. In the `up1` and `left1` branches of `move()`, only the first vehicle in a lane (`index == 0`) ever moves; for `left1` the follow-the-leader check compares a vehicle against itself, so it can never pass.
9. **Vehicles are never removed.** Every spawned vehicle stays in `vehicles[...]` and `simulation` forever, so the program slows down over time.
10. **Global mutable state, no locking.** Three signal threads and a spawner thread mutate shared module-level variables while the draw loop reads them.
11. **Fragile start-up.** `final.py` reads `data.csv`, calls `pygame.init()` and starts threads at import time, inside the body of `class Main`.

**Bugs in the detection code**
12. **Box format mismatch.** `speed.py` and `Counter_main.py` pass `[x1, y1, x2, y2]` boxes to `Tracker.update()`, but `Tracker` reads them as `[x, y, w, h]`. Centre points, and so the line-crossing logic, are wrong.
13. **Cars only.** Buses, trucks and bikes are filtered out.
14. **Speed uses wall-clock time.** `time.time()` is measured while every third frame is processed, so the result depends on how fast the machine runs YOLO, not on the video's frame rate.

**Housekeeping**
15. `requirements.txt` is UTF-16 and incomplete; hard-coded user paths; `Main.py` and `junction.py` are empty; `signal.py` shadows Python's standard-library `signal` module.

---

## 5. What a working version would need

The shortest route to something that demonstrates the original idea, in order:

1. **A network model.** Junctions as nodes and roads as directed edges with a length and a free-flow travel time. Each junction has approaches and a signal plan. This replaces the pixel dictionaries as the source of truth. The pygame drawing becomes a view of the model.
2. **A flow model.** When a signal gives green, vehicles discharge at a saturation rate; they arrive at the downstream junction after the edge's travel time. This is the "how does one junction affect the next" part, and the simplest honest version is a cell/queue model in plain Python, with no graphics.
3. **A baseline controller and metrics.** Fixed-time signals first, measuring average delay, queue length and throughput. Without this there is nothing to improve on.
4. **An adaptive controller.** Start with a rule that uses upstream arrivals (expected platoons) to extend or start green, plus offsets between neighbouring junctions (a "green wave"). Only then consider a learned model, trained on data generated by the simulator itself, not on five hand-written points.
5. **Wire detection in, last.** Vehicle counts from video feed the controller as inputs. Fix the tracker box format and count all vehicle types first.
6. **Compare.** Run adaptive vs fixed-time on identical traffic and report the difference.

Steps 1–4 can be built and tested without pygame, video or YOLO, which makes them quick to test and keeps the visual layer optional.

---

## 6. File map

| Path | Status |
|------|--------|
| `final.py` | Current simulation; runs only after dependencies are installed, see bugs 5–11 |
| `traffic1.py`, `signal.py` | Earlier versions of `final.py` |
| `AI_Prediction_of_Signal_Timings.py`, `trainingmodel_trafficcluster.py` | Timing predictor on placeholder data, hard-coded paths |
| `Object Tracking/` | YOLOv8 counting and speed scripts; needs `yolov8s.pt` and `veh2.mp4` (not in repo) |
| `vehicle.py`, `road.py` | Unused early OOP draft; closest thing to a road model |
| `gui.py` | Scratch drafts, not runnable |
| `Main.py`, `junction.py` | Empty |
| `data.csv` | Green times (s) for 3 junctions × 4 signals |
| `images/` | Vehicle sprites per direction, signal lights, `intersection.png` |

Last updated 2026-10-31.
