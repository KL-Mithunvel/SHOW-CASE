"""Write the render context (see model.build_context) as an A4 Word document.

Layout: header (name, headline, contact | photo) over an accent rule; then each
section as an uppercase heading with a thin rule and a borderless two-column
table (date/label left, content right). Pages 2+ carry a running header;
every page has "n / N" in the footer. Ends with place/date and signature lines.
"""
from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Mm, Pt, RGBColor
from .photo import cropped_photo


# ---------- low-level helpers (python-docx has no API for these) ----------

def _rgb(hex_str: str) -> RGBColor:
    return RGBColor.from_string(hex_str.upper())


def _border(paragraph, side: str, color: str, size_eighths: int, space: int = 2):
    """Add a border line on one side of a paragraph (side: top/bottom)."""
    ppr = paragraph._p.get_or_add_pPr()
    bdr = ppr.find(qn("w:pBdr"))
    if bdr is None:
        bdr = OxmlElement("w:pBdr")
        ppr.append(bdr)
    el = OxmlElement(f"w:{side}")
    el.set(qn("w:val"), "single")
    el.set(qn("w:sz"), str(size_eighths))
    el.set(qn("w:space"), str(space))
    el.set(qn("w:color"), color)
    bdr.append(el)


def _letter_spacing(run, twentieths_pt: int):
    rpr = run._r.get_or_add_rPr()
    sp = OxmlElement("w:spacing")
    sp.set(qn("w:val"), str(twentieths_pt))
    rpr.append(sp)


def _field(paragraph, instr: str):
    """Insert a Word field such as PAGE or NUMPAGES."""
    run = paragraph.add_run()
    for tag, attr in (("w:fldChar", "begin"), ("w:instrText", None), ("w:fldChar", "end")):
        el = OxmlElement(tag)
        if attr:
            el.set(qn("w:fldCharType"), attr)
        else:
            el.set(qn("xml:space"), "preserve")
            el.text = instr
        run._r.append(el)
    return run


def _hyperlink(paragraph, url: str, text: str, *, size_pt: float, color: str, font: str):
    """Append a clickable link run (python-docx has no hyperlink API)."""
    r_id = paragraph.part.relate_to(url, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
                                    is_external=True)
    link = OxmlElement("w:hyperlink")
    link.set(qn("r:id"), r_id)
    run = OxmlElement("w:r")
    rpr = OxmlElement("w:rPr")
    fonts = OxmlElement("w:rFonts")
    fonts.set(qn("w:ascii"), font)
    fonts.set(qn("w:hAnsi"), font)
    col = OxmlElement("w:color")
    col.set(qn("w:val"), color)
    sz = OxmlElement("w:sz")
    sz.set(qn("w:val"), str(int(size_pt * 2)))
    for el in (fonts, col, sz):
        rpr.append(el)
    run.append(rpr)
    t = OxmlElement("w:t")
    t.text = text
    t.set(qn("xml:space"), "preserve")
    run.append(t)
    link.append(run)
    paragraph._p.append(link)


def _no_split(row):
    trpr = row._tr.get_or_add_trPr()
    el = OxmlElement("w:cantSplit")
    trpr.append(el)


def _cell_margins_zero(table):
    tblpr = table._tbl.tblPr
    mar = OxmlElement("w:tblCellMar")
    for side in ("left", "right"):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:w"), "0")
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tblpr.append(mar)


def _fixed_table(doc, cols_mm: list[float]):
    table = doc.add_table(rows=0, cols=len(cols_mm))
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.autofit = False
    _cell_margins_zero(table)
    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    table._tbl.tblPr.append(layout)
    for col, w in zip(table.columns, cols_mm):
        col.width = Mm(w)
    return table


def _add_row(table, cols_mm):
    row = table.add_row()
    _no_split(row)
    for cell, w in zip(row.cells, cols_mm):
        cell.width = Mm(w)
    return row.cells


# ---------- renderer ----------

