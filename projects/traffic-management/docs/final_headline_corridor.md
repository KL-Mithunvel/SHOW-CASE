network corridor; seeds 900-929; 3600 s measured after 600 s warm-up; spillback off

demand x0.5

| controller | delay (s) | vs fixed (s) | stops/veh | mean queue | worst stream (s) | veh/h out |
|---|---|---|---|---|---|---|
| fixed | 20.5 +/- 0.4 | - | 1.12 | 6.1 | 27.0 | 1053 |
| actuated | 13.7 +/- 0.5 | -6.8 +/- 0.2 | 1.29 | 4.1 | 15.1 | 1053 |
| green_wave | 21.0 +/- 0.6 | +0.5 +/- 0.2 | 1.23 | 6.2 | 30.5 | 1053 |
| arrival_aware | 11.1 +/- 0.5 | -9.3 +/- 0.2 | 1.14 | 3.3 | 13.6 | 1053 |
| neighbour_aware | 11.1 +/- 0.5 | -9.4 +/- 0.2 | 1.14 | 3.3 | 13.6 | 1053 |

demand x1.0

| controller | delay (s) | vs fixed (s) | stops/veh | mean queue | worst stream (s) | veh/h out |
|---|---|---|---|---|---|---|
| fixed | 23.6 +/- 0.5 | - | 1.29 | 14.0 | 30.9 | 2101 |
| actuated | 19.8 +/- 0.5 | -3.8 +/- 0.3 | 1.55 | 11.7 | 21.5 | 2101 |
| green_wave | 23.8 +/- 0.5 | +0.2 +/- 0.2 (noise) | 1.43 | 14.1 | 32.9 | 2101 |
| arrival_aware | 16.8 +/- 0.6 | -6.8 +/- 0.3 | 1.37 | 9.9 | 22.8 | 2102 |
| neighbour_aware | 16.6 +/- 0.6 | -7.0 +/- 0.3 | 1.35 | 9.8 | 23.0 | 2102 |

demand x1.4

| controller | delay (s) | vs fixed (s) | stops/veh | mean queue | worst stream (s) | veh/h out |
|---|---|---|---|---|---|---|
| fixed | 31.6 +/- 1.7 | - | 1.46 | 26.4 | 48.2 | 2965 |
| actuated | 27.3 +/- 0.9 | -4.2 +/- 0.6 | 1.62 | 22.8 | 32.3 | 2968 |
| green_wave | 30.5 +/- 1.8 | -1.0 +/- 0.2 | 1.59 | 25.5 | 49.2 | 2966 |
| arrival_aware | 25.2 +/- 1.1 | -6.4 +/- 0.5 | 1.58 | 21.1 | 31.9 | 2967 |
| neighbour_aware | 25.0 +/- 1.0 | -6.5 +/- 0.5 | 1.45 | 20.9 | 36.1 | 2967 |

demand x1.8

| controller | delay (s) | vs fixed (s) | stops/veh | mean queue | worst stream (s) | veh/h out |
|---|---|---|---|---|---|---|
| fixed | 79.1 +/- 13.2 | - | 1.68 | 84.2 | 167.6 | 3740 |
| actuated | 43.9 +/- 2.6 | -35.2 +/- 4.2 | 1.62 | 46.8 | 57.9 | 3771 |
| green_wave | 76.1 +/- 13.0 | -3.0 +/- 0.4 | 1.75 | 81.0 | 167.3 | 3741 |
| arrival_aware | 43.4 +/- 2.5 | -35.7 +/- 4.3 | 1.66 | 46.2 | 56.8 | 3770 |
| neighbour_aware | 42.9 +/- 2.4 | -36.2 +/- 4.3 | 1.56 | 45.7 | 59.0 | 3771 |

demand x2.2

| controller | delay (s) | vs fixed (s) | stops/veh | mean queue | worst stream (s) | veh/h out |
|---|---|---|---|---|---|---|
| fixed | 382.6 +/- 30.8 | - | 1.63 | 495.3 | 502.0 | 3940 |
| actuated | 122.7 +/- 18.3 | -259.9 +/- 7.0 | 1.73 | 159.8 | 178.1 | 4513 |
| green_wave | 380.3 +/- 31.2 | -2.3 +/- 0.8 | 1.66 | 492.2 | 501.5 | 3942 |
| arrival_aware | 121.9 +/- 17.4 | -260.6 +/- 6.7 | 1.74 | 158.8 | 175.4 | 4511 |
| neighbour_aware | 108.2 +/- 14.0 | -274.4 +/- 7.9 | 1.70 | 141.3 | 138.5 | 4552 |

per-seed results written to docs\results\final_headline_corridor.csv
