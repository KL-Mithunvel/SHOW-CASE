"""Draw the 32x32 pixel-art icons used by the portfolio pages and the design lab.

Run from the repo root:  python tools/make_pixel_icons.py

Outputs
  assets/img/pixel/<icon>.png                      the default ("classic") set used by the site
  design-lab/assets/icons/<style>/<icon>.png       every style, for the design lab
  design-lab/assets/sprites.css                    the classic set as pure-CSS box-shadow art

How an icon is drawn
  * Build a shape mask (rect, rounded rect, ellipse, polygon, line).
  * paint() fills it with a base colour, adds a 1px outline around the shape and a
    light top-left / dark bottom-right bevel inside it. Later shapes draw over earlier ones.
  * A STYLE changes the colours, the outline and the shading (see STYLES below), so the
    same drawing comes out as classic, pastel, Game Boy, blueprint and so on.
Each PNG is the 32x32 drawing enlarged SCALE times with hard edges, so the browser can
shrink it smoothly to any screen density without uneven pixels.

To change an icon, edit its function below and re-run the script.
"""

import colorsys
import struct
import zlib
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SITE_DIR = REPO / "assets" / "img" / "pixel"
LAB_ICONS_DIR = REPO / "design-lab" / "assets" / "icons"
LAB_SPRITES = REPO / "design-lab" / "assets" / "sprites.css"

GRID = 32            # art pixels per side
SCALE = 4            # each art pixel is written as SCALE x SCALE image pixels
DEFAULT_STYLE = "classic"

COLOURS = {
    "steel": "#8c9bb4",
    "steel_d": "#5d6c88",
    "dark": "#2d3648",
    "navy": "#1c2740",
    "white": "#f4f6fa",
    "teal": "#27b5a5",
    "amber": "#f3b134",
    "red": "#e4574d",
    "green": "#58b368",
    "blue": "#4a8be0",
    "blue_l": "#9ccbff",
    "brown": "#a8693b",
    "wood_l": "#c98a55",
    "peach": "#f1c7a1",
    "gold": "#d9a441",
    "glass": "#bfe3ff",
}


# ---------------------------------------------------------------- colour helpers
def to_rgb(hex_colour):
    h = hex_colour.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(rgb, target, amount):
    return tuple(round(c + (t - c) * amount) for c, t in zip(rgb, target))


def saturate(rgb, factor):
    h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in rgb))
    r, g, b = colorsys.hsv_to_rgb(h, min(1.0, s * factor), v)
    return (round(r * 255), round(g * 255), round(b * 255))


def luminance(rgb):
    return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255


def ramp_map(stops):
    """Return a function that recolours any pixel to one of a few ramp colours by brightness."""
    ramp = [to_rgb(s) for s in stops]

    def apply(rgb):
        return ramp[min(len(ramp) - 1, int(luminance(rgb) * len(ramp)))]
    return apply


def keep(rgb):
    return rgb


# ---------------------------------------------------------------- styles
def make_style(label, base_map=keep, final_map=keep, bevel=True, fill=True, outline=True,
               lighten=0.40, darken=0.28, outline_amt=0.62):
    return {"label": label, "base_map": base_map, "final_map": final_map, "bevel": bevel,
            "fill": fill, "outline": outline, "lighten": lighten, "darken": darken,
            "outline_amt": outline_amt}


STYLES = {
    "classic": make_style("Classic"),
    "soft": make_style("Soft pastel", base_map=lambda c: mix(c, (255, 255, 255), 0.38),
                       outline_amt=0.40, lighten=0.50),
    "flat": make_style("Flat", bevel=False, outline=False),
    "line": make_style("Line art", fill=False, bevel=False, outline_amt=0.0, lighten=0.15),
    "neon": make_style("Neon", base_map=lambda c: mix(saturate(c, 1.5), (255, 255, 255), 0.10),
                       outline_amt=0.78),
    "candy": make_style("Candy", base_map=lambda c: saturate(mix(c, (255, 255, 255), 0.22), 1.35),
                        outline_amt=0.45),
    "earth": make_style("Earth", base_map=lambda c: mix(saturate(c, 0.55), (0, 0, 0), 0.12)),
    "gameboy": make_style("Game Boy", final_map=ramp_map(["#0f380f", "#306230", "#8bac0f", "#9bbc0f"])),
    "mono": make_style("Mono ink", final_map=ramp_map(["#111111", "#9a9a9a", "#ffffff"])),
    "synthwave": make_style("Synthwave", final_map=ramp_map(
        ["#1b1035", "#4a1f7a", "#a1319b", "#ff5ec4", "#7df9ff", "#ffffff"])),
    "sepia": make_style("Sepia", final_map=ramp_map(
        ["#2b1a0e", "#6b4423", "#a9784a", "#d9b382", "#f5e6c8"])),
    "blueprint": make_style("Blueprint", final_map=ramp_map(
        ["#071a3d", "#123a80", "#2f6bd0", "#8fb8f2", "#eaf3ff"])),
}


