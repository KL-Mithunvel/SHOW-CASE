# Results

Does a signal controller that knows what is coming from upstream beat a regular fixed-time system? This is the answer from the rebuilt simulation, including where it failed and how that was fixed. Method and background: `PROJECT_OVERVIEW.md`, `REBUILD_PLAN.md`.

## Short answer

> **Correction added later (see "The neighbour-aware controller, and what it showed").** The high-demand rows below (x1.8, x2.2) compare responsive controllers capped at a 50 s maximum green with a fixed plan tuned only at normal demand. Both were weak choices at high demand: lifting the cap to 110 s cuts every responsive controller's delay at x1.8 from about 65 s to 43 s, and a fixed plan tuned for high demand (70 s / 20 s) reaches 44 s. So the large high-demand gaps below overstate what responding to traffic buys there. The light-to-normal results (x0.5 to x1.4) are unaffected. **A later fair re-tune ("The fair re-tune", seeds 400-429) supersedes the neighbour-aware claims: against a fixed plan tuned at each demand level, responsive control wins clearly on the corridor up to x1.4 and at x2.2, is nearly level at x1.8, and loses to the tuned fixed plan on short links under spillback at x1.8 and x2.2.**

> **Later correction (see "Phase A and B").** With the fixed-plan search widened (EW up to 180 s), the corridor x2.2 win reported by the fair re-tune disappears (-0.7 s, noise) and the x1.8 gain is 2-5 s. Below saturation the gain over a per-demand tuned fixed plan is still about 7 s on every layout, and over one plan used all day it is 14-22 s on the corridor.

> **Later still (see "Phases C and D").** With demand that changes during the hour, neighbour-aware control stays 6-11 s better than an *ideal* time-of-day timer on the corridor and 7 s better on the grid; a platoon-hold rule (the last version of the original upstream-flow idea) gave no gain; a shape-based max-green rule is a usable fallback but its link-length reasoning is not confirmed.

