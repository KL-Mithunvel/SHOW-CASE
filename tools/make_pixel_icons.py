"""Generate the 16x16 pixel-art icons used by the landing page (index.html).

Run from the repo root:  python tools/make_pixel_icons.py
Writes one SVG per icon into assets/img/pixel/. Each SVG is self-contained
(dark plate + bright pixels) so it looks the same in the light and dark themes.

To change an icon, edit its entry in ICONS below and re-run. Rows are drawn
with the letters in PALETTE; "." is empty (the plate shows through).
"""

from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "assets" / "img" / "pixel"

GRID = 16            # art pixels per side
RENDER_PX = 4        # rendered size of one art pixel in the SVG width/height
PLATE_COLOUR = "#172033"

PALETTE = {
    "c": "#35d0c0",  # cyan (site accent)
    "a": "#ffb703",  # amber
    "w": "#f1f5f9",  # white
    "g": "#52d273",  # green
    "r": "#ff5d5d",  # red
    "y": "#ffe066",  # yellow
    "b": "#7f8fb0",  # blue-grey
}


# ---------------------------------------------------------------- drawing helpers
def blank():
    return [["."] * GRID for _ in range(GRID)]


def put(grid, x, y, ch):
    if 0 <= x < GRID and 0 <= y < GRID:
        grid[y][x] = ch


def rect(grid, x, y, w, h, ch):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(grid, xx, yy, ch)


def line(grid, x0, y0, x1, y1, ch, thick=1):
    """Bresenham line; thick=2 stamps a 2x2 block per step."""
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        rect(grid, x0, y0, thick, thick, ch)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def to_rows(grid):
    return ["".join(row) for row in grid]


# ---------------------------------------------------------------- icons
def icon_arm():
    g = blank()
    rect(g, 2, 13, 8, 2, "b")            # base
    line(g, 5, 12, 10, 6, "c", thick=2)  # link 1
    line(g, 10, 6, 13, 10, "a", thick=2) # link 2
    rect(g, 4, 11, 3, 3, "w")            # shoulder joint
    rect(g, 9, 5, 3, 3, "w")            # elbow joint
    rect(g, 12, 10, 3, 3, "y")          # end effector
    return to_rows(g)


def icon_ros():
    g = blank()
    centres = {"tl": (3, 3), "tr": (12, 3), "mid": (8, 8), "bl": (3, 12), "br": (12, 12)}
    for a, b in (("tl", "mid"), ("tr", "mid"), ("bl", "mid"), ("br", "mid"), ("tl", "tr")):
        line(g, *centres[a], *centres[b], "b")
    for name, (cx, cy) in centres.items():
        rect(g, cx - 1, cy - 1, 3, 3, "a" if name == "mid" else "c")
    return to_rows(g)


def icon_logo():
    g = blank()
    for p in (5, 7, 9):                  # chip pins
        rect(g, p, 2, 1, 2, "b")
        rect(g, p, 12, 1, 2, "b")
        rect(g, 2, p, 2, 1, "b")
        rect(g, 12, p, 2, 1, "b")
    rect(g, 4, 4, 8, 8, "c")             # chip body
    rect(g, 6, 6, 4, 4, "w")             # die
    return to_rows(g)


ICONS = {
    # Tile inspection line: tiles on a belt, one with a defect, amber scan line.
    "tile": [
        "................",
        ".cccccc.cccccc..",
        ".cccccc.cccccc..",
        ".cccccc.cccrcc..",
        ".cccccc.cccccc..",
        ".cccccc.cccccc..",
        ".cccccc.cccccc..",
        "................",
        ".cccccc.cccccc..",
        ".cccccc.cccccc..",
        ".cccccc.cccccc..",
        ".cccccc.cccccc..",
        ".cccccc.cccccc..",
        ".cccccc.cccccc..",
        "................",
        "aaaaaaaaaaaaaaaa",
    ],
    # HERC-26: rover with a camera mast and three wheels.
    "rover": [
        "................",
        "......wwww......",
        "......wccw......",
        ".......ww.......",
        ".......ww.......",
        "..gggggggggggg..",
        "..gggggggggggg..",
        "..ggwwggggwwgg..",
        "..gggggggggggg..",
        "..gggggggggggg..",
        ".bbbb.bbbb.bbbb.",
        "bbwwbbbwwbbbwwbb",
        "bbwwbbbwwbbbwwbb",
        ".bbbb.bbbb.bbbb.",
        "................",
        "................",
    ],
    # Look-Ahead Signals: traffic light.
    "traffic": [
        "................",
        ".....bbbbbb.....",
        ".....bbbbbb.....",
        "....bbrrrrbb....",
        "....bbrrrrbb....",
        "....bbbbbbbb....",
        "....bbyyyybb....",
        "....bbyyyybb....",
        "....bbbbbbbb....",
        "....bbggggbb....",
        "....bbggggbb....",
        "....bbbbbbbb....",
        ".......bb.......",
        ".......bb.......",
        "......bbbb......",
        "................",
    ],
    # MyOwnEnigma: three rotors above a lamp board (one lamp lit).
    "enigma": [
        "................",
        ".aaaa.aaaa.aaaa.",
        ".awwa.awwa.awwa.",
        ".awwa.awwa.awwa.",
        ".aaaa.aaaa.aaaa.",
        "................",
        "................",
        ".cc.cc.yy.cc.cc.",
        ".cc.cc.yy.cc.cc.",
        "................",
        "..cc.cc.cc.cc...",
        "..cc.cc.cc.cc...",
        "................",
        "...cc.cc.cc.....",
        "...cc.cc.cc.....",
        "................",
    ],
    "arm": icon_arm(),
    "ros": icon_ros(),
    "logo": icon_logo(),
}


# ---------------------------------------------------------------- SVG output
def validate(name, rows):
    if len(rows) != GRID:
        raise ValueError(f"{name}: {len(rows)} rows, expected {GRID}")
    for i, row in enumerate(rows):
        if len(row) != GRID:
            raise ValueError(f"{name}: row {i} has {len(row)} chars, expected {GRID}")
        for ch in row:
            if ch != "." and ch not in PALETTE:
                raise ValueError(f"{name}: row {i} uses unknown colour letter {ch!r}")


def to_svg(rows):
    size = GRID * RENDER_PX
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {GRID} {GRID}" '
        f'width="{size}" height="{size}" shape-rendering="crispEdges">',
        f'<rect width="{GRID}" height="{GRID}" fill="{PLATE_COLOUR}"/>',
    ]
    for y, row in enumerate(rows):
        x = 0
        while x < GRID:                  # merge horizontal runs of one colour
            ch = row[x]
            if ch == ".":
                x += 1
                continue
            start = x
            while x < GRID and row[x] == ch:
                x += 1
            parts.append(f'<rect x="{start}" y="{y}" width="{x - start}" height="1" fill="{PALETTE[ch]}"/>')
    parts.append("</svg>")
    return "\n".join(parts) + "\n"


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, rows in ICONS.items():
        validate(name, rows)
        (OUT_DIR / f"{name}.svg").write_text(to_svg(rows), encoding="utf-8")
        print(f"wrote {OUT_DIR / (name + '.svg')}")


if __name__ == "__main__":
    main()
