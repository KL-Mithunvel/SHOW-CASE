Fair re-tune. Tuned on seeds 0-3, judged on seeds 800-829.
Delay is mean seconds queueing per vehicle (+/- sd across seeds); worst stream is the worst entrance road's mean delay.
'vs tuned fixed' is the paired difference with a 95% interval; negative is better than the tuned fixed plan.

## corridor

### demand x0.5

| controller | setting | delay (s) | worst stream (s) | vs tuned fixed |
|---|---|---|---|---|
| fixed (tuned) | EW 30 / NS 8 | 17.8 +/- 0.5 | 27.1 | - |
| fixed (x1.0 plan) | EW 40 / NS 12 | 20.2 +/- 0.5 | 27.1 | +2.4 +/- 0.2 |
| actuated (per demand) | max green 150 | 13.8 +/- 0.5 | 15.4 | -4.0 +/- 0.2 |
| arrival_aware (per demand) | max green 150 | 11.0 +/- 0.4 | 13.6 | -6.7 +/- 0.2 |
| neighbour_aware (per demand) | max green 110 | 11.0 +/- 0.4 | 13.5 | -6.8 +/- 0.2 |
| actuated (one setting) | max green 150 | 13.8 +/- 0.5 | 15.4 | -4.0 +/- 0.2 |
| arrival_aware (one setting) | max green 150 | 11.0 +/- 0.4 | 13.6 | -6.7 +/- 0.2 |
| neighbour_aware (one setting) | max green 150 | 11.0 +/- 0.4 | 13.6 | -6.7 +/- 0.2 |

### demand x1.0

| controller | setting | delay (s) | worst stream (s) | vs tuned fixed |
|---|---|---|---|---|
| fixed (tuned) | EW 40 / NS 12 | 23.9 +/- 0.7 | 31.4 | - |
| fixed (x1.0 plan) | EW 40 / NS 12 | 23.9 +/- 0.7 | 31.4 | +0.0 +/- 0.0 (noise) |
| actuated (per demand) | max green 90 | 20.2 +/- 0.7 | 22.0 | -3.7 +/- 0.3 |
| arrival_aware (per demand) | max green 150 | 16.9 +/- 0.6 | 22.7 | -7.0 +/- 0.3 |
| neighbour_aware (per demand) | max green 150 | 16.9 +/- 0.7 | 23.4 | -7.0 +/- 0.3 |
| actuated (one setting) | max green 150 | 20.2 +/- 0.7 | 22.1 | -3.7 +/- 0.3 |
| arrival_aware (one setting) | max green 150 | 16.9 +/- 0.6 | 22.7 | -7.0 +/- 0.3 |
| neighbour_aware (one setting) | max green 150 | 16.9 +/- 0.7 | 23.4 | -7.0 +/- 0.3 |

### demand x1.4

| controller | setting | delay (s) | worst stream (s) | vs tuned fixed |
|---|---|---|---|---|
| fixed (tuned) | EW 60 / NS 20 | 31.5 +/- 0.8 | 42.2 | - |
| fixed (x1.0 plan) | EW 40 / NS 12 | 30.7 +/- 1.2 | 43.2 | -0.8 +/- 0.3 |
| actuated (per demand) | max green 150 | 26.6 +/- 1.0 | 31.3 | -4.9 +/- 0.3 |
| arrival_aware (per demand) | max green 70 | 24.4 +/- 1.1 | 30.2 | -7.0 +/- 0.3 |
| neighbour_aware (per demand) | max green 50 | 24.4 +/- 0.9 | 33.9 | -7.1 +/- 0.3 |
| actuated (one setting) | max green 150 | 26.6 +/- 1.0 | 31.3 | -4.9 +/- 0.3 |
| arrival_aware (one setting) | max green 150 | 24.5 +/- 0.9 | 30.7 | -7.0 +/- 0.2 |
| neighbour_aware (one setting) | max green 150 | 24.5 +/- 1.1 | 35.4 | -6.9 +/- 0.3 |

### demand x1.8

| controller | setting | delay (s) | worst stream (s) | vs tuned fixed |
|---|---|---|---|---|
| fixed (tuned) | EW 110 / NS 30 | 49.3 +/- 2.2 | 89.5 | - |
| fixed (x1.0 plan) | EW 40 / NS 12 | 79.4 +/- 14.6 | 166.9 | +30.1 +/- 5.0 |
| actuated (per demand) | max green 150 | 44.1 +/- 2.6 | 58.5 | -5.2 +/- 0.7 |
| arrival_aware (per demand) | max green 90 | 43.8 +/- 2.9 | 49.6 | -5.4 +/- 1.0 |
| neighbour_aware (per demand) | max green 90 | 42.2 +/- 2.6 | 53.7 | -7.1 +/- 0.9 |
| actuated (one setting) | max green 150 | 44.1 +/- 2.6 | 58.5 | -5.2 +/- 0.7 |
| arrival_aware (one setting) | max green 150 | 43.8 +/- 2.5 | 57.3 | -5.5 +/- 0.8 |
| neighbour_aware (one setting) | max green 150 | 43.4 +/- 2.6 | 59.8 | -5.9 +/- 0.8 |