# ---------------------------------------------------------------- shape masks
def centres():
    for y in range(GRID):
        for x in range(GRID):
            yield x, y, x + 0.5, y + 0.5


def rect(x, y, w, h):
    return {(px, py) for py in range(y, y + h) for px in range(x, x + w)}


def rrect(x, y, w, h, r):
    mask = set()
    for py in range(y, y + h):
        for px in range(x, x + w):
            cx = min(max(px + 0.5, x + r), x + w - r)
            cy = min(max(py + 0.5, y + r), y + h - r)
            if (px + 0.5 - cx) ** 2 + (py + 0.5 - cy) ** 2 <= r * r + 0.01:
                mask.add((px, py))
    return mask


def ellipse(cx, cy, rx, ry):
    return {(x, y) for x, y, fx, fy in centres()
            if ((fx - cx) / rx) ** 2 + ((fy - cy) / ry) ** 2 <= 1}


def poly(points):
    mask = set()
    for x, y, fx, fy in centres():
        inside = False
        j = len(points) - 1
        for i in range(len(points)):
            xi, yi = points[i]
            xj, yj = points[j]
            if (yi > fy) != (yj > fy) and fx < (xj - xi) * (fy - yi) / (yj - yi) + xi:
                inside = not inside
            j = i
        if inside:
            mask.add((x, y))
    return mask


def line(p0, p1, thick):
    (x0, y0), (x1, y1) = p0, p1
    dx, dy = x1 - x0, y1 - y0
    length2 = dx * dx + dy * dy or 1
    mask = set()
    for x, y, fx, fy in centres():
        t = max(0, min(1, ((fx - x0) * dx + (fy - y0) * dy) / length2))
        qx, qy = x0 + t * dx, y0 + t * dy
        if (fx - qx) ** 2 + (fy - qy) ** 2 <= (thick / 2) ** 2:
            mask.add((x, y))
    return mask


# ---------------------------------------------------------------- canvas
class Canvas:
    def __init__(self, style):
        self.style = style
        self.px = {}

    def paint(self, mask, colour, bevel=True, outline=True):
        """Fill a mask: 1px outline around it, bevel highlight/shade inside it."""
        st = self.style
        base = st["base_map"](to_rgb(COLOURS.get(colour, colour)))
        inner = {(x, y) for (x, y) in mask
                 if all(n in mask for n in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))}
        for (x, y) in mask:
            if (x, y) not in inner:                                   # the shape's edge
                if not st["fill"]:
                    self.px[(x, y)] = mix(base, (255, 255, 255), st["lighten"])
                elif outline and st["outline"]:
                    self.px[(x, y)] = mix(base, (0, 0, 0), st["outline_amt"])
                else:
                    self.px[(x, y)] = base
                continue
            if not st["fill"]:
                continue                                              # line art: leave it empty
            here = base
            if bevel and st["bevel"]:
                top_left = (x - 1, y) not in inner or (x, y - 1) not in inner
                bottom_right = (x + 1, y) not in inner or (x, y + 1) not in inner
                if top_left and not bottom_right:
                    here = mix(base, (255, 255, 255), st["lighten"])
                elif bottom_right and not top_left:
                    here = mix(base, (0, 0, 0), st["darken"])
            self.px[(x, y)] = here

    def dot(self, x, y, colour):
        self.px[(x, y)] = self.style["base_map"](to_rgb(COLOURS.get(colour, colour)))

    def final_pixels(self):
        return {pos: self.style["final_map"](rgb) for pos, rgb in self.px.items()}

    def to_png(self):
        pixels = self.final_pixels()
        size = GRID * SCALE
        raw = bytearray()
        for y in range(size):
            raw.append(0)                       # PNG filter type: none
            for x in range(size):
                rgb = pixels.get((x // SCALE, y // SCALE))
                raw.extend(rgb + (255,) if rgb else (0, 0, 0, 0))

        def chunk(tag, data):
            body = tag + data
            return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

        header = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
        return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header)
                + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b""))

    def to_box_shadow(self):
        """The drawing as a CSS box-shadow list: one 1px square per art pixel."""
        parts = []
        for (x, y), rgb in sorted(self.final_pixels().items(), key=lambda kv: (kv[0][1], kv[0][0])):
            parts.append(f"{x}px {y}px #{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}")
        return ",".join(parts)