- **Yes, at every demand level tested, but by a modest and uneven amount.** The arrival-aware controller cut mean queueing delay by 43% at half normal demand, 29% at normal demand, 19% at 1.4x and 1.8x, and 15% at 2.2x (over capacity), compared with a tuned fixed-time plan.
- **Against a controller that sees only the queue, the advantage is smaller and limited to moderate loads.** The arrival-aware controller beat the plain queue-actuated one on every one of 30 seeds at 0.5x, 1x and 1.4x demand (by 18%, 16% and 6%), and is no different from it at 1.8x and above.
- **A serious failure was found and fixed.** Its first version collapsed near saturation: at 1.8x demand it had nearly three times the delay of the fixed plan. A fallback to plain queue-actuated behaviour when a junction is congested removed this, with no loss at light demand. See "The collapse, and the fix".
- **The benefit does not come from the idea the project set out to show.** It comes from looking only about 3 seconds ahead, roughly an advance detector 40 m up the road. Looking further ahead (10 to 15 seconds, the range where the previous junction's flow would matter) gave no benefit and usually made things worse.
- **Coordinating the signals along the road (green wave) did nothing useful.**

## What was measured

| | |
|---|---|
| Network | `config/corridor.yaml`: three signalised junctions in a row on a major road (300 m apart, 13.9 m/s), each with a north and a south side street. Two phases per junction (east-west, north-south). |
| Demand | Random (Poisson) arrivals at the eight network entrances: 600 vehicles/h at each end of the major road and 150 vehicles/h on each side street, about 2,100 vehicles/h in all. "x1.4" means 1.4 times every rate. **Synthetic, not measured traffic.** |
| Run | 600 s warm-up, then 3,600 s measured, for each of 30 seeds. All controllers see the same vehicles and routes for a given seed. |
| Delay | Seconds a vehicle spends waiting in queues, over the whole trip, averaged over vehicles that entered in the window. Driving time is excluded. A vehicle still queued at the end counts its wait so far. |
| Stops | Queue visits with any waiting, per vehicle. |
| Worst stream | The highest mean delay among the eight entrances. It shows whether a gain is bought by making one stream wait. |
| "vs fixed" | Mean change in delay against the fixed-time plan, seed by seed, with a 95% confidence interval. Negative is better. "(noise)" means the interval includes zero, so the data cannot separate the two. |
| "+/-" elsewhere | Standard deviation across seeds. |

**Controllers**

| Name | What it does |
|---|---|
| `fixed` | Same fixed-time plan at every junction: east-west 40 s, north-south 12 s, 3 s yellow, 2 s all-red, no offsets. The green split was tuned (42 combinations tried). |
| `actuated` | Sees only the queue at each stop line. Keeps green while a queue remains, hands over once the queue has been empty for 3 s and another phase is waiting. Green between 8 s and 50 s. |
| `green_wave` | The fixed plan with each junction's cycle shifted by the travel time from the previous one, favouring eastbound traffic. |
| `arrival_aware` | Like `actuated`, but also counts vehicles that will reach the stop line within 3 s, and ends green early when the waiting phase's demand exceeds the current phase's by 4 vehicles. If a junction has more than 8 vehicles queued in total, it drops both extras and behaves like `actuated`. |

**Reproduce**

```
python scripts/compare.py --demand-scale 0.5 1.0 1.4 1.8 2.2 --seeds 30 --seed-start 200 --markdown --csv docs/results/compare_fresh.csv
python scripts/sensitivity.py --demand-scale 1.0 --seeds 10 --markdown     # also 1.4 and 1.8
python scripts/tune_congestion.py                                          # the fallback limit
```

Per-seed numbers are in `docs/results/`. The whole comparison takes about a minute.

**Which seeds, and what was tuned on them.** This matters for how far to trust the numbers.

| Seeds | Used for |
|---|---|
| 0 to 3 | All tuning: the fixed-time green split, the actuated limits, the arrival-aware look-ahead and pressure margin, and the congestion limit. |
| 100 to 129 | The first full comparison, and the ablation. **The collapse was found here, and the fix was designed after seeing these results.** Kept as `compare.csv` / `compare.md` (after the fix) for reference. |
| 200 to 229 | Never used for any decision. **Every table below comes from these seeds.** |

Nothing was tuned for demand of 1.8x or more except that the congestion limit was chosen with 1.8x among its test points.

## Main results (fresh seeds 200 to 229)

Mean queueing delay per vehicle, in seconds. Lower is better.

### Light demand (x0.5, about 1,050 vehicles/h)

| controller | delay (s) | vs fixed (s) | stops/veh | mean queue | worst stream (s) | veh/h out |
|---|---|---|---|---|---|---|
| fixed | 20.3 +/- 0.5 | - | 1.12 | 6.0 | 26.7 | 1049 |
| actuated | 14.0 +/- 0.5 | -6.3 +/- 0.2 | 1.31 | 4.1 | 15.6 | 1050 |
| green_wave | 20.7 +/- 0.7 | +0.3 +/- 0.2 | 1.23 | 6.1 | 29.9 | 1050 |
| arrival_aware | 11.5 +/- 0.5 | -8.8 +/- 0.2 | 1.16 | 3.4 | 13.4 | 1050 |

### Normal demand (x1.0, about 2,100 vehicles/h)

| controller | delay (s) | vs fixed (s) | stops/veh | mean queue | worst stream (s) | veh/h out |
|---|---|---|---|---|---|---|
| fixed | 23.8 +/- 0.5 | - | 1.29 | 14.0 | 31.1 | 2093 |
| actuated | 20.1 +/- 0.5 | -3.7 +/- 0.2 | 1.56 | 11.8 | 21.7 | 2093 |
| green_wave | 23.9 +/- 0.6 | +0.1 +/- 0.2 (noise) | 1.43 | 14.1 | 33.3 | 2093 |
| arrival_aware | 16.9 +/- 0.6 | -6.9 +/- 0.2 | 1.38 | 9.9 | 22.1 | 2094 |

### High demand (x1.4, about 2,950 vehicles/h)

| controller | delay (s) | vs fixed (s) | stops/veh | mean queue | worst stream (s) | veh/h out |
|---|---|---|---|---|---|---|
| fixed | 31.1 +/- 1.2 | - | 1.45 | 25.7 | 46.8 | 2932 |
| actuated | 27.1 +/- 0.8 | -4.1 +/- 0.4 | 1.65 | 22.4 | 29.8 | 2934 |
| green_wave | 30.2 +/- 1.4 | -0.9 +/- 0.2 | 1.59 | 24.9 | 46.8 | 2935 |
| arrival_aware | 25.3 +/- 1.1 | -5.8 +/- 0.4 | 1.60 | 20.9 | 30.1 | 2935 |

### Near saturation (x1.8, about 3,800 vehicles/h)

| controller | delay (s) | vs fixed (s) | stops/veh | mean queue | worst stream (s) | veh/h out |
|---|---|---|---|---|---|---|
| fixed | 80.1 +/- 12.1 | - | 1.68 | 85.4 | 169.0 | 3733 |
| actuated | 65.2 +/- 13.1 | -15.0 +/- 2.7 | 1.81 | 69.5 | 102.4 | 3747 |
| green_wave | 77.4 +/- 12.1 | -2.8 +/- 0.6 | 1.75 | 82.4 | 170.0 | 3735 |
| arrival_aware | 65.0 +/- 13.0 | -15.2 +/- 2.8 | 1.81 | 69.2 | 103.1 | 3745 |

### Over capacity (x2.2, about 4,600 vehicles/h offered)

| controller | delay (s) | vs fixed (s) | stops/veh | mean queue | worst stream (s) | veh/h out |
|---|---|---|---|---|---|---|
| fixed | 375.3 +/- 28.1 | - | 1.63 | 485.7 | 501.7 | 3943 |
| actuated | 319.8 +/- 22.4 | -55.5 +/- 5.9 | 1.72 | 414.5 | 562.9 | 4053 |
| green_wave | 373.6 +/- 28.0 | -1.7 +/- 0.7 | 1.67 | 483.4 | 502.5 | 3944 |
| arrival_aware | 317.8 +/- 21.4 | -57.5 +/- 5.8 | 1.72 | 411.8 | 559.0 | 4054 |

At x2.2 more traffic is offered than the network can carry, so queues grow for the whole hour and the delay figures mostly measure how long the hour is. Throughput is the more meaningful column there.

### Arrival-aware against plain actuated, seed by seed

Difference in mean delay (arrival-aware minus actuated), 30 paired seeds, with 95% interval. Negative means arrival-aware is better.

| demand | delay difference (s) | seeds won | stops/veh difference |
|---|---|---|---|
| x0.5 | -2.46 +/- 0.17 | 30 of 30 | -0.14 |
| x1.0 | -3.18 +/- 0.20 | 30 of 30 | -0.17 |
| x1.4 | -1.73 +/- 0.25 | 30 of 30 | -0.04 |
| x1.8 | -0.20 +/- 1.25 (noise) | 15 of 30 | +0.00 (noise) |
| x2.2 | -2.05 +/- 1.25 | 21 of 30 | +0.01 |

At x2.2 the difference is statistically detectable but tiny (0.6%).

## What the data supports

1. **Responding to traffic beats a tuned fixed-time plan at every demand level tested.** `actuated` is 13% to 31% better in delay, `arrival_aware` 15% to 43%. This is the most robust result.
2. **Arrival information adds a further gain at light to high demand.** It is worth 18%, 16% and 6% over `actuated` at x0.5, x1.0 and x1.4, with fewer stops, and is consistent across seeds.
3. **At saturation the two responsive controllers are equal**, by design: the fallback makes a congested junction behave like `actuated`.
4. **The stop counts do not improve against the fixed plan.** `fixed` stops vehicles least at every demand level (1.12 to 1.68 per vehicle). The responsive controllers cut waiting but break the flow more often, because they change phase more often.
5. **No controller costs the smaller streams up to x1.8.** The worst-served stream is better under `actuated` and `arrival_aware` than under `fixed`. At x2.2 it is worse under both responsive controllers (559 to 563 s against 502 s) even though total delay and throughput are better: they shift waiting onto the busiest-queue streams when the network is overwhelmed.
6. **The green wave does nothing useful** here: differences against `fixed` are within 1 s up to x1.4, and slightly worse at light demand.

## The collapse, and the fix

### What happened

The first version of `arrival_aware` was very good up to x1.4 and then failed. Its results on the 100 to 129 seeds:

| demand | `fixed` | `actuated` | `arrival_aware`, first version | `arrival_aware`, with fallback |
|---|---|---|---|---|
| x1.4 | 31.7 | 27.6 | 29.2 | **25.7** |
| x1.8 | 80.2 | 65.4 | **221.6** | **65.4** |
| x2.2 | 387.2 | 324.7 | **595.9** | **323.2** |

At x1.8 throughput also fell (3,501 against 3,754 vehicles/h for the fixed plan), so the controller was moving fewer vehicles than the plan it was meant to beat.

### Why

Ablation of the first version (`scripts/sensitivity.py`, 10 seeds, seeds 100 to 109, delay in seconds, no fallback in this table):

| look-ahead | margin | x1.0 | x1.4 | x1.8 |
|---|---|---|---|---|
| 0 (= actuated) | off | 20.1 | 27.4 | 63.5 |
| 0 | 4 | 20.2 (noise) | 32.0 | **237.7** |
| 3 | off | 18.8 | 28.8 | 94.0 |
| 3 | 4 | **17.0** | 28.6 | 226.1 |
| 6 | off | 21.5 | 35.1 | 176.3 |
| 10 | off | 27.9 | 49.5 | 270.3 |
| 15 | off | 35.2 | 76.5 | 346.7 |

- The **pressure rule on its own** (look-ahead 0, margin 4) changes nothing at x1.0 but multiplies delay almost fourfold at x1.8. When every queue is long the rule fires as soon as minimum green ends. Measured at x1.8 on one seed, green periods average 17 s (median 12 s) instead of 34 s for the actuated controller, so there are 76% more phase changes, and each one costs 5 seconds of yellow and all-red.
- **Look-ahead on its own** gets worse as demand rises and as the horizon grows: a busy road always has vehicles about to arrive, so the controller keeps holding its green and starves the other phase.
- At x1.0 the pressure rule limits the damage a long look-ahead does, which is why the combination looked good on the tuning demand. Each ingredient is harmful in a different regime.

### The fix

A junction whose approaches hold more than `congestion_limit` queued vehicles in total ignores the look-ahead and the pressure rule and decides from the queue alone, exactly like `actuated`, until the queue falls back (`trafficsim/controllers/arrival_aware.py`). The limit was chosen with `scripts/tune_congestion.py` on seeds 0 to 3. Delay in seconds on those seeds:

| congestion limit | x0.5 | x1.0 | x1.4 | x1.8 |
|---|---|---|---|---|
| actuated | 13.9 | 20.1 | 27.0 | 73.6 |
| off (the first version) | 11.6 | 16.5 | 29.3 | 188.9 |
| 4 | 11.6 | 16.6 | 25.2 | 71.0 |
| 8 (chosen) | 11.6 | 16.6 | 25.3 | 70.8 |
| 12 | 11.6 | 16.5 | 25.8 | 72.2 |
| 16 | 11.6 | 16.5 | 28.1 | 77.3 |
| 24 | 11.6 | 16.5 | 29.2 | 85.2 |

Any limit from 4 to 12 works about equally; 8 was chosen as the middle of that range, not the nominal best, to avoid relying on a sharp optimum. The tables above show the result on seeds the fix was never tuned or designed on.

Side effect worth noting: with the fallback, `arrival_aware` also beats `actuated` at x1.4 (by 1.7 s), where the first version lost to it, because the fallback switches off the extras exactly when they began to hurt.

## The original idea was not demonstrated

The project's premise is that flow released at one junction should shape the next junction's timing. In the simulator that corresponds to a long look-ahead (the road between junctions takes 22 s to drive). Without the pressure rule, every look-ahead of 6 s or more was **worse** than the plain actuated controller at x1.0, x1.4 and x1.8. With the rule, 6 s still beat actuated at x1.0 (18.2 s against 20.1 s) but not the 3 s setting, and 10 and 15 s were no better than actuated (20.3 s and 23.2 s; see `docs/results/sensitivity_x1.0.md`). The best setting, 3 s, only sees the next few cars on the approach road, which a conventional advance detector can do. So the simulator shows the value of a short-range detector, not of coordination between junctions. These ablation runs predate the fallback, which only acts at congested junctions, so they still describe the light-to-normal regime; they were not repeated with it.

The one coordination method tested, the green wave, did not help. Its offsets favour eastbound traffic only, the shared east-west phase makes the westbound platoon meet the shifted greens in the wrong order, and platoons here are short and spread out. A compromise offset or a different cycle length was not tried.

## Spillback (exploratory, seeds 0-3)

Spillback is now in the model but **off by default**, so every number above is unchanged. Switch it on with `--spillback` (`scripts/compare.py`, `run.py`, `tune_congestion.py`, `view.py`). A road then holds `length x lanes / 7.5 m` vehicles (`vehicle_space_m` in the network file); when the road a queue's front vehicle wants is full, that vehicle and everyone behind it wait even on green. Roads that leave the map never fill. The new metric `blocked_green_s` counts green approach-seconds wasted this way.

These runs used the tuning seeds 0-3 and were not held out; treat them as a first look, not a result.

**1. On the corridor as built, spillback hardly matters.** At every demand level up to x2.2 the blocked green is 0-11 s per hour and delays match the no-spillback numbers (x2.2: fixed 368 s, actuated 315 s, arrival-aware 318 s). The queues form on the entrance roads, whose length is not limited, while the 300 m links between junctions drain as fast as they fill. So the earlier high-demand numbers were not optimistic for this layout; the corridor simply has no place for a queue to block another.

**2. Where it can bite (`config/corridor_short_links.yaml`: internal links 100 m, 13 vehicles), the responsive controllers collapse and the fixed plan does not.** Mean delay in seconds, seeds 0-3, spillback on:

| Demand | Fixed | Actuated | Arrival-aware | Blocked green, actuated (s/h) |
|---|---|---|---|---|
| x1.0 | 20.5 | 20.5 | 17.3 | 1 |
| x1.4 | 27.3 | 27.7 | 25.4 | 41 |
| x1.8 | 74.1 | 157.1 | 169.7 | 573 |

At x1.8 both responsive controllers are about twice as slow as the fixed plan and lose ~4% throughput. **Diagnosis** (`scripts/diagnose_spillback.py`, `tests/test_diagnosis.py`; seeds 0-3, x1.8, entrance road `W_J1` feeding link `J1_J2`):

| | Fixed | Actuated | Arrival-aware |
|---|---|---|---|
| J1 and J2 east-west green together | 100% | 37% | 36% |
| `W_J1` served / arriving (veh/h) | 1079 / 1080 | 1002 / 1080 | 991 / 1080 |
| `W_J1` queue at 600, 1200 ... 3000 s | 13, 28, 20, 24, 34 | 35, 59, 76, 90, 112 | 31, 58, 73, 87, 113 |

1. **Spillback is the cause.** With it off, the same network gives fixed 74.1 s, actuated 72.6 s, arrival-aware 70.3 s: no collapse.
2. **The entrance approaches have almost no spare capacity at x1.8.** `W_J1` and `E_J3` carry 1080 veh/h against a green share of about 63%, roughly 1100 veh/h of capacity.
3. **The fixed plan never fills the links.** All junctions use the same plan with no offset, so when a platoon leaves J1 the green at J2 is also on, and the 13-vehicle link stays empty.
4. **The responsive controllers let the junctions drift apart.** Each ends its east-west green on its own gap-out or max-out, so the greens overlap only about 37% of the time. J2's red then fills the link and `W_J1` is blocked for part of its green: 2-9% of green on the approaches, which is 7% of its capacity (1002 against 1080 veh/h served). That puts the approach over capacity, and its queue grows without limit (35 to 112 vehicles over 50 minutes).
5. **It is a stability threshold, not a steady loss.** At x1.4 the same actuated controller serves the full demand and the queue stays at 1-4 vehicles. A small capacity loss matters only because the approach is already near saturation.

**What was wrong with the first guess.** I expected the controllers to hold green for an approach that cannot move. They do not do so much: blocked green is only 2-9% of green. The cost is the blocking itself on an approach with no slack, and the cause of the blocking is loss of synchronisation between neighbouring junctions.

This is a case where the neighbour's state does matter, which is the part of the original idea the earlier results did not support. It is shown on one layout and one demand pattern, with seeds 0-3.

**3. The congestion fallback still does its job, but it is not enough.** In the same short-link network at x1.8, arrival-aware without the fallback is 238 s; with a limit of 4, 8 or 16 it is 131, 143 or 128 s, level with plain actuated (132 s). So the fallback removes the extra collapse it was built for, but the base queue-actuated logic is itself badly hurt by spillback.

**What this means.** The claim "the arrival-aware controller beats the fixed plan" holds on the corridor as built, with or without spillback, but it does not survive a layout with short links at high demand. A responsive controller has to keep the downstream junction's green on while the link feeding it is nearly full, or otherwise stay in step with its neighbour. Ending green for a blocked approach would not help: the cause is lost synchronisation, not wasted green. This was then built; see the next section.

## The neighbour-aware controller, and what it showed

`neighbour_aware` is the arrival-aware controller plus one rule: a phase serving an approach fed by an internal link may not end (by max-out or the pressure rule; gap-out still ends it) while that link is at least `link_hold_fill` (0.1) full, for at most `hold_extra_s` (60) seconds past the max green. It was built to fix the short-link collapse above. Settings were chosen on seeds 0-3; everything below is on **fresh seeds 300-329** (30 paired seeds, 95% intervals, delay in seconds; raw data in `docs/results/neighbour_*.csv` and `.md`).

### Short links with spillback (`corridor_short_links.yaml`), x1.8

| Controller | Default timing (max green 50) | Baselines given max green 110 |
|---|---|---|
| fixed | 72.7 | 72.7 |
| actuated | 142.1 | 76.2 |
| arrival-aware | 137.9 | 74.7 |
| neighbour-aware | **51.9** | **52.2** |

- Against the fixed plan: 20.8 +/- 3.7 s better, on 30 of 30 seeds. Throughput 3775 against 3629 veh/h for actuated (default) and 3750 for fixed.
- Against arrival-aware with the same max green (110): 22.4 +/- 10.1 s better, on 25 of 30 seeds; against actuated 23.9 +/- 9.3 s, 26 of 30. The spread across seeds is also much smaller (+/- 8 against +/- 29), and blocked green falls from 956 to 570 s/h.
- So the collapse is fixed, and the rule adds something beyond simply allowing longer greens. At x1.0 and x1.4 it ties arrival-aware (differences under 0.5 s).

### The original corridor (no spillback), where the rule should not matter

| Demand | fixed | arrival-aware, max 50 | arrival-aware, max 110 | neighbour-aware (max 110) |
|---|---|---|---|---|
| x1.8 | 77.3 | 64.6 | 43.0 | 42.8 |
| x2.2 | 378.6 | 318.4 | 147.3 | **113.2** |

- At x1.8 the neighbour rule adds nothing over a 110 s max green (-0.2 +/- 0.5 s). **The entire gain from 64.6 to 43 s comes from the max-green setting**: -21.6 +/- 4.7 s on 30 of 30 seeds.
- At x2.2 the same setting change takes arrival-aware from 318 to 147 s (-171 +/- 2.6 s), and the neighbour rule gains a further 34.1 +/- 3.3 s (30 of 30). That is probably because it allows greens of up to 170 s; plain max green 170 was not tested on the corridor.
- At x1.0 and x1.4 it ties arrival-aware (within 0.4 s).

### What this shows

1. **The max green of 50 s was a handicap for every responsive controller at high demand.** It was a provisional starting value (`controllers.yaml` says so) and was never swept. On seeds 0-3, a cap of 70 to 150 s took x1.8 from 70.8 s to 44-46 s; on the 30 fresh seeds a cap of 110 s was better on every seed, by 21.6 s at x1.8 and 171 s at x2.2. The settings in `controllers.yaml` still say 50 s because that is what all earlier tables used; the neighbour-aware controller allows longer greens through its own rule.
2. **The fixed baseline was also weak at high demand.** Tuned at x1.0 (40 s / 12 s), it is far from the best plan at x1.8 and x2.2. A fixed plan tuned for each demand level (seeds 0-3): at x1.8, 70 s / 20 s gives 44.1 s, level with the responsive controllers (43.9 arrival-aware at max 110, 42.1 neighbour-aware); at x2.2, 70 s / 20 s gives 144.9 s against 143.0 (arrival-aware, max 110) and 109.6 (neighbour-aware). A fixed plan that good has to be re-tuned whenever demand changes, while the responsive controllers got the same settings at every level. This was not tested on short links under spillback.
3. **The link-fullness cue is not what makes the rule work.** On short links any `link_hold_fill` from 0.01 to 0.15 gave identical results, because the link nearly always holds a vehicle; 0.3 and above were worse, because a link only looks nearly full after the blocking has started. What helps is allowing longer greens on the phases that serve the through road, not reading the neighbour's state. Side-street phases keep their normal limit, which is why this beat a plain longer max green on short links.
4. **A real, if narrow, result, and not the one first claimed.** With spillback on short links and high demand, the neighbour-aware rule beats the other responsive controllers and the fixed plan tuned at x1.0 on fresh seeds. It does not beat a fixed plan tuned for that demand (see the fair re-tune below). Everywhere else its advantage over a properly set arrival-aware controller is within noise.

**Caveats.** Settings were tuned on seeds 0-3 on the short-link layout; the corridor and short-link layouts are the same junction design with different link lengths, so this is not independent evidence about other layouts. Entrance roads are still unlimited. The 2x2 grid, where links form cycles, has not been tried. A mixed-length network was not tried. The 50 s to 110 s change was not made to the shipped defaults, so a fresh `compare.py` run with defaults will still show the old high-demand gaps.

## The fair re-tune

Every controller was given the same freedom (`scripts/retune.py`, settings in `config/retune.yaml`, raw tables in `docs/results/retune.{md,csv}`):

- **Fixed-time:** the best EW/NS green split per layout and demand level, from a 10 x 6 grid.
- **Queue-actuated, arrival-aware, neighbour-aware:** the best `max_green_s` per layout and demand level, from seven values (30 to 200 s). Each was also run with **one** `max_green_s` for all demand levels (the best average over the five levels), because needing no re-tune when demand changes is the point of a responsive controller.
- Settings were chosen on seeds 0-3 and judged on **fresh seeds 400-429**, never used before. "vs tuned fixed" is a paired difference with a 95% interval. Demand x0.5, 1.0, 1.4, 1.8, 2.2; two layouts (the corridor without spillback, the 100 m short-link layout with spillback).

Mean queueing delay in seconds, with the difference from the tuned fixed plan in brackets (negative is better). The responsive columns are the one-setting rows; the per-demand rows are in `docs/results/retune.md`.

| Layout, demand | Fixed, x1.0 plan | Fixed, tuned | Actuated | Arrival-aware | Neighbour-aware |
|---|---|---|---|---|---|
| Corridor x0.5 | 20.3 | 18.0 | 13.8 (-4.2) | 11.1 (-6.9) | 11.1 (-6.9) |
| Corridor x1.0 | 23.7 | 23.7 | 19.8 (-3.9) | 16.7 (-7.0) | 16.7 (-7.0) |
| Corridor x1.4 | 31.2 | 31.8 | 26.9 (-4.9) | 24.5 (-7.2) | 24.6 (-7.1) |
| Corridor x1.8 | 81.8 | 45.8 | 44.6 (-1.2 +/- 0.9) | 44.0 (-1.8 +/- 0.8) | 44.0 (-1.8 +/- 0.8) |
| Corridor x2.2 | 384.0 | 127.7 | 111.6 (-16.1) | 122.5 (-5.2) | 109.4 (-18.3) |
| Short links x0.5 | 17.7 | 16.0 | 13.8 (-2.2) | 11.1 (-4.9) | 11.2 (-4.8) |
| Short links x1.0 | 20.5 | 20.2 | 20.3 (noise) | 17.4 (-2.8) | 17.1 (-3.1) |
| Short links x1.4 | 27.2 | 26.5 | 27.7 (+1.3) | 25.2 (-1.3) | 24.6 (-1.9) |
| Short links x1.8 | 77.3 | 42.8 | 76.8 (+34.0) | 74.3 (+31.5) | 51.8 (+9.0) |
| Short links x2.2 | 380.7 | 139.3 | 476.2 (+337) | 455.3 (+316) | 299.5 (+160) |

Differences are significant at 95% unless marked; intervals are well under 1 s at light demand and a few seconds at x1.8 and above (the x2.2 differences carry intervals of 3 to 35 s).

What it shows:

1. **On the corridor, responding to traffic is worth about 7 s (30%) at light and normal demand, with no re-tuning.** Arrival-aware and neighbour-aware with one setting (`max_green_s` 150) beat a fixed plan tuned for each demand level by 7 s at x0.5, x1.0 and x1.4. The queue-only controller gets 4 to 5 s. This part of the earlier result holds.
2. **At x1.8 the gap nearly closes** (1.2 to 1.8 s with one setting, 3.6 s with a per-demand setting for neighbour-aware; about 3 to 8%). The earlier tables showed 19% there; that was against a plan tuned at x1.0 (81.8 s).
3. **At x2.2 (over capacity) the tuned plan is 16 to 18 s worse than queue-actuated and neighbour-aware** (13 to 14%) but only 5 s worse than arrival-aware, and the spread across seeds is large (sd 12 to 16 s).
4. **On short links under spillback the tuned fixed plan wins at high demand.** At x1.8 it gives 42.8 s against 51.8 for neighbour-aware and 74 to 77 for the others; at x2.2, 139 s against 300 and 455. I earlier reported neighbour-aware beating the fixed plan by 20.8 s on short links. That was against the x1.0 plan (77.3 s); against a plan tuned for the demand it is 9 s worse. The collapse fix is real (neighbour-aware is far better than the other responsive controllers there), but it does not beat a well-set fixed plan in that setting. This fits the diagnosis: a fixed plan keeps neighbouring junctions in step, which the responsive controllers lose.
5. **At x1.0 and x1.4 on short links the gain is small:** 1.3 to 3.1 s for arrival-aware and neighbour-aware, none for the queue-only controller.
6. **The x1.0 plan is not wrong at light demand.** It is within 2 s of the tuned plan up to x1.4 and breaks at x1.8 and above, where the plan must change (EW 70 to 110 s). A fixed plan cannot suit both; a responsive controller does not need telling.
7. **Neighbour-aware vs arrival-aware,** both properly set: a tie on the corridor except at x2.2 (13 s better), and far better on short links at x1.8 and x2.2 (about 22 s and 156 s).
8. **The best single `max_green_s` is nowhere near 50.** Across the five demand levels it was 150 for arrival-aware and neighbour-aware on the corridor (200 for actuated) and 70 to 110 on short links. The shipped default in `config/controllers.yaml` is still 50, so `compare.py` run with defaults still shows the old gaps. The default has since been set to 110 and the headline tables rerun (next section). The 2x2 grid later showed 110 is the wrong end for layouts with cycles of short links (see "The 2x2 grid").

Caveats:

- **Winners at the edge of the grid.** Several best settings sit at the edge of what was searched: `max_green_s` 200 (actuated), EW 110 at x2.2 on the corridor, NS 8 at x0.5. The true optimum may lie beyond, for the fixed plan and the responsive controllers alike. At light demand `max_green_s` hardly matters (150 and 200 gave identical results), so the choice there is arbitrary.
- **Tuning noise.** Settings came from four tuning seeds. At x1.4 on the corridor the "tuned" plan (60/20) is 0.5 s worse on fresh seeds than the x1.0 plan, so tuned plans carry a little optimism.
- **The fixed plan was given exact knowledge of the demand,** which a real fixed system does not have; one set for an average would be wrong much of the day. The responsive controllers were given no such knowledge.
- **Not re-tuned:** look-ahead, switch margin, congestion limit and the neighbour rule's 60 s extension.
- Same synthetic demand, same junction design, two layouts. The 2x2 grid is untried and entrance roads still hold unlimited queues.

## Headline tables with max green 110 s on every layout (superseded by "The final model")

`max_green_s` in `config/controllers.yaml` is now 110 (was 50, never swept; see the fair re-tune above for why 110). Hold extension, look-ahead, margin and congestion limit are unchanged. Every table below uses **fresh seeds 500-529**, `compare.py` defaults (3,600 s after 600 s warm-up), and the **fixed plan tuned at x1.0 (40 s / 12 s)**, so "vs fixed" is against that plan. Against a plan tuned for each demand level the gaps are much smaller; use the fair re-tune table for that. Full tables: `docs/results/headline_corridor.md` and `docs/results/headline_corridor_short_links.md` (per-seed CSVs alongside).

Mean queueing delay in seconds (difference from the x1.0 fixed plan in brackets).

| Layout, demand | Fixed (x1.0 plan) | Actuated | Arrival-aware | Neighbour-aware |
|---|---|---|---|---|
| Corridor x0.5 | 20.3 | 13.8 (-6.5) | 11.1 (-9.2) | 11.1 (-9.2) |
| Corridor x1.0 | 23.8 | 20.1 (-3.8) | 16.9 (-7.0) | 16.7 (-7.1) |
| Corridor x1.4 | 31.1 | 27.0 (-4.1) | 24.9 (-6.2) | 24.6 (-6.4) |
| Corridor x1.8 | 79.1 | 43.5 (-35.6) | 43.3 (-35.7) | 42.3 (-36.8) |
| Corridor x2.2 | 380.5 | 148.1 (-232) | 148.8 (-232) | 114.7 (-266) |
| Short links (spillback) x0.5 | 17.7 | 13.9 (-3.8) | 11.3 (-6.4) | 11.3 (-6.4) |
| Short links x1.0 | 20.6 | 20.6 (noise) | 17.4 (-3.2) | 17.3 (-3.4) |
| Short links x1.4 | 27.1 | 27.5 (noise) | 24.9 (-2.2) | 24.6 (-2.5) |
| Short links x1.8 | 74.4 | 72.6 (noise) | 78.7 (noise) | 50.7 (-23.7) |
| Short links x2.2 | 378.7 | 481.0 (+102) | 489.5 (+111) | 385.3 (noise) |

What changed from the earlier headline tables:

- **High demand on the corridor is now far better for every responsive controller** (x1.8: arrival-aware 43.3 s, was about 65 s; x2.2: about 149 s, was 318 s). The earlier large gains at x1.8 and x2.2 were mostly the 50 s cap's fault; those gains are still large here only because the comparison plan is the x1.0 one. Against a tuned plan they are 2 s at x1.8 and 5 to 18 s at x2.2.
- **Light to normal demand is unchanged** within about 0.3 s, as expected: max green rarely binds there.
- **Short links under spillback:** only neighbour-aware avoids the collapse at x1.8. At x2.2 (over capacity) all of them are level with or worse than the fixed plan, and actuated and arrival-aware are about 100 s worse with large spread across seeds. At x2.2 the tuned fixed plan (139 s, see the re-tune) is far better than any responsive controller.
- **Green wave** is still within about 1 s of the fixed plan (a few seconds worse or better at x2.2) and does nothing useful.
- Blocked green (short links) stays small at x1.4 and below and large at x1.8 and above for the controllers that collapse, which matches the diagnosis.

Earlier tables in this document (seeds 200-229 and before) were produced with the 50 s cap and are kept as the record of what was found; do not quote their high-demand rows.

## The 2x2 grid

A layout where links form cycles, which the corridor cannot show. `config/grid_2x2.yaml`: four junctions in a square (A, B on the north row, C, D on the south row), every neighbouring pair joined by a two-way 150 m link, so traffic can circle A -> B -> D -> C -> A. Each junction has two boundary sides; 350 veh/h enters at each of the eight boundaries (2,800 veh/h at x1.0, about 80% of capacity); 70% go straight on, 15% turn each way; two phases per junction. **Synthetic, with provisional values like the corridor.** Same method as the fair re-tune (`config/retune_grid.yaml`, `docs/results/retune_grid.{md,csv}`), judged on **fresh seeds 600-629**, with the spillback model both off and on. Also the shipped defaults (max green 110) on the grid with spillback: `docs/results/grid_defaults.{md,csv}`.

Mean queueing delay in seconds, each controller at its best single `max_green_s` across demand levels (30 to 200 s tried); the fixed plan is tuned per demand level (EW and NS green, 10 to 80 s tried). The x1.0 plan of the corridor (40 s / 12 s) is far wrong here (298 s at x1.0) because demand is symmetric, so it is not used as the baseline.

| Demand | Fixed, tuned | Actuated | Arrival-aware | Neighbour-aware |
|---|---|---|---|---|
| x0.5 | 21.7 | 17.0 (-4.6) | 14.0 (-7.7) | 13.9 (-7.7) |
| x1.0 | 26.1 | 23.7 (-2.5) | 21.2 (-4.9) | 20.3 (-5.8) |
| x1.4 | 34.4 | 33.3 (-1.1) | 33.1 (-1.3) | 30.6 (-3.8) |
| x1.8 | 49.5 | 54.4 (+4.9) | 54.3 (+4.8) | 50.5 (+1.0) |
| x2.2 | 98.3 | 106.7 (+8.5) | 106.3 (+8.0) | 98.7 (+0.4, noise) |

(No spillback. Best settings: max green 70 for actuated and arrival-aware, 50 for neighbour-aware.)

With spillback on (every row compared with the fixed plan tuned for the same demand):

| Demand | Fixed, tuned | Actuated | Arrival-aware | Neighbour-aware |
|---|---|---|---|---|
| x0.5 | 21.7 | 17.1 (-4.6) | 14.3 (-7.4) | 14.1 (-7.5) |
| x1.0 | 26.1 | 23.7 (-2.4) | 21.2 (-4.9) | 20.3 (-5.8) |
| x1.4 | 34.4 | 32.8 (-1.6) | 33.0 (-1.4) | 30.0 (-4.4) |
| x1.8 | 49.7 | 56.9 (+7.2) | 56.6 (+6.8) | **47.7 (-2.0)** |
| x2.2 | 1019 +/- 402 | 699 +/- 476 | 461 +/- 297 | 226 +/- 124 |

(Best single max green was 30 s, the edge of the grid searched, for all three.)

What it shows:

1. **Below saturation the responsive controllers win, and neighbour-aware wins most.** At x0.5 to x1.4 every responsive controller beats the tuned fixed plan; neighbour-aware by 5.8 s (22%) at x1.0 and 3.8 to 4.4 s at x1.4. This is a larger and steadier advantage for neighbour-aware than on the corridor, where it tied arrival-aware below x2.2. In the grid it is about 1 to 3 s better than arrival-aware at x1.0 and x1.4.
2. **At x1.8 the tuned fixed plan is level or better** (neighbour-aware ties without spillback, wins by 2.0 +/- 0.6 s with it; actuated and arrival-aware lose by 5 to 7 s). Same pattern as the corridor: at high demand a plan tuned for that demand is hard to beat.
3. **At x2.2 with spillback the grid gridlocks.** Every fixed plan collapses: throughput falls from about 6,100 veh/h (spillback off) to 1,450-2,800 veh/h, and longer greens make it worse (EW/NS 20 s: 877 s; 80 s: 1,240 s on seeds 600-609). All responsive controllers also collapse, but much less with a short max green (neighbour-aware 204 s, arrival-aware 346 s at max green 30). The "tuned" fixed value of 1,019 s is just the least-bad of several collapsed plans, with a huge spread, so the fixed row at x2.2 should not be read as a working plan. Neighbour-aware avoided the worst of the gridlock; the others only partly.
4. **The shipped default of 110 s is bad on the grid under spillback.** With defaults (`grid_defaults.md`), at x1.8 actuated gives 108 s, arrival-aware 132 s and neighbour-aware 106 s, against 48 s for neighbour-aware at max green 30 and 50 for the tuned fixed plan; at x2.2, 777 to 1,201 s. The grid is the opposite of the corridor: there, long greens were best; here, with cycles of short links, short greens are, because a long green fills the link downstream and the cycle locks up. **So 110 is not a universal best. It is the middle of the corridor's and short links' values and the wrong end for the grid.** At x1.0 and x1.4 the default costs nothing (max green rarely binds).
5. **Spillback itself changes little below saturation:** the results with it on and off are the same within noise up to x1.4.

Limits specific to the grid:

- One grid, one demand pattern (symmetric, 350 veh/h per boundary), one link length (150 m). No through-road with heavier flow, so no green-wave opportunity was tested; the `green_wave` controller was not run here because its route and offsets are specific to the corridor.
- The best max green sits at the lower edge of the grid searched (30 s) under spillback, so shorter may be better still.
- Gridlock at x2.2 is a property of the model's finite roads and unlimited entrance queues together; real drivers would not enter a blocked junction in the same way.
- The fixed plan was tuned on four seeds; at x2.2 with spillback that choice is close to arbitrary.

## The final model: refinements, and what it still cannot do

Two changes came out of the grid test. A third idea was tried and dropped.

**1. Skip blocked queues (`skip_blocked`, neighbour-aware only, on in the shipped config).** With spillback, an approach whose front vehicle is held by a full road ahead cannot use a green, yet its queue counted as demand, so a blocked green was held until it gapped out on nothing else. Now such an approach counts as no demand, so the green goes to a phase that can move. `FlowState.front_blocked(approach)` is the check. It does nothing without spillback (the corridor results are identical with it on or off). Effect on fresh seeds 800-829, each at its best single `max_green_s`: short links x1.8 from 49.1 s to 45.8 s and x2.2 from 299 s to 238 s; corridor, grid x0.5 to x1.8: no change within 0.1 s; grid x2.2: 237 s to 255 s (both are gridlocked and the spread is about 165 s, so this is noise). **A modest gain on one layout, not a general one.**

**2. Max green per layout (`switching_by_network` in `config/controllers.yaml`).** The best single value was 150 s on the corridor, 90 s on short links, 30 s on the grid (the 2x2 grid section explains why). A universal rule was tried and failed. Ending a green early when the road it feeds is nearly full fixed the grid at x2.2 (947 s to 259 s at max green 110, seeds 0-3) but made short links much worse at x1.8 (49 s to 100-173 s): short links want long greens even when the road ahead is nearly full, the grid does not. So the default is now chosen per layout, keyed by the network's name, with 110 kept for any unnamed network. **This is per-layout tuning and not a general controller:** a new layout needs its own sweep with `scripts/retune.py`.

**3. Dropped: "end the green when the downstream link is nearly full".** See above; it helps one layout and hurts another, so it is not in the code.

### Final comparison

Fresh seeds 800-829 (`docs/results/final_fair.{md,csv}`; the same run without `skip_blocked` is `final_fair_without_skip_blocked.csv`). Each responsive controller runs at its layout's single `max_green_s`; the fixed plan is tuned per layout and demand level. Mean queueing delay in seconds, difference from the tuned fixed plan in brackets (negative is better).

| Layout, demand | Fixed, tuned | Actuated | Arrival-aware | Neighbour-aware |
|---|---|---|---|---|
| Corridor x0.5 | 17.8 | 13.8 (-4.0) | 11.0 (-6.7) | 11.0 (-6.7) |
| Corridor x1.0 | 23.9 | 20.2 (-3.7) | 16.9 (-7.0) | 16.9 (-7.0) |
| Corridor x1.4 | 31.5 | 26.6 (-4.9) | 24.5 (-7.0) | 24.5 (-6.9) |
| Corridor x1.8 | 49.3 | 44.1 (-5.2) | 43.8 (-5.5) | 43.4 (-5.9) |
| Corridor x2.2 | 124.0 | 116.4 (-7.7) | 115.8 (-8.2) | 102.5 (-21.6) |
| Short links x0.5 | 16.0 | 13.8 (-2.1) | 11.2 (-4.7) | 11.2 (-4.8) |
| Short links x1.0 | 20.3 | 20.7 (+0.4) | 17.5 (-2.9) | 17.3 (-3.1) |
| Short links x1.4 | 26.5 | 27.4 (+1.0) | 25.0 (-1.4) | 24.5 (-2.0) |
| Short links x1.8 | 42.8 | 78.3 (+35.5) | 69.6 (+26.9) | 45.8 (+3.1) |
| Short links x2.2 | 131.1 | 475.1 (+344) | 465.7 (+335) | 237.6 (+107) |
| Grid x0.5 | 21.6 | 17.0 (-4.5) | 14.2 (-7.4) | 14.1 (-7.5) |
| Grid x1.0 | 27.8 | 23.7 (-4.1) | 21.1 (-6.7) | 20.4 (-7.4) |
| Grid x1.4 | 34.3 | 32.8 (-1.4) | 32.9 (-1.4) | 30.0 (-4.2) |
| Grid x1.8 | 49.2 | 55.2 (+6.0) | 55.7 (+6.5) | 47.6 (-1.6) |
| Grid x2.2 | 1025.9 | 661.7 (-364) | 522.6 (-503) | 254.5 (-771) |

All differences are significant at 95% on 30 paired seeds except where the interval is wider than the difference (the x2.2 rows have intervals of 3 to 180 s). The corridor's fixed plan in this run came from a coarser grid of green times than the earlier re-tune, so its x1.8 and x2.2 values are a few seconds worse than the 45.8 s and 127.7 s found there; use the earlier table for the corridor's tightest fixed-plan comparison.

**Reading it honestly:**

- **Where it clearly works:** below saturation (x0.5 to x1.4) on all three layouts, neighbour-aware and arrival-aware beat a tuned fixed plan: 3 to 7 s on the corridor and the grid (about 30%), 1.4 to 4.8 s on short links. Neighbour-aware adds about 1 to 3 s over arrival-aware on the grid and short links at x1.0 and x1.4. The queue-only controller does less and on short links is level with fixed or worse.
- **At x1.8 it is level with a tuned fixed plan at best:** the corridor gap is 5 to 6 s with this coarser plan (1.8 to 3.6 s in the earlier re-tune); on short links the tuned fixed plan wins by 3 s over neighbour-aware and by 27 to 36 s over the others; on the grid neighbour-aware wins by 1.6 s.
- **Over capacity (x2.2) the picture splits:** on the corridor neighbour-aware is better by 22 s; on short links and the grid, every plan including the best fixed ones gridlocks or nearly so. On the grid neighbour-aware (255 s) is far better than the others and than fixed (1,026 s), but 255 s is still a collapsed network, not a working plan. On short links the tuned fixed plan is better than all.
- **Controllers other than neighbour-aware are not safe on short links under heavy load.** Actuated and arrival-aware are 27 to 36 s worse than a tuned fixed plan at x1.8 there.
- **The final model is not one setting that suits every network.** It needs its own `max_green_s` per layout, tuned on a few seeds, and its best layout-specific values (150, 90, 30) differ by a factor of five.

### Headline tables for the final model

Shipped defaults (`compare.py`, fresh seeds 900-929, `docs/results/final_headline_*.{md,csv}`). The baseline is the fixed plan tuned at x1.0 for that layout (40 s / 12 s on the corridor and short links; 25 s / 25 s on the grid, `config/fixed_time_grid.yaml`), so gaps at x1.8 and above are much larger than against a plan tuned per demand level (previous table). The grid table leaves out the green wave, whose route is corridor-specific.

| Layout, demand | Fixed (x1.0 plan) | Actuated | Arrival-aware | Neighbour-aware |
|---|---|---|---|---|
| Corridor x0.5 | 20.5 | 13.7 (-6.8) | 11.1 (-9.3) | 11.1 (-9.4) |
| Corridor x1.0 | 23.6 | 19.8 (-3.8) | 16.8 (-6.8) | 16.6 (-7.0) |
| Corridor x1.4 | 31.6 | 27.3 (-4.2) | 25.2 (-6.4) | 25.0 (-6.5) |
| Corridor x1.8 | 79.1 | 43.9 (-35.2) | 43.4 (-35.7) | 42.9 (-36.2) |
| Corridor x2.2 | 382.6 | 122.7 (-260) | 121.9 (-261) | 108.2 (-274) |
| Short links x0.5 | 17.8 | 13.8 (-4.0) | 11.3 (-6.5) | 11.2 (-6.6) |
| Short links x1.0 | 20.3 | 20.3 (noise) | 17.1 (-3.3) | 17.0 (-3.3) |
| Short links x1.4 | 27.5 | 27.7 (noise) | 25.3 (-2.2) | 24.7 (-2.8) |
| Short links x1.8 | 74.4 | 86.0 (+11.7) | 80.5 (noise) | 46.4 (-27.9) |
| Short links x2.2 | 379.8 | 453.2 (+73.5) | 442.5 (+62.8) | 246.8 (-132.9) |
| Grid x0.5 | 22.3 | 17.1 (-5.2) | 14.2 (-8.1) | 14.1 (-8.2) |
| Grid x1.0 | 26.2 | 23.6 (-2.6) | 21.1 (-5.2) | 20.3 (-6.0) |
| Grid x1.4 | 34.9 | 32.6 (-2.3) | 32.7 (-2.2) | 29.9 (-5.0) |
| Grid x1.8 | 374.9 +/- 391 | 56.6 | 119.6 +/- 243 | 47.6 |
| Grid x2.2 | 1,189 | 644 | 731 | 252 |

(The grid x1.8 fixed plan, 25 s / 25 s, gridlocks on some seeds; a plan tuned for that demand (40 s / 40 s) scores 49 s, as above.) The earlier "Headline tables with the new default" section used a single max green of 110 on every layout and is superseded by this one.

## Phase A and B: entrance limit, wider re-tune, option tuning and ablation

Plan: `docs/IMPROVEMENT_PLAN.md`. Raw data: `docs/results/phaseB_retune.{md,csv}`, `phaseB_tune_params.{md,csv}`; run output in `runs/out/` (git-ignored).

**Phase A: what changed in the model.**

- **Entrance limit** (`entrance_limit`, `compare.py --entrance-limit`, `retune` scenario key `entrance_limit`; needs spillback, off by default). A vehicle that arrives while its entrance road is full is refused instead of joining an unlimited queue, and counted as `denied`. Its random draws are still used up, so the traffic offered does not depend on the controller. With the option off every earlier number is unchanged (all 248 earlier tests pass).
- **Refused vehicles are not in the delay figure,** so plain delay rewards a controller for turning traffic away. Tuning and comparison use `delay_with_denied`: each refused vehicle is charged `denial_penalty_s` (600 s, an assumption in `config/retune_phaseB.yaml`). Where nothing is refused the score equals plain delay.
- **Fuel proxy** (`compare.py --fuel`, `config/emissions.yaml`): idling plus a restart cost per stop. The two rates are provisional assumptions, so only ratios between controllers mean anything. At normal demand the proxy shows almost no difference between controllers (responsive control idles less but stops more: 1.6-1.7 stops per vehicle against 1.3 for the fixed plan); at overload it follows delay.
- **The grid gridlock is not just an artefact of unlimited entrance queues.** On the grid at x2.2 (seeds 1000-1009, fixed plan 25/25) the fixed plan still refuses about 3,700 vehicles/h with the limit on, and the tuned plan (Phase B, below) still refuses about 4,300/h with a delay of 947 s. Neighbour-aware refuses far fewer (467/h).

**Phase B: re-tune with wider grids and the limit on.** Tuned on seeds 1000-1003, judged on new seeds 1100-1129, three layouts (corridor; short links and grid, both with spillback and the entrance limit). Search grids widened to EW 10-180, NS 4-80 and `max_green_s` 10-300. Of all the best settings, one sits on an edge: neighbour-aware on the grid at x2.2 (`max_green_s` 10); its best single setting there is 20, which is interior. The tuned fixed plan moved as the grid widened (corridor x2.2: EW 140 / NS 40 instead of the old edge value 110).

Delay in seconds, mean over 30 seeds; "vs tuned fixed" is the paired score difference (negative is better than a fixed plan tuned for that demand):

| layout | demand | tuned fixed | neighbour-aware | vs tuned fixed | arrival-aware vs tuned fixed | actuated vs tuned fixed |
|---|---|---|---|---|---|---|
| corridor | x0.5 | 17.9 | 11.0 | -6.9 | -6.9 | -4.0 |
| corridor | x1.0 | 23.5 | 16.6 | -6.9 | -6.8 | -3.5 |
| corridor | x1.4 | 31.7 | 25.3 | -6.5 | -6.6 | -4.3 |
| corridor | x1.8 | 46.9 | 43.4 | -3.5 | -3.0 | -2.4 |
| corridor | x2.2 | 113.5 | 112.7 | -0.7 (noise) | +13.5 | +2.5 (noise) |
| short links | x0.5 | 15.9 | 11.1 | -4.8 | -4.8 | -2.1 |
| short links | x1.0 | 20.3 | 17.2 | -3.2 | -3.1 | +0.2 (noise) |
| short links | x1.4 | 27.1 | 24.9 | -2.2 | -1.5 | +0.7 |
| short links | x1.8 | 42.3 | 46.2 | +4.2 | +22.3 | +23.0 |
| short links | x2.2 | 92.5 (142 refused/h) | 85.9 (392 refused/h) | +21.3 | +97.0 | +100.0 |
| grid | x0.5 | 21.6 | 14.4 | -7.2 | -7.7 | -4.7 |
| grid | x1.0 | 27.9 | 20.7 | -7.1 | -6.6 | -4.1 |
| grid | x1.4 | 34.4 | 30.4 | -4.0 | -1.1 | -1.1 |
| grid | x1.8 | 50.2 | 52.9 | +2.8 | +2.9 | +3.3 |
| grid | x2.2 | 946.7 (4,296 refused/h) | 129.3 (425 refused/h) | -450 | -287 | -335 |

(Neighbour-aware here uses one `max_green_s` for all demand levels: 150 corridor, 90 short links, 20 grid. The per-demand rows are in the data file and differ by 0-5 s. The rows for arrival-aware and actuated are their one-setting values. The short-link x2.2 score includes the 600 s charge per refused vehicle, so that row depends on the assumed penalty; the ranking was not re-run with other penalties. The data file's "fixed (x1.0 plan)" row on the grid is the corridor's 40/12 plan, which is the wrong plan for that layout and gridlocks; ignore it.)

What this changes:

1. **The ~7 s (30%) gain below saturation holds on all three layouts,** against a fixed plan tuned for each demand level.
2. **Correction: the corridor x2.2 win has gone.** The earlier re-tune (seeds 400-429) reported responsive control 16-18 s better at x2.2. With the fixed grid widened (EW up to 180) the tuned fixed plan reaches 113.5 s and the difference is -0.7 s, within noise. That earlier row was inflated by a search edge. The x1.8 corridor gain is 2-5 s.
3. **Near and above capacity on short links the tuned fixed plan still wins** (x1.8: +4 s for neighbour-aware, +22 s for arrival-aware, +23 s for actuated). Only neighbour-aware avoids the collapse.
4. **On the grid, neighbour-aware is the only responsive controller that holds up at overload;** at x1.8 all of them are 3 s behind the tuned fixed plan.
5. **A realistic fixed system is much easier to beat.** A fixed system runs one plan all day. With one plan chosen for the average of the five demand levels (corridor EW 110 / NS 30), delay is 32.7 s at x0.5 and 35.6 s at x1.0 (tuned: 17.9 and 23.5), so neighbour-aware is about 19-22 s better there (11.0 and 16.6 s), 14 s better at x1.4, 5 s at x1.8 and 22 s at x2.2. On short links (plan EW 60 / NS 20) the gap is 11 s at x0.5, 7 s at x1.0 and 3 s at x1.4, and it reverses at x1.8 (+3.9 s). On the grid (plan EW 40 / NS 40) it is 15 s at x0.5, 11 s at x1.0 and 6 s at x1.4. This is the gap a responsive system buys over a timer that is not retuned through the day, which the tuned-per-demand comparison hides.
6. **The per-layout `max_green_s` (150 / 90 / 30) is confirmed,** so `config/controllers.yaml` is unchanged. The best single value on the grid was 20 in this run; 30 was better at x1.8 (48.3 vs 52.9 s) and 20 at x2.2 (129 vs 136 s), so 30 stays.

**Ablation (judged on seeds 1200-1229, neighbour-aware with each ingredient switched off in turn; number is the extra delay in seconds when it is removed, negative would mean it was hurting).**

| ingredient | corridor | short links | grid |
|---|---|---|---|
| look-ahead (3 s) | +2.7 / +2.9 / +1.5 / +0.5 / 0 at x0.5 / 1.0 / 1.4 / 1.8 / 2.2 | +2.6 / +2.6 / +2.3 / +3.1 / 0 | +2.6 / +2.0 / +1.3 / +0.5 / 0 |
| switch margin (4) | 0 / +1.9 / +3.1 / +1.3 / 0 | +0.2 / +1.5 / +2.8 / +1.5 / 0 | +0.3 / +2.6 / +2.5 / 0 / 0 |
| congestion limit (8) | 0 / 0 / +1.9 / +19.1 / +45.8 | 0 / 0 / +2.2 / +31.3 / +70.9 | 0 / 0 / +0.8 / +4.7 / noise |
| hold extension (60 s) | 0 / 0 / 0 / 0 / +13.2 | 0 / 0 / 0 / +2.0 / +23.3 | +0.1 / 0 / +0.9 / +7.7 / +107.6 |
| skip blocked queues | 0 everywhere | 0 / 0 / -0.2 / +2.0 / +25.3 | 0 everywhere (x2.2 noise) |

(Values are differences from the current settings; entries marked 0 are exact or inside noise. See the data file for intervals.) In short: **look-ahead and the switch margin are worth 2-3 s below saturation and nothing above it. The congestion limit is what stops the collapse at x1.8 and above. The hold extension and skip-blocked matter only under spillback near overload, and there they matter a lot.** This is the first time each ingredient has been priced under the fair method.

**Option tuning: nothing to adopt.** `scripts/tune_params.py` swept look-ahead, margin, congestion limit and hold extension one at a time on the tuning seeds (value with the lowest score summed over demand levels). On the corridor the tuned set equals the current one. On short links and the grid the tuned set was 1-5 s *worse* than the current settings on fresh seeds at x1.0-x1.8: summing over demand levels lets the x2.2 overload runs, which are huge and noisy on four seeds, decide. The one option that looked better in the sweep, a hold extension of 120 s, was tested alone on new seeds 1300-1329 (three layouts, x1.0, x1.8, x2.2): every difference was within noise, except 200 s on the grid at x2.2 (+11.8 +/- 10.9, worse). So the settings in `config/controllers.yaml` stand. Sweep scores were flat across look-ahead 3-8, margin 4-6, congestion limit 8-12 and hold extension 60-200, which fits the earlier finding that there is no sharp optimum.

Limits of this section: the demand is still synthetic and constant; the denial penalty is an assumption; the fuel rates are assumptions; four tuning seeds per setting is few for the overload cases; the junction design is unchanged.

## Phases C and D: changing demand, a platoon rule, and a max-green rule

Plan: `docs/IMPROVEMENT_PLAN.md`. Raw data: `docs/results/phaseC_profiles.{md,csv}`, `phaseD_platoon.{md,csv}`, `phaseD_max_green_rule.{md,csv}`.

### C: demand that changes during the hour

**What was added.** `DemandProfile` (`trafficsim/demand.py`, shapes in `config/demand_profiles.yaml`): multipliers on the arrival rates that change over the run, for all entry roads or per phase (EW or NS), so one profile works on every layout. Three profiles: a **peak** (0.6x, ramp to 1.8x for 15 minutes, back down), a **swing** (the busy direction trades places: EW 1.5x to 0.6x while NS 0.6x to 1.5x) and a **surge** (a ten-minute 2.4x burst on normal demand). The random stream does not depend on the controller, so paired comparisons still hold. All demand shapes are provisional, not measured.

**The baselines are strong on purpose.** `scripts/profile_study.py` compares the responsive controllers with:

- `fixed (config plan)`: the plan shipped for the layout;
- `fixed (one plan)`: one plan tuned for the whole profile. It knows the average demand but not when it changes;
- `fixed (time of day)`: an *ideal timetable* (`TimeOfDayController`). The run is cut into segments, and each segment gets the plan tuned for that segment's mean demand. This is the best a timer can do without sensing traffic, and it is told exactly when demand changes.

Plans were tuned on seeds 1800-1803 (EW 20-140 s, NS 8-60 s); everything was judged on new seeds 1900-1929. Short links and the grid have spillback and the entrance limit on; scores charge 600 s per refused vehicle.

Mean score in seconds (lower is better). The last column is neighbour-aware against the ideal time-of-day timer, paired, with a 95% interval:

| layout | profile | fixed, one plan | fixed, time of day | actuated | arrival-aware | neighbour-aware | neighbour-aware vs time of day |
|---|---|---|---|---|---|---|---|
| corridor | peak | 34.4 | 34.9 | 30.4 | 28.9 | 28.6 | -6.3 +/- 0.5 |
| corridor | swing | 28.3 | 25.6 | 20.1 | 16.9 | 16.8 | -8.7 +/- 0.4 |
| corridor | surge | 55.9 | 53.9 | 46.2 | 43.9 | 42.8 | -11.1 +/- 1.4 |
| short links | peak | 31.2 | 29.9 | 35.5 | 34.4 | 29.4 | -0.6 +/- 0.8 (noise) |
| short links | swing | 24.3 | 21.2 | 20.4 | 17.3 | 17.1 | -4.1 +/- 0.3 |
| short links | surge | 55.0 | 53.2 | 74.3 | 72.2 | 54.4 | +1.2 +/- 2.3 (noise) |
| grid | peak | 41.4 | 40.8 | 38.9 | 38.0 | 33.9 | -6.9 +/- 0.4 |
| grid | swing | 30.8 | 27.7 | 24.1 | 21.9 | 20.7 | -6.9 +/- 0.2 |
| grid | surge | 117.4 | 102.5 | 76.1 | 77.3 | 53.5 | -49.1 +/- 42.0 |

What it shows:

1. **The responsive gain survives changing demand, even against the ideal timetable.** Neighbour-aware is 6-11 s better than the time-of-day timer on the corridor and 7 s better on the grid in the peak and swing profiles. It is level with it on short links during the peak and surge, and 4 s better when the busy direction swings.
2. **The ideal timetable is worth only 0-3 s over a single well-tuned plan** (corridor peak -0.4 s, noise; swing -2.7; surge -2.0; the grid surge, -14.9 s, is within noise). So a retuning schedule recovers little of what responsive control gains. The shipped plan, set for normal demand and left alone, loses 6-16 s on the corridor and short links in the peak and surge.
3. **The swing is where sensing pays most** (neighbour-aware 11, 7 and 10 s better than one plan). Fixed plans cannot follow a change in direction without a timetable, and even a perfect timetable lags the change.
4. **On short links, queue-actuated and arrival-aware control fail under pressure again:** +4 to +5 s against the timetable in the peak, +19 to +21 s in the surge. Only neighbour-aware avoids that, so the neighbour rules are needed for every layout with short links.
5. **The grid surge is the largest gap (-49 s) but also the noisiest** (interval +/- 42 s): some seeds gridlock the fixed plans. The video on the website is this layout in overload.

### D1: an upstream-platoon rule: no gain

**Idea.** The 3 s look-ahead lets a green gap out when a platoon is 4 to 10 s away, so the platoon arrives at red. `PlatoonAwareController` (`trafficsim/controllers/platoon_aware.py`) keeps a green that would *gap out* while at least `platoon_min` vehicles will reach the stop line within `platoon_window_s`. It touches only the gap-out decision, since a longer look-ahead made the controller worse in the ablation.

**Tested** by `scripts/tune_params.py` on seeds 1500-1503 (tuning) and 1700-1729 (judging), three layouts, five demand levels, with equal weight per demand level in the tuner. "Without platoon_min" is exactly neighbour-aware:

- Short links and the grid: switching the rule off changes the score by 0.5 s or less at every demand level, except x2.2, which is noise (the intervals are wider than the gap).
- **Corridor: the shipped setting (4 vehicles / 8 s) is 5.1 +/- 0.5 s worse at x1.8 and 6.2 +/- 1.7 s worse at x2.2** than neighbour-aware, because holding the main road's green starves the side streets. The tuner's best values sit at the edge where almost nothing qualifies as a platoon (8 vehicles / 5 s).
- Under the demand profiles it is the same as neighbour-aware within 1-3 s, and worse on the corridor peak (31.2 vs 28.6 s).

**Conclusion.** Advance information on a platoon beyond the 3 s window is not worth acting on in this model. This is the third time the same answer has come back (longer look-ahead, the link-fullness cue, now a platoon hold), and the original question, whether a neighbouring junction's flow should change the next junction's timing, is answered "not by anything tried here". The controller stays in the code and tests as a documented negative result; `config/controllers.yaml` ships it with the starting values, but it is **not recommended**: use neighbour-aware.

### D2: a max-green rule from layout shape

**Idea.** Replace the per-layout hand sweep with a rule (`max_green_from_rule`, `max_green_rule` in `config/controllers.yaml`): in a line of junctions use 150 s; in a loop (a grid) use 0.75 x the time to fill the smallest internal link at saturation flow (min 10 s). It reproduces the grid (30 s) and the corridor (150 s). Layouts named in `switching_by_network` keep their own value; the rule applies only to unnamed ones.

**Held-out test** (`scripts/check_max_green_rule.py`, seeds 2000-2011; two layouts the rule never saw: `config/corridor_200m.yaml` and `config/grid_2x2_long.yaml` with 300 m links). "Rule - best" is the paired difference against the best of eight values on the same seeds, so the sweep is flattered:

| layout | rule | x1.0 | x1.8 | x2.2 |
|---|---|---|---|---|
| corridor, 200 m links (held out) | 150 | +0.1 (noise) | +1.6 +/- 1.4 | +3.7 (noise) |
| grid, 300 m links (held out) | 60 | +0.1 (noise) | +4.8 +/- 0.6 | +0.9 (noise) |
| corridor (fitted) | 150 | 0.0 (noise) | +2.2 +/- 0.9 | +2.5 (noise) |
| short links (fitted, shipped value is 90) | 150 | 0.0 (noise) | +3.9 +/- 3.8 | +26.4 +/- 7.5 |
| grid (fitted) | 30 | +0.1 (noise) | 0 (rule is best) | +17.4 (noise) |

**Result.** On the held-out layouts the rule is within noise at x1.0 and x2.2 and loses at most 4.8 s (about 10%) at x1.8, so it is a usable fallback for a new layout. **But its reasoning is not confirmed:** both grids do best at 30 s whatever the link length (the 300 m grid's best is 30, not the 60 the rule predicts), so the link-length scaling is wrong, and "30 s for any loop" would fit both grids better. I did not adopt that, because it would be fitted on the layouts used as the test; a third loop layout is needed. On short links the rule's 150 s is 26 s worse at x2.2 than the best, which is why that layout keeps its own 90 s.

### Not done in this round

- **Green wave on the grid.** No route-aware offsets were built.
- **Phase 7 on a real video.** There is no video or YOLO weights here, and `ultralytics` is not installed, so `count_video.py` is still unproven. Candidate models and datasets are in `docs/VISION_MODELS.md`. The counter already counts every line in one pass.
- **Measured demand.** All demand is still synthetic.
- **One junction design** (two phases, no turn phases) and an assumed 600 s penalty for refused vehicles.

## Limits of these results

- **Synthetic demand.** Arrivals are random with constant rates. Real traffic has rush hours, platoons formed by upstream lights, and turning patterns that vary by time.
- **Spillback is off in the headline numbers.** Queues there have no length limit and never block the road behind them. The optional spillback model (see above) shows it hardly matters on this corridor but changes the ranking on short links; those runs are exploratory (tuning seeds, one stressed layout) and the entrance roads are unlimited unless the entrance limit is switched on (see "Phase A and B").
- **Optimistic sensing.** `arrival_aware` sees every vehicle on its incoming roads, including the entrance roads, and every queue length exactly. Real detectors cover less, and tracking from video has its own errors.
- **A simple junction.** Two phases, one lane, no left-turn phases, no pedestrians, no yellow-time driving, a fixed start-up loss.
- **One network.** The corridor was the only layout tried. A grid would add cross-flows and could change the ranking.
- **The settings are tuned to this network and demand pattern.** The held-out seeds guard against over-fitting to particular random draws, not against over-fitting to this layout. The congestion limit of 8 vehicles per junction is specific to this junction size and demand mix.
- **The statistics assume independent seeds.** Confidence intervals use a t-distribution on 30 paired differences. They describe simulator noise, not uncertainty about real roads.

## Next steps, in order of value

1. **Done: the fair re-tune, the 2x2 grid test, the final model, the entrance limit and the wider re-tune** (see above). Open: a rule for `max_green_s` that works across layouts without a per-layout sweep (two simple ones failed; Phase D in `docs/IMPROVEMENT_PLAN.md`).
2. **Done as far as tried: a platoon rule gave nothing** (see "Phases C and D"). Still untried: a corridor with two-way offsets, and a green wave on the grid.
   *Original wording:* **Try a real coordination test:** (the 2x2 grid is done: neighbour-aware helped there below saturation, but it still only reads link fullness) a corridor with two-way offsets, or a controller that uses the *neighbour's* signal state and queue, not only vehicles on the approach road. This is the part of the original idea the results do not yet support.
3. **Replace synthetic demand with counts from video** (the original detection scripts, once their tracker bug is fixed) to test against measured arrival patterns.
4. **Done: the ablation was rerun** with the fair settings (see "Phase A and B"). Look-ahead and margin are worth 2-3 s below saturation; the congestion limit and hold extension matter near overload.
5. **Look at the worst-stream result at x2.2**, where both responsive controllers serve the total better but the worst-off stream worse.