class _Writer:
    def __init__(self, ctx: dict, style: dict, data_dir: Path):
        self.ctx, self.s, self.data_dir = ctx, style, data_dir
        self.doc = Document()
        page = style["page"]
        self.text_w = page["width_mm"] - 2 * page["margin_side_mm"]
        self.cols = [style["date_col_mm"], self.text_w - style["date_col_mm"]]

    # paragraph helpers
    def _fmt(self, p, before=0, after=0, line=1.12):
        pf = p.paragraph_format
        pf.space_before, pf.space_after, pf.line_spacing = Pt(before), Pt(after), line
        return p

    def _run(self, p, text, *, bold=False, italic=False, size=None, color=None, font=None):
        r = p.add_run(text)
        r.bold, r.italic = bold, italic
        r.font.size = Pt(size or self.s["size_body_pt"])
        r.font.color.rgb = _rgb(color or self.s["ink"])
        if font:
            r.font.name = font
        return r

    def setup(self):
        s, page = self.s, self.s["page"]
        sec = self.doc.sections[0]
        sec.page_width, sec.page_height = Mm(page["width_mm"]), Mm(page["height_mm"])
        sec.top_margin, sec.bottom_margin = Mm(page["margin_top_mm"]), Mm(page["margin_bottom_mm"])
        sec.left_margin = sec.right_margin = Mm(page["margin_side_mm"])
        sec.header_distance = sec.footer_distance = Mm(8)
        normal = self.doc.styles["Normal"]
        normal.font.name = s["font_body"]
        normal.element.rPr.rFonts.set(qn("w:eastAsia"), s["font_body"])
        normal.font.size = Pt(s["size_body_pt"])
        normal.font.color.rgb = _rgb(s["ink"])
        lb = self.doc.styles["List Bullet"]
        lb.paragraph_format.left_indent = Mm(4)
        lb.paragraph_format.first_line_indent = Mm(-3.5)
        lb.paragraph_format.space_after = Pt(0)
        self.doc.core_properties.title = f"Curriculum Vitae – {self.ctx['person']['name']}"
        self.doc.core_properties.author = self.ctx["person"]["name"]

    def header_footer(self):
        sec = self.doc.sections[0]
        sec.different_first_page_header_footer = True
        small, muted = self.s["size_small_pt"] - 0.5, self.s["muted"]
        # running header on pages 2+
        hp = sec.header.paragraphs[0]
        tabs = hp.paragraph_format.tab_stops
        for inherited in (Inches(3.25), Inches(6.5)):   # Word's Header style ships centre/right tabs here
            tabs.add_tab_stop(inherited, WD_TAB_ALIGNMENT.CLEAR)
        tabs.add_tab_stop(Mm(self.text_w), WD_TAB_ALIGNMENT.RIGHT)
        self._run(hp, f"{self.ctx['person']['name']} · Curriculum Vitae\t{self.ctx['person']['email']}",
                  size=small, color=muted)
        # page numbers on every page
        for footer in (sec.footer, sec.first_page_footer):
            fp = footer.paragraphs[0]
            fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            for kind, value in (("field", "PAGE"), ("text", " / "), ("field", "NUMPAGES")):
                if kind == "text":
                    self._run(fp, value, size=small, color=muted)
                else:
                    r = _field(fp, value)
                    r.font.size, r.font.color.rgb = Pt(small), _rgb(muted)

    def top(self):
        ctx, s = self.ctx, self.s
        pw = s["photo_mm"]
        has_photo = bool(ctx.get("photo"))
        cols = [self.text_w - pw["width"] - 4, pw["width"] + 4] if has_photo else [self.text_w]
        t = _fixed_table(self.doc, cols)
        cells = _add_row(t, cols)
        left = cells[0]
        p = self._fmt(left.paragraphs[0], after=2, line=1.0)
        self._run(p, ctx["person"]["name"], bold=True, size=s["size_name_pt"], color=s["accent"], font=s["font_heading"])
        if ctx["headline"]:
            self._run(self._fmt(left.add_paragraph(), after=6), ctx["headline"], bold=True, size=s["size_headline_pt"])
        for label, value, url in ctx["contact"]:
            cp = self._fmt(left.add_paragraph(), after=0)
            self._run(cp, f"{label}  ", bold=True, size=s["size_small_pt"])
            if url:
                _hyperlink(cp, url, str(value), size_pt=s["size_small_pt"], color=s["accent"], font=s["font_body"])
            else:
                self._run(cp, str(value), size=s["size_small_pt"], color=s["muted"])
        if has_photo:
            pp = cells[1].paragraphs[0]
            pp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            img = cropped_photo(self.data_dir / ctx["photo"], pw["width"], pw["height"])
            pp.add_run().add_picture(img, width=Mm(pw["width"]), height=Mm(pw["height"]))
        rule = self._fmt(self.doc.add_paragraph(), after=0, line=0.4)
        _border(rule, "bottom", s["accent"], 12)

    def heading(self, title: str, page_break: bool):
        p = self._fmt(self.doc.add_paragraph(), before=8, after=3)
        if page_break:
            p.paragraph_format.page_break_before = True
        p.paragraph_format.keep_with_next = True
        r = self._run(p, title.upper(), bold=True, size=self.s["size_section_pt"],
                      color=self.s["accent"], font=self.s["font_heading"])
        _letter_spacing(r, 30)
        _border(p, "bottom", self.s["rule"], 4)

    def section(self, sec: dict):
        s, cols = self.s, self.cols
        self.heading(sec["title"], sec.get("page_break_before", False))
        kind = sec["kind"]
        if kind == "text":
            self._run(self._fmt(self.doc.add_paragraph(), after=2), sec["text"])
            return
        t = _fixed_table(self.doc, cols)
        for row in sec["rows"]:
            left, right = _add_row(t, cols)
            lp = self._fmt(left.paragraphs[0], after=3)
            rp = self._fmt(right.paragraphs[0], after=3)
            if kind == "kv":
                self._run(lp, row["label"], size=s["size_small_pt"], color=s["muted"])
                self._run(rp, row["value"])
            elif kind == "languages":
                self._run(lp, row["name"], size=s["size_small_pt"], color=s["muted"])
                self._run(rp, row["level"])
            elif kind == "dated":
                self._run(lp, row["when"], size=s["size_small_pt"], color=s["muted"])
                self._run(rp, row["text"])
                if row["org"]:
                    self._run(rp, f" · {row['org']}", italic=True, color=s["muted"])
            elif kind == "timeline":
                self._run(lp, row["when"], size=s["size_small_pt"], color=s["muted"])
                rp.paragraph_format.space_after = Pt(0)
                self._run(rp, row["title"], bold=True)
                if row["org"] or row["note"]:
                    op = self._fmt(right.add_paragraph(), after=0)
                    if row["org"]:
                        self._run(op, row["org"], italic=True, color=s["muted"])
                    if row["note"]:
                        self._run(op, (" · " if row["org"] else "") + row["note"])
                for b in row["bullets"]:
                    self._run(self._fmt(right.add_paragraph(style="List Bullet"), after=0), b)
                self._fmt(right.add_paragraph(), after=0, line=0.35)   # gap between entries

    def signature(self):
        sign = self.ctx["sign"]
        spacer = self._fmt(self.doc.add_paragraph(), before=24, after=0)
        spacer.paragraph_format.keep_with_next = True
        half = self.text_w / 2 - 6
        cols = [half, 12, half]
        t = _fixed_table(self.doc, cols)
        a, _, b = _add_row(t, cols)
        for cell, text in ((a, ", ".join(x for x in (sign["place"], sign["date"]) if x) or "Place, date"),
                           (b, "Signature")):
            p = self._fmt(cell.paragraphs[0], after=0)
            _border(p, "top", self.s["ink"], 6)
            self._run(p, text, size=self.s["size_small_pt"], color=self.s["muted"])
        # Word always needs a paragraph after a final table; make it 1 pt so it never starts a new page.
        tail = self._fmt(self.doc.add_paragraph(), after=0)
        tail.paragraph_format.line_spacing = Pt(1)
        mark = OxmlElement("w:rPr")          # size of the paragraph mark itself
        sz = OxmlElement("w:sz")
        sz.set(qn("w:val"), "2")
        mark.append(sz)
        tail._p.get_or_add_pPr().append(mark)

    def build(self) -> Document:
        self.setup()
        self.header_footer()
        self.top()
        for sec in self.ctx["sections"]:
            self.section(sec)
        self.signature()
        return self.doc


def render_docx(ctx: dict, style: dict, data_dir: Path, out_path: Path) -> Path:
    doc = _Writer(ctx, style, data_dir).build()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(out_path)
    return out_path