# ---------------------------------------------------------------- icons
def tile(style):
    c = Canvas(style)
    c.paint(rrect(1, 23, 30, 7, 3), "steel_d")                 # conveyor belt
    c.paint(rrect(3, 25, 26, 2, 1), "dark", bevel=False, outline=False)
    c.paint(rect(2, 15, 10, 8), "teal")                         # good tile
    c.paint(rect(13, 15, 10, 8), "amber")                       # tile being checked
    c.paint(line((15, 17), (20, 21), 1.4), "red", bevel=False, outline=False)   # crack
    c.paint(line((26, 12), (30, 17), 3), "brown", bevel=False)  # magnifier handle
    c.paint(ellipse(22, 8, 6, 6), "steel_d")                    # lens ring
    c.paint(ellipse(22, 8, 4, 4), "glass", bevel=False, outline=False)
    c.dot(20, 6, "white")
    c.dot(21, 5, "white")
    return c


def rover(style):
    c = Canvas(style)
    c.paint(line((22, 12), (22, 5), 2), "steel", bevel=False)   # camera mast
    c.paint(rrect(18, 2, 9, 5, 2), "white")                     # camera head
    c.dot(24, 4, "dark")
    c.paint(rrect(4, 14, 24, 8, 2), "amber")                    # body
    c.paint(rrect(8, 11, 13, 4, 1), "blue")                     # solar panel
    c.paint(ellipse(7, 25, 4, 4), "dark")                       # wheels
    c.paint(ellipse(16, 25, 4, 4), "dark")
    c.paint(ellipse(25, 25, 4, 4), "dark")
    for x in (7, 16, 25):
        c.paint(ellipse(x, 25, 1.6, 1.6), "steel", bevel=False, outline=False)
    return c


def traffic(style):
    c = Canvas(style)
    c.paint(rect(14, 26, 4, 5), "steel_d")                      # pole
    c.paint(rrect(9, 1, 14, 26, 3), "dark")                     # housing
    for cy, colour in ((7, "red"), (14, "amber"), (21, "green")):
        c.paint(ellipse(16, cy, 3.6, 3.6), colour)
        c.dot(15, cy - 1, "white")
    return c


def enigma(style):
    c = Canvas(style)
    for x in (7, 14, 21):                                       # rotors
        c.paint(rect(x, 4, 5, 9), "steel")
        c.paint(rect(x + 1, 6, 3, 2), "amber", bevel=False, outline=False)
    c.paint(rrect(2, 12, 28, 18, 2), "brown")                   # wooden case
    c.paint(rect(4, 14, 24, 6), "wood_l", bevel=False)          # lamp panel
    for k in range(6):
        c.dot(6 + k * 4, 17, "amber" if k == 2 else "gold")
        c.dot(7 + k * 4, 17, "amber" if k == 2 else "gold")
    for row_y in (23, 27):                                      # keyboard
        for k in range(6):
            c.paint(rect(6 + k * 4, row_y, 2, 2), "white", bevel=False, outline=False)
    return c


def arm(style):
    c = Canvas(style)
    c.paint(rrect(2, 26, 14, 5, 1), "steel_d")                  # base
    c.paint(line((9, 25), (18, 12), 5), "teal")                 # link 1
    c.paint(line((18, 12), (26, 17), 4), "amber")               # link 2
    c.paint(ellipse(9, 25, 3.5, 3.5), "steel")                  # shoulder
    c.paint(ellipse(18, 12, 3.5, 3.5), "steel")                 # elbow
    c.paint(rrect(22, 18, 8, 4, 1), "red")                      # electromagnet
    c.paint(rect(23, 23, 6, 5), "steel")                        # part being lifted
    return c


