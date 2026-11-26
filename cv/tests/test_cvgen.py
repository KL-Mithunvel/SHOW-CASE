"""Tests for the CV generator. Run from the repo root: python -m pytest cv/tests"""
import datetime as dt
import sys
from pathlib import Path

import pytest
from docx import Document
from PIL import Image

CV_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(CV_DIR))

from cvgen.model import CVError, build_context, load_profile, load_yaml, select_items  # noqa: E402
from cvgen.photo import cropped_photo  # noqa: E402
from cvgen.render_docx import render_docx  # noqa: E402
from cvgen.render_html import render_html  # noqa: E402

SAMPLE = CV_DIR / "sample"
CONFIG = load_yaml(CV_DIR / "config.yaml")


@pytest.fixture
def master():
    return load_yaml(SAMPLE / "master.yaml")


@pytest.fixture
def profile():
    return load_profile(SAMPLE, "vision")


def section(ctx, key):
    return next(s for s in ctx["sections"] if s["key"] == key)


# ---------- selection ----------

def test_tags_keep_matching_and_untagged(master):
    chosen = select_items(master["experience"], "experience", {"vision"}, None)
    assert [c["id"] for c in chosen] == ["vision-job", "cafe"]


def test_empty_include_keeps_everything(master):
    assert len(select_items(master["experience"], "experience", set(), None)) == 3


def test_only_sets_items_and_order(master):
    chosen = select_items(master["experience"], "experience", {"vision"}, {"only": ["plc-job", "vision-job"]})
    assert [c["id"] for c in chosen] == ["plc-job", "vision-job"]


def test_only_with_unknown_id_fails(master):
    with pytest.raises(CVError, match="nope"):
        select_items(master["experience"], "experience", set(), {"only": ["nope"]})


def test_exclude_and_limit(master):
    chosen = select_items(master["projects"], "projects", set(), {"exclude": ["p1"], "limit": 1})
    assert [c["id"] for c in chosen] == ["p2"]


# ---------- context ----------

def test_bullets_follow_tags(master, profile):
    ctx = build_context(master, profile, today=dt.date(2025, 1, 2))
    job = section(ctx, "experience")["rows"][0]
    assert job["bullets"] == ["Built a camera rig"]          # the plc-tagged bullet is dropped


def test_profile_overrides_and_sign_date(master, profile):
    ctx = build_context(master, profile, today=dt.date(2025, 1, 2))
    assert ctx["headline"] == "Applying for a machine-vision internship"
    assert section(ctx, "profile")["text"] == "I want to build inspection systems."
    assert ctx["sign"] == {"place": "Testtown", "date": "02.01.2025"}
    assert ctx["photo"] is None                               # show.photo: false
    assert len(section(ctx, "projects")["rows"]) == 1


def test_public_mode_redacts_private_fields(master, profile):
    ctx = build_context(master, profile, public=True, redact=["phone", "dob", "address"])
    labels = [c[0] for c in ctx["contact"]]
    assert "Phone" not in labels and "E-mail" in labels
    personal = [r["label"] for r in section(ctx, "personal")["rows"]]
    assert "Date of birth" not in personal and "Address" not in personal


def test_unknown_section_fails(master, profile):
    profile["sections"] = ["profile", "hobbies"]
    with pytest.raises(CVError, match="hobbies"):
        build_context(master, profile)


def test_missing_email_fails(master, profile):
    del master["person"]["email"]
    with pytest.raises(CVError, match="email"):
        build_context(master, profile)


def test_missing_profile_lists_available():
    with pytest.raises(CVError, match="vision"):
        load_profile(SAMPLE, "does-not-exist")


# ---------- rendering ----------

def test_photo_crop_ratio(tmp_path):
    src = tmp_path / "square.jpg"
    Image.new("RGB", (600, 600), "white").save(src)
    img = Image.open(cropped_photo(src, 35, 45))
    assert img.size == (467, 600)


def test_missing_photo_fails(tmp_path):
    with pytest.raises(CVError, match="photo not found"):
        cropped_photo(tmp_path / "none.jpg", 35, 45)


def test_docx_contains_content(master, profile, tmp_path):
    ctx = build_context(master, profile)
    out = render_docx(ctx, CONFIG["style"], SAMPLE, tmp_path / "cv.docx")
    doc = Document(out)
    text = "\n".join(p.text for p in doc.paragraphs)
    cells = "\n".join(c.text for t in doc.tables for row in t.rows for c in row.cells)
    assert "Alex Example" in cells
    assert "PRACTICAL EXPERIENCE" in text
    assert "Intern, Machine Vision" in cells
    assert "Intern, Automation" not in cells                  # plc job filtered out


def test_docx_with_photo(master, profile, tmp_path):
    (tmp_path / "assets").mkdir()
    Image.new("RGB", (300, 400), "grey").save(tmp_path / "assets" / "photo.jpg")
    profile["show"] = {"photo": True}
    ctx = build_context(master, profile)
    out = render_docx(ctx, CONFIG["style"], tmp_path, tmp_path / "cv.docx")
    assert len(Document(out).inline_shapes) == 1


def test_html_public_has_no_phone(master, profile, tmp_path):
    ctx = build_context(master, profile, public=True, redact=CONFIG["redact_in_public"])
    out = render_html(ctx, CONFIG["style"], SAMPLE, CV_DIR / CONFIG["template_html"], tmp_path / "cv.html")
    html = out.read_text(encoding="utf-8")
    assert "Alex Example" in html and "Defect detector" in html
    assert master["person"]["phone"] not in html


# ---------- checks ----------

from cvgen.checks import find_placeholders, keyword_report, pdf_page_count  # noqa: E402


def test_keyword_report_with_alternatives(master, profile):
    ctx = build_context(master, profile)
    found, missing = keyword_report(ctx, ["camera", "PLC|programmable logic", "welding"])
    assert found == ["camera"] and missing == ["PLC|programmable logic", "welding"]


def test_placeholders_found(master, profile):
    master["summary"] = "x"
    profile["summary"] = "I like [fill in] things"
    assert find_placeholders(build_context(master, profile)) == ["I like [fill in] things"]


def test_pdf_page_count(tmp_path):
    pdf = tmp_path / "a.pdf"
    pdf.write_bytes(b"<< /Type /Pages /Count 2 >> << /Type /Page >> << /Type/Page >>")
    assert pdf_page_count(pdf) == 2


def test_contact_links(master, profile, tmp_path):
    ctx = build_context(master, profile)
    by_label = {c[0]: c[2] for c in ctx["contact"]}
    assert by_label["E-mail"] == "mailto:alex@example.com"
    assert by_label["GitHub"] == "https://github.com/alex-example"
    assert by_label["Phone"] is None
    out = render_docx(ctx, CONFIG["style"], SAMPLE, tmp_path / "cv.docx")
    rels = [r.target_ref for r in Document(out).part.rels.values() if r.is_external]
    assert "https://github.com/alex-example" in rels


def test_birth_date_and_place_combined(master, profile):
    rows = {r["label"]: r["value"] for r in section(build_context(master, profile), "personal")["rows"]}
    assert rows["Born"] == "01.01.2000 in Sampleville"


def test_public_mode_hides_place_of_birth(master, profile):
    ctx = build_context(master, profile, public=True, redact=CONFIG["redact_in_public"])
    assert "Sampleville" not in " ".join(r["value"] for r in section(ctx, "personal")["rows"])
