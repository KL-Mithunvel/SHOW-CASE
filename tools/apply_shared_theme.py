"""Run: python tools/apply_shared_theme.py  (skips pages that already have the shared theme).
Wire projects/_shared/showcase.{css,js} into the seven project pages.
Adds markup only (shared bar, shared footer links, head tags); removes no page content.
Safe to re-run: pages that already have data-sc are skipped, so after re-copying
one page from its repo or artifact, run this again to re-apply the shared theme to it."""
import re, sys

import os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "projects").replace("\\", "/") + "/"
ORDER = [  # landing-page order, used for previous / next links
    ("magnet", "magnet-inserter", "Magnet-Embed Print Assistant",
     "Pauses a 3D print at the right layer, places a magnet in a printed pocket, and prints over it."),
    ("ros", "ros-lab", "ROS 2 Mobile Robots",
     "Two ROS 2 robots taken from simulation to hardware: a Nav2 waypoint mission and a zone patrol."),
    ("tile", "tile-inspection", "Tile Inspection Line", None),  # already has a description
    ("arm", "plc-2dof-arm", "PLC 2-DOF Robotic Arm",
     "A PLC-driven pick-and-place arm that lifts 5 kg with an electromagnet, checked in Ansys first."),
    ("sleepy", "sleepy", "SLEEPY Assistant",
     "A self-hosted AI project assistant: Markdown notes in Git, approved edits only, and a night shift of background jobs."),
    ("herc", "herc-26", "HERC-26 Rover",
     "Competition rover on a Raspberry Pi and an Arduino Mega that hard-stops on signal loss."),
    ("enigma", "myownenigma", "MyOwnEnigma",
     "The WWII Enigma cipher rebuilt in Verilog on an FPGA, with a keyboard, lamp board and printed case."),
    ("traffic", "traffic-management", "Look-Ahead Signals",
     "Traffic lights that look one junction ahead; about 30% less queueing delay in simulation."),
]
FONTS = ("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600"
         "&family=IBM+Plex+Sans+Condensed:wght@500;600;700"
         "&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400")
HEADISH = re.compile(r'\s*(<title>.*?</title>|<meta\b[^>]*>|<link\b[^>]*>|<style\b[^>]*>.*?</style>|<!--.*?-->)', re.S)


def head_end(s, i):
    """Index just after the run of head-only tags starting at i."""
    while True:
        m = HEADISH.match(s, i)
        if not m:
            return i
        i = m.end()


def one(s, old, new):
    assert s.count(old) == 1, (old[:60], s.count(old))
    return s.replace(old, new)


def run(k):
    sc, folder, title, desc = ORDER[k]
    path = ROOT + folder + "/site/index.html"
    s = open(path, encoding="utf8").read()
    if "data-sc=" in s:
        print("skip", folder, "(already has the shared theme)")
        return

    # charset spelling
    s = s.replace("<meta charset=utf8>", '<meta charset="utf-8">')

    # fonts: one shared Plex request; Enigma also keeps Special Elite for the machine lettering
    family = FONTS + ("&family=Special+Elite" if sc == "enigma" else "") + "&display=swap"
    links = re.findall(r'<link\b[^>]*href="https://fonts\.googleapis\.com/css2[^"]*"[^>]*>', s)
    assert len(links) == 1, (folder, len(links))
    s = s.replace(links[0], '<link rel="stylesheet" href="' + family + '">')

    shared = ('\n<link rel="stylesheet" href="../../_shared/showcase.css">'
              '\n<script src="../../_shared/showcase.js"></script>\n')
    if desc and 'name="description"' not in s:
        shared = '\n<meta name="description" content="' + desc + '">' + shared

    # <html>, <head>, <body>
    if sc == "enigma":
        assert s.lstrip().startswith("<meta charset")
        s = '<!doctype html>\n<html lang="en" data-sc="enigma">\n<head>\n' + s.lstrip()
        start = s.index("<head>\n") + len("<head>\n")
        e = head_end(s, start)
        s = s[:e] + shared + "</head>\n<body>" + s[e:]
    elif "</head><body>" in s:  # artifact copies: title/style were parked inside <body>
        s = one(s, "<!doctype html><html>", '<!doctype html><html lang="en" data-sc="' + sc + '">')
        i = s.index("</head><body>")
        s = s[:i] + s[i + len("</head><body>"):]
        e = head_end(s, i)
        s = s[:e] + shared + "</head>\n<body>" + s[e:]
    else:  # magnet: already a proper document
        s = one(s, '<html lang="en">', '<html lang="en" data-sc="' + sc + '">')
        s = one(s, "</head>", shared + "</head>")

    # shared top bar, straight after <body>
    theme_btn = '' if sc == "tile" else '<button class="sc-theme" type="button">Dark</button>'  # Tile keeps its own theme button
    bar = ('\n<nav class="sc-bar" aria-label="Portfolio"><div class="sc-in">'
           '<a class="sc-back" href="../../../index.html">\u2190 All projects</a>'
           '<span class="sc-me">K L Mithunvel</span><span class="sc-sp"></span>' + theme_btn +
           '</div></nav>\n')
    m = re.search(r"<body[^>]*>", s)
    s = s[:m.end()] + bar + s[m.end():]

    # shared previous / next links, at the end of the page
    p, n = ORDER[(k - 1) % len(ORDER)], ORDER[(k + 1) % len(ORDER)]
    foot = ('\n<nav class="sc-foot" aria-label="More projects"><div class="sc-in">'
            '<a href="../../' + p[1] + '/site/index.html"><span>\u2190 Previous</span><b>' + p[2] + '</b></a>'
            '<a href="../../' + n[1] + '/site/index.html"><span>Next \u2192</span><b>' + n[2] + '</b></a>'
            '<a class="sc-all" href="../../../index.html">All projects</a>'
            '</div></nav>\n')
    if s.count("</body>") == 1:
        s = s.replace("</body>", foot + "</body>")
    else:
        assert "</body>" not in s, folder
        s = s.rstrip() + "\n" + foot

    # lazy-load every image except the first (usually the hero)
    count = [0]
    def lazy(mm):
        count[0] += 1
        tag = mm.group(0)
        if count[0] == 1 or "loading=" in tag:
            return tag
        return tag[:4] + ' loading="lazy"' + tag[4:]
    parts = re.split(r"(<script\b.*?</script>)", s, flags=re.S)  # never touch <img in script strings
    s = "".join(x if x.startswith("<script") else re.sub(r"<img\b[^>]*>", lazy, x) for x in parts)

    open(path, "w", encoding="utf8", newline="").write(s)
    print("ok", folder, len(s))


for k in range(len(ORDER)):
    run(k)