def ros(style):
    c = Canvas(style)
    nodes = {"a": (6, 7), "b": (26, 7), "c": (6, 25), "d": (26, 25), "mid": (16, 16)}
    for key in ("a", "b", "c", "d"):
        c.paint(line(nodes[key], nodes["mid"], 1.6), "steel", bevel=False, outline=False)
    c.paint(line(nodes["a"], nodes["b"], 1.6), "steel", bevel=False, outline=False)
    for key in ("a", "b", "c", "d"):
        c.paint(ellipse(*nodes[key], 4, 4), "teal")
    c.paint(ellipse(*nodes["mid"], 5.5, 5.5), "amber")
    c.dot(14, 14, "white")
    c.dot(5, 5, "white")
    c.dot(25, 5, "white")
    return c


def magnet(style):
    c = Canvas(style)
    body = (rect(5, 5, 7, 12) | rect(20, 5, 7, 12)
            | {p for p in (ellipse(16, 17, 11, 11) - ellipse(16, 17, 4, 4)) if p[1] >= 17})
    c.paint(body, "red")
    c.paint(rect(5, 5, 7, 6), "steel")                          # silver pole tips
    c.paint(rect(20, 5, 7, 6), "steel")
    return c


def logo(style):
    c = Canvas(style)
    for k in range(4):                                          # chip pins
        offset = 9 + k * 5
        c.paint(rect(2, offset, 5, 2), "steel", bevel=False)
        c.paint(rect(25, offset, 5, 2), "steel", bevel=False)
        c.paint(rect(offset, 2, 2, 5), "steel", bevel=False)
        c.paint(rect(offset, 25, 2, 5), "steel", bevel=False)
    c.paint(rrect(6, 6, 20, 20, 3), "teal")                     # chip body
    c.paint(rrect(11, 11, 10, 10, 2), "white")                  # die
    c.paint(rect(14, 14, 4, 4), "teal", bevel=False, outline=False)
    return c


def projects(style):
    c = Canvas(style)
    c.paint(rrect(3, 3, 12, 12, 2), "teal")
    c.paint(rrect(17, 3, 12, 12, 2), "amber")
    c.paint(rrect(3, 17, 12, 12, 2), "green")
    c.paint(rrect(17, 17, 12, 12, 2), "blue")
    return c


def about(style):
    c = Canvas(style)
    c.paint(rrect(4, 20, 24, 14, 7), "teal")                    # shoulders
    c.paint(rect(13, 15, 6, 6), "peach")                        # neck
    c.paint(ellipse(16, 10, 6.5, 7), "peach")                   # head
    c.dot(13, 10, "dark")
    c.dot(19, 10, "dark")
    return c


def robotics(style):
    c = Canvas(style)
    c.paint(line((16, 9), (16, 4), 2), "steel", bevel=False)    # antenna
    c.paint(ellipse(16, 4, 2.6, 2.6), "red")
    c.paint(rect(3, 14, 4, 7), "steel")                         # ears
    c.paint(rect(25, 14, 4, 7), "steel")
    c.paint(rrect(6, 9, 20, 17, 4), "teal")                     # head
    c.paint(rect(10, 14, 4, 4), "white", bevel=False)           # eyes
    c.paint(rect(18, 14, 4, 4), "white", bevel=False)
    c.dot(12, 16, "navy")
    c.dot(20, 16, "navy")
    c.paint(rrect(11, 21, 10, 3, 1), "dark", bevel=False)       # mouth
    return c


def vision(style):
    c = Canvas(style)
    c.paint(ellipse(16, 16, 14, 9), "white")                    # eyeball
    c.paint(ellipse(16, 16, 7, 7), "blue")                      # iris
    c.paint(ellipse(16, 16, 3.4, 3.4), "navy", bevel=False)     # pupil
    c.dot(14, 14, "white")
    c.dot(15, 13, "white")
    return c


