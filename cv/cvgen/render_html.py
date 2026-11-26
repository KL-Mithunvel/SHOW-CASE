"""Write the render context as a self-contained HTML preview (photo embedded as a data URI)."""
from __future__ import annotations

import base64
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from .photo import cropped_photo


def render_html(ctx: dict, style: dict, data_dir: Path, template_path: Path, out_path: Path) -> Path:
    env = Environment(loader=FileSystemLoader(template_path.parent),
                      autoescape=select_autoescape(["html", "j2"]),
                      trim_blocks=True, lstrip_blocks=True)
    photo_uri = None
    if ctx.get("photo"):
        pw = style["photo_mm"]
        jpeg = cropped_photo(data_dir / ctx["photo"], pw["width"], pw["height"]).read()
        photo_uri = "data:image/jpeg;base64," + base64.b64encode(jpeg).decode("ascii")
    html = env.get_template(template_path.name).render(ctx=ctx, style=style, photo_uri=photo_uri)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8")
    return out_path