### demand x2.2

| controller | setting | delay (s) | worst stream (s) | vs tuned fixed |
|---|---|---|---|---|
| fixed (tuned) | EW 110 / NS 30 | 124.0 +/- 18.8 | 248.8 | - |
| fixed (x1.0 plan) | EW 40 / NS 12 | 379.3 +/- 24.9 | 511.6 | +255.3 +/- 5.1 |
| actuated (per demand) | max green 150 | 116.4 +/- 20.0 | 165.7 | -7.7 +/- 3.0 |
| arrival_aware (per demand) | max green 150 | 115.8 +/- 18.5 | 162.4 | -8.2 +/- 2.8 |
| neighbour_aware (per demand) | max green 150 | 102.5 +/- 16.4 | 130.5 | -21.6 +/- 3.1 |
| actuated (one setting) | max green 150 | 116.4 +/- 20.0 | 165.7 | -7.7 +/- 3.0 |
| arrival_aware (one setting) | max green 150 | 115.8 +/- 18.5 | 162.4 | -8.2 +/- 2.8 |
| neighbour_aware (one setting) | max green 150 | 102.5 +/- 16.4 | 130.5 | -21.6 +/- 3.1 |

## short_links (spillback on)

### demand x0.5

| controller | setting | delay (s) | worst stream (s) | vs tuned fixed |
|---|---|---|---|---|
| fixed (tuned) | EW 30 / NS 8 | 16.0 +/- 0.6 | 26.1 | - |
| fixed (x1.0 plan) | EW 40 / NS 12 | 17.5 +/- 0.6 | 30.2 | +1.6 +/- 0.3 |
| actuated (per demand) | max green 150 | 13.8 +/- 0.4 | 15.3 | -2.1 +/- 0.2 |
| arrival_aware (per demand) | max green 150 | 11.2 +/- 0.4 | 13.3 | -4.8 +/- 0.2 |
| neighbour_aware (per demand) | max green 150 | 11.2 +/- 0.4 | 13.3 | -4.8 +/- 0.2 |
| actuated (one setting) | max green 110 | 13.8 +/- 0.4 | 15.3 | -2.1 +/- 0.2 |
| arrival_aware (one setting) | max green 110 | 11.2 +/- 0.5 | 13.2 | -4.7 +/- 0.2 |
| neighbour_aware (one setting) | max green 90 | 11.2 +/- 0.4 | 13.3 | -4.8 +/- 0.2 |

### demand x1.0

| controller | setting | delay (s) | worst stream (s) | vs tuned fixed |
|---|---|---|---|---|
| fixed (tuned) | EW 30 / NS 12 | 20.3 +/- 0.5 | 26.9 | - |
| fixed (x1.0 plan) | EW 40 / NS 12 | 20.6 +/- 0.7 | 34.0 | +0.2 +/- 0.2 (noise) |
| actuated (per demand) | max green 90 | 20.8 +/- 0.6 | 22.5 | +0.4 +/- 0.2 |
| arrival_aware (per demand) | max green 50 | 17.7 +/- 0.5 | 22.4 | -2.6 +/- 0.2 |
| neighbour_aware (per demand) | max green 110 | 17.3 +/- 0.6 | 23.4 | -3.1 +/- 0.2 |
| actuated (one setting) | max green 110 | 20.7 +/- 0.6 | 22.5 | +0.4 +/- 0.2 |
| arrival_aware (one setting) | max green 110 | 17.5 +/- 0.7 | 23.0 | -2.9 +/- 0.2 |
| neighbour_aware (one setting) | max green 90 | 17.3 +/- 0.6 | 23.4 | -3.1 +/- 0.2 |

### demand x1.4