def embedded(style):
    c = Canvas(style)
    c.paint(rrect(2, 4, 28, 24, 2), "green")                    # circuit board
    for y in (9, 15, 21):                                       # traces
        c.paint(line((4, y), (11, y), 1.2), "gold", bevel=False, outline=False)
        c.paint(line((21, y), (28, y), 1.2), "gold", bevel=False, outline=False)
    c.paint(rect(11, 10, 10, 12), "dark")                       # chip
    c.dot(13, 12, "white")
    c.paint(rect(5, 24, 2, 2), "gold", bevel=False, outline=False)
    c.paint(rect(25, 24, 2, 2), "gold", bevel=False, outline=False)
    return c


def control(style):
    c = Canvas(style)
    for x in (7, 15, 23):                                       # slider tracks
        c.paint(rect(x, 3, 3, 26), "steel_d")
    c.paint(rrect(3, 7, 11, 6, 2), "teal")                      # knobs
    c.paint(rrect(11, 18, 11, 6, 2), "amber")
    c.paint(rrect(19, 11, 11, 6, 2), "green")
    return c


def simulation(style):
    c = Canvas(style)
    c.paint(rect(13, 24, 6, 4), "steel_d")                      # stand
    c.paint(rrect(8, 27, 16, 3, 1), "steel_d")
    c.paint(rrect(2, 3, 28, 22, 3), "dark")                     # monitor
    c.paint(rrect(5, 6, 22, 16, 1), "navy", bevel=False, outline=False)   # screen
    c.paint(line((7, 18), (11, 11), 2), "teal", bevel=False, outline=False)
    c.paint(line((11, 11), (15, 16), 2), "teal", bevel=False, outline=False)
    c.paint(line((15, 16), (19, 9), 2), "teal", bevel=False, outline=False)
    c.paint(line((19, 9), (24, 14), 2), "teal", bevel=False, outline=False)
    return c


def cad(style):
    c = Canvas(style)
    c.paint(poly([(4, 9), (16, 15), (16, 29), (4, 23)]), "blue", bevel=False)      # left face
    c.paint(poly([(28, 9), (16, 15), (16, 29), (28, 23)]), "steel_d", bevel=False)  # right face
    c.paint(poly([(16, 3), (28, 9), (16, 15), (4, 9)]), "blue_l", bevel=False)      # top face
    return c


ICONS = {
    "tile": tile, "rover": rover, "traffic": traffic, "enigma": enigma,
    "arm": arm, "ros": ros, "magnet": magnet, "logo": logo,
    "projects": projects, "about": about, "robotics": robotics,
    "vision": vision, "embedded": embedded, "control": control,
    "simulation": simulation, "cad": cad,
}


# ---------------------------------------------------------------- output
SPRITES_HEAD = """/* Generated by tools/make_pixel_icons.py. Do not edit by hand.
   The classic icon set drawn in pure CSS: one 1px square whose box-shadow paints every art pixel.
   Use: <span class="sprite spr-tile"></span>. Add class "s2" for a 64px version.
   Integer sizes only (32px, 64px): other sizes can show hairline gaps between pixels. */
.sprite { display: inline-block; position: relative; flex: none; width: 32px; height: 32px; }
.sprite.s2 { width: 64px; height: 64px; }
.sprite::before { content: ""; position: absolute; left: 0; top: 0; width: 1px; height: 1px; transform-origin: 0 0; }
.sprite.s2::before { transform: scale(2); }
"""


def main():
    SITE_DIR.mkdir(parents=True, exist_ok=True)
    sprite_rules = []
    written = 0
    for style_name, style in STYLES.items():
        out = LAB_ICONS_DIR / style_name
        out.mkdir(parents=True, exist_ok=True)
        for icon_name, draw in ICONS.items():
            canvas = draw(style)
            png = canvas.to_png()
            (out / f"{icon_name}.png").write_bytes(png)
            written += 1
            if style_name == DEFAULT_STYLE:
                (SITE_DIR / f"{icon_name}.png").write_bytes(png)
                sprite_rules.append(f".spr-{icon_name}::before {{ box-shadow: {canvas.to_box_shadow()}; }}")
    LAB_SPRITES.write_text(SPRITES_HEAD + "\n".join(sprite_rules) + "\n", encoding="utf-8")
    print(f"wrote {written} lab icons ({len(STYLES)} styles x {len(ICONS)} icons), "
          f"{len(ICONS)} site icons, and sprites.css")


if __name__ == "__main__":
    main()
