"""Pre-send checks on a built CV. Pure functions except pdf_page_count (reads a file).

keyword_report   which of the profile's keywords appear in the CV text
find_placeholders  leftover [..], TODO, TBD, trailing '?' in any text
pdf_page_count   number of pages in a PDF written by Word
"""
from __future__ import annotations

import re
from pathlib import Path

PLACEHOLDER = re.compile(r"\[[^\]]*\]|\bTODO\b|\bTBD\b|\?\s*$")
PDF_PAGE = re.compile(rb"/Type\s*/Page(?!s)")


def context_texts(ctx: dict) -> list[str]:
    """Every piece of visible text in a render context, in reading order."""
    out = [ctx["person"].get("name", ""), ctx.get("headline", "")]
    out += [str(c[1]) for c in ctx.get("contact", [])]
    for sec in ctx["sections"]:
        out.append(sec["title"])
        if sec.get("text"):
            out.append(sec["text"])
        for row in sec.get("rows", []):
            for key in ("label", "value", "name", "level", "when", "title", "org", "note", "text"):
                if row.get(key):
                    out.append(str(row[key]))
            out += row.get("bullets", [])
    return [t for t in out if t]


def keyword_report(ctx: dict, keywords: list[str]) -> tuple[list[str], list[str]]:
    """Split keywords into (found, missing). Case-insensitive; a keyword may be 'a|b' for alternatives."""
    blob = " ".join(context_texts(ctx)).lower()
    found, missing = [], []
    for kw in keywords or []:
        alternatives = [a.strip().lower() for a in str(kw).split("|") if a.strip()]
        (found if any(a in blob for a in alternatives) else missing).append(str(kw))
    return found, missing


def find_placeholders(ctx: dict) -> list[str]:
    return [t for t in context_texts(ctx) if PLACEHOLDER.search(t)]


def pdf_page_count(path: Path) -> int:
    """Count page objects in a PDF. Reliable for Word's PDF export (uncompressed page tree)."""
    return len(PDF_PAGE.findall(path.read_bytes()))