| controller | setting | delay (s) | worst stream (s) | vs tuned fixed |
|---|---|---|---|---|
| fixed (tuned) | EW 40 / NS 16 | 26.5 +/- 1.2 | 33.8 | - |
| fixed (x1.0 plan) | EW 40 / NS 12 | 26.7 +/- 1.1 | 44.0 | +0.3 +/- 0.4 (noise) |
| actuated (per demand) | max green 110 | 27.4 +/- 1.0 | 32.5 | +1.0 +/- 0.3 |
| arrival_aware (per demand) | max green 90 | 25.1 +/- 0.8 | 31.2 | -1.4 +/- 0.3 |
| neighbour_aware (per demand) | max green 50 | 24.3 +/- 0.9 | 33.9 | -2.2 +/- 0.3 |
| actuated (one setting) | max green 110 | 27.4 +/- 1.0 | 32.5 | +1.0 +/- 0.3 |
| arrival_aware (one setting) | max green 110 | 25.0 +/- 0.9 | 31.3 | -1.4 +/- 0.3 |
| neighbour_aware (one setting) | max green 90 | 24.5 +/- 0.8 | 35.2 | -2.0 +/- 0.3 |

### demand x1.8

| controller | setting | delay (s) | worst stream (s) | vs tuned fixed |
|---|---|---|---|---|
| fixed (tuned) | EW 60 / NS 20 | 42.8 +/- 5.3 | 60.1 | - |
| fixed (x1.0 plan) | EW 40 / NS 12 | 74.5 +/- 14.6 | 165.1 | +31.7 +/- 4.0 |
| actuated (per demand) | max green 110 | 78.3 +/- 34.3 | 108.6 | +35.5 +/- 12.9 |
| arrival_aware (per demand) | max green 110 | 69.6 +/- 22.5 | 94.7 | +26.9 +/- 7.5 |
| neighbour_aware (per demand) | max green 70 | 47.3 +/- 7.6 | 58.5 | +4.5 +/- 1.8 |
| actuated (one setting) | max green 110 | 78.3 +/- 34.3 | 108.6 | +35.5 +/- 12.9 |
| arrival_aware (one setting) | max green 110 | 69.6 +/- 22.5 | 94.7 | +26.9 +/- 7.5 |
| neighbour_aware (one setting) | max green 90 | 45.8 +/- 5.1 | 59.8 | +3.1 +/- 1.8 |

### demand x2.2

| controller | setting | delay (s) | worst stream (s) | vs tuned fixed |
|---|---|---|---|---|
| fixed (tuned) | EW 110 / NS 30 | 131.1 +/- 20.5 | 286.5 | - |
| fixed (x1.0 plan) | EW 40 / NS 12 | 376.2 +/- 25.0 | 514.4 | +245.1 +/- 5.2 |
| actuated (per demand) | max green 90 | 458.0 +/- 47.7 | 802.0 | +326.9 +/- 15.1 |
| arrival_aware (per demand) | max green 110 | 465.7 +/- 66.3 | 810.4 | +334.6 +/- 22.6 |
| neighbour_aware (per demand) | max green 90 | 237.6 +/- 38.1 | 398.2 | +106.5 +/- 11.7 |
| actuated (one setting) | max green 110 | 475.1 +/- 46.2 | 817.4 | +344.0 +/- 17.1 |
| arrival_aware (one setting) | max green 110 | 465.7 +/- 66.3 | 810.4 | +334.6 +/- 22.6 |
| neighbour_aware (one setting) | max green 90 | 237.6 +/- 38.1 | 398.2 | +106.5 +/- 11.7 |

## grid_2x2_spillback (spillback on)

### demand x0.5

| controller | setting | delay (s) | worst stream (s) | vs tuned fixed |
|---|---|---|---|---|
| fixed (tuned) | EW 20 / NS 20 | 21.6 +/- 0.5 | 23.4 | - |
| fixed (x1.0 plan) | EW 40 / NS 12 | 41.5 +/- 1.5 | 69.6 | +20.0 +/- 0.5 |
| actuated (per demand) | max green 70 | 17.0 +/- 0.4 | 18.5 | -4.6 +/- 0.2 |
| arrival_aware (per demand) | max green 90 | 13.9 +/- 0.4 | 15.2 | -7.6 +/- 0.1 |
| neighbour_aware (per demand) | max green 90 | 13.9 +/- 0.4 | 15.2 | -7.6 +/- 0.1 |
| actuated (one setting) | max green 30 | 17.0 +/- 0.4 | 18.5 | -4.5 +/- 0.2 |
| arrival_aware (one setting) | max green 30 | 14.2 +/- 0.3 | 15.5 | -7.4 +/- 0.1 |
| neighbour_aware (one setting) | max green 30 | 14.1 +/- 0.4 | 15.4 | -7.5 +/- 0.1 |

### demand x1.0

