"""Build a CV for one job profile.

Usage (from the SHOW-CASE repo root, venv active):
    python cv/build.py --list                     # show available profiles
    python cv/build.py haendle-2027               # -> <data_dir>/out/CV_<Name>_haendle-2027.docx
    python cv/build.py haendle-2027 --html        # also write an HTML preview
    python cv/build.py haendle-2027 --pdf         # also convert the .docx to PDF (needs MS Word)
    python cv/build.py haendle-2027 --html --public   # preview without phone / birth date / address

Data comes from config.yaml `data_dir` (default showcase-private/cv), or CV_DATA_DIR, or --data-dir.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

CV_DIR = Path(__file__).resolve().parent
REPO_ROOT = CV_DIR.parent
sys.path.insert(0, str(CV_DIR))

from cvgen.model import CVError, build_context, list_profiles, load_profile, load_yaml  # noqa: E402
from cvgen.render_docx import render_docx  # noqa: E402
from cvgen.render_html import render_html  # noqa: E402


def resolve_data_dir(cfg: dict, cli_value: str | None) -> Path:
    raw = cli_value or os.environ.get("CV_DATA_DIR") or cfg["data_dir"]
    path = Path(raw)
    return path if path.is_absolute() else (REPO_ROOT / path).resolve()


def to_pdf(docx_path: Path) -> Path:
    try:
        from docx2pdf import convert
    except ImportError as exc:
        raise CVError("--pdf needs the docx2pdf package (pip install -r cv/requirements.txt)") from exc
    pdf_path = docx_path.with_suffix(".pdf")
    try:
        convert(str(docx_path), str(pdf_path))
    except Exception as exc:  # docx2pdf drives Word over COM; report what went wrong
        raise CVError(f"PDF conversion failed (is Microsoft Word installed?): {exc}") from exc
    return pdf_path


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Build a CV from master data and a job profile.")
    ap.add_argument("profile", nargs="?", help="profile name (file name in <data_dir>/profiles without .yaml)")
    ap.add_argument("--list", action="store_true", help="list available profiles and exit")
    ap.add_argument("--html", action="store_true", help="also write an HTML preview")
    ap.add_argument("--pdf", action="store_true", help="also write a PDF (Windows + Microsoft Word)")
    ap.add_argument("--public", action="store_true", help="leave out the fields in config redact_in_public")
    ap.add_argument("--data-dir", help="folder holding master.yaml, profiles/ and assets/")
    ap.add_argument("--config", default=str(CV_DIR / "config.yaml"), help="settings file")
    args = ap.parse_args(argv)

    try:
        cfg = load_yaml(Path(args.config))
        data_dir = resolve_data_dir(cfg, args.data_dir)
        if args.list or not args.profile:
            names = list_profiles(data_dir)
            print(f"profiles in {data_dir / 'profiles'}:")
            print("\n".join(f"  {n}" for n in names) or "  (none)")
            return 0 if args.list else 2

        master = load_yaml(data_dir / "master.yaml")
        profile = load_profile(data_dir, args.profile)
        ctx = build_context(master, profile, public=args.public,
                            redact=cfg.get("redact_in_public"), date_format=cfg["date_format"])

        name_part = ctx["person"]["name"].replace(" ", "_")
        suffix = "_public" if args.public else ""
        out_dir = data_dir / cfg["out_subdir"]
        stem = f"CV_{name_part}_{args.profile}{suffix}"

        written = [render_docx(ctx, cfg["style"], data_dir, out_dir / f"{stem}.docx")]
        if args.html:
            written.append(render_html(ctx, cfg["style"], data_dir, CV_DIR / cfg["template_html"],
                                       out_dir / f"{stem}.html"))
        if args.pdf:
            written.append(to_pdf(written[0]))
    except CVError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    for path in written:
        print(f"wrote {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