| controller | setting | delay (s) | worst stream (s) | vs tuned fixed |
|---|---|---|---|---|
| fixed (tuned) | EW 30 / NS 30 | 27.8 +/- 0.6 | 29.6 | - |
| fixed (x1.0 plan) | EW 40 / NS 12 | 437.0 +/- 265.8 | 798.1 | +409.2 +/- 99.2 |
| actuated (per demand) | max green 20 | 23.8 +/- 0.6 | 25.4 | -4.0 +/- 0.2 |
| arrival_aware (per demand) | max green 50 | 21.0 +/- 0.6 | 22.6 | -6.8 +/- 0.2 |
| neighbour_aware (per demand) | max green 50 | 20.3 +/- 0.5 | 21.9 | -7.5 +/- 0.2 |
| actuated (one setting) | max green 30 | 23.7 +/- 0.5 | 25.3 | -4.1 +/- 0.2 |
| arrival_aware (one setting) | max green 30 | 21.1 +/- 0.6 | 22.6 | -6.7 +/- 0.2 |
| neighbour_aware (one setting) | max green 30 | 20.4 +/- 0.6 | 22.1 | -7.4 +/- 0.2 |

### demand x1.4

| controller | setting | delay (s) | worst stream (s) | vs tuned fixed |
|---|---|---|---|---|
| fixed (tuned) | EW 30 / NS 30 | 34.3 +/- 1.0 | 37.6 | - |
| fixed (x1.0 plan) | EW 40 / NS 12 | 1267.2 +/- 299.2 | 1613.9 | +1232.9 +/- 111.7 |
| actuated (per demand) | max green 30 | 32.8 +/- 0.8 | 35.5 | -1.4 +/- 0.3 |
| arrival_aware (per demand) | max green 70 | 33.2 +/- 1.0 | 35.5 | -1.1 +/- 0.3 |
| neighbour_aware (per demand) | max green 30 | 30.0 +/- 1.0 | 32.5 | -4.2 +/- 0.3 |
| actuated (one setting) | max green 30 | 32.8 +/- 0.8 | 35.5 | -1.4 +/- 0.3 |
| arrival_aware (one setting) | max green 30 | 32.9 +/- 1.0 | 35.4 | -1.4 +/- 0.3 |
| neighbour_aware (one setting) | max green 30 | 30.0 +/- 1.0 | 32.5 | -4.2 +/- 0.3 |

### demand x1.8

| controller | setting | delay (s) | worst stream (s) | vs tuned fixed |
|---|---|---|---|---|
| fixed (tuned) | EW 40 / NS 40 | 49.2 +/- 2.0 | 56.4 | - |
| fixed (x1.0 plan) | EW 40 / NS 12 | 1613.2 +/- 154.5 | 1806.2 | +1564.1 +/- 57.8 |
| actuated (per demand) | max green 50 | 52.6 +/- 2.2 | 58.2 | +3.5 +/- 0.5 |
| arrival_aware (per demand) | max green 50 | 52.8 +/- 1.8 | 58.0 | +3.6 +/- 0.5 |
| neighbour_aware (per demand) | max green 30 | 47.6 +/- 2.2 | 54.5 | -1.6 +/- 0.4 |
| actuated (one setting) | max green 30 | 55.2 +/- 3.8 | 67.0 | +6.0 +/- 0.9 |
| arrival_aware (one setting) | max green 30 | 55.7 +/- 3.7 | 67.6 | +6.5 +/- 0.8 |
| neighbour_aware (one setting) | max green 30 | 47.6 +/- 2.2 | 54.5 | -1.6 +/- 0.4 |

### demand x2.2

| controller | setting | delay (s) | worst stream (s) | vs tuned fixed |
|---|---|---|---|---|
| fixed (tuned) | EW 20 / NS 20 | 1025.9 +/- 346.5 | 1140.7 | - |
| fixed (x1.0 plan) | EW 40 / NS 12 | 1731.5 +/- 52.6 | 1825.2 | +705.5 +/- 124.6 |
| actuated (per demand) | max green 30 | 661.7 +/- 400.4 | 830.4 | -364.3 +/- 180.6 |
| arrival_aware (per demand) | max green 30 | 522.6 +/- 354.9 | 664.6 | -503.4 +/- 147.9 |
| neighbour_aware (per demand) | max green 30 | 254.5 +/- 164.5 | 391.7 | -771.4 +/- 134.6 |
| actuated (one setting) | max green 30 | 661.7 +/- 400.4 | 830.4 | -364.3 +/- 180.6 |
| arrival_aware (one setting) | max green 30 | 522.6 +/- 354.9 | 664.6 | -503.4 +/- 147.9 |
| neighbour_aware (one setting) | max green 30 | 254.5 +/- 164.5 | 391.7 | -771.4 +/- 134.6 |

