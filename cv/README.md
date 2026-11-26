# CV generator

Write your CV data once, then build a tailored CV for each job as a Word file (plus PDF and an HTML preview).
The code lives here (`cv/`, in the SHOW-CASE repo). **The real data lives in the private repo** at
`showcase-private/cv/`, which SHOW-CASE gitignores. Nothing in `cv/` holds personal data: `cv/sample/` is made up.

## Run it

```powershell
# once
python -m venv .venv
.venv\Scripts\activate
pip install -r cv/requirements.txt

# every time (from the SHOW-CASE root, venv active)
python cv/build.py --list                        # profiles available
python cv/build.py haendle-2027 --pdf            # .docx + .pdf
python cv/build.py haendle-2027 --html --public  # preview without phone / birth date / address
python -m pytest cv/tests                        # tests (use cv/sample, no private data)
```

The output goes to `showcase-private/cv/out/`, which is gitignored there too. Rebuild it whenever you need it.
`--pdf` drives Microsoft Word through docx2pdf, so it needs Word installed.

## Files

| Path | Role |
|------|------|
| `build.py` | Command line: loads the config, data and profile, then calls the renderers |
| `config.yaml` | Every setting: data folder, colours, fonts, sizes, margins, photo size, date format, fields hidden by `--public` |
| `cvgen/model.py` | Pure logic: picks the items for a profile and builds one render context (`build_context`) |
| `cvgen/render_docx.py` | Writes the A4 Word file from the context |
| `cvgen/render_html.py` + `templates/cv.html.j2` | Writes the HTML preview from the same context |
| `cvgen/photo.py` | Crops the photo to 35 × 45 mm |
| `templates/cv-template-preview.html` | The design mock-up the layout follows (placeholders only) |
| `sample/` | Made-up data and profile for the tests |
| `tests/test_cvgen.py` | pytest |

Data folder (`showcase-private/cv/`):

| Path | Role |
|------|------|
| `master.yaml` | Everything about you, written once, with tags on items |
| `profiles/<job>.yaml` | One file per application: headline, summary, tags, which items to include, what to show |
| `assets/photo.jpg` | Application photo |
| `preview/` | The `--public` HTML that is published as the private claude.ai artifact |
| `out/` | Generated files (gitignored) |

## Data flow

```
master.yaml ─┐
             ├─> model.build_context() ─> context ─┬─> render_docx ─> CV_<name>_<job>.docx ─> (Word) .pdf
profile.yaml ┘        (select + redact)            └─> render_html ─> CV_<name>_<job>.html
```

## How a profile picks content

- `include_tags: [vision, plc, ...]`: an item is kept when it has **no tags** or **shares a tag** with this list. An empty list keeps everything. Bullets inside an item follow the same rule: a plain string is always kept, and `{text, tags}` is filtered.
- `select.<section>.only: [ids]`: use exactly these items, in this order. An unknown id is an error, which catches typos.
- `select.<section>.exclude: [ids]` and `select.<section>.limit: N`.
- `sections: [...]` sets the order and which sections appear. Sections: personal, profile, education, experience, projects, skills, certificates, languages, activities.
- `headline`, `summary`, `availability`, `titles` (to rename sections), `page_break_before`, `sign_place` and `sign_date`.
- `show: {photo, dob, address, phone, email, linkedin, github}`: set any of these to false to hide it.

**New job:** copy a profile, rename it, change the headline, summary and tags, then run `build.py <name>`.
**Rule:** the job you are applying for never goes on that job's CV as experience.

## Decisions

- The `.docx` is the master output: it is editable, and it is what German applications and visa forms ask for. The PDF is made from it by Word, so the two always match.
- The fonts are Calibri for Word, so the file looks right on any reader's PC. The HTML preview uses web fonts in the same layout.
- The `--public` output leaves out phone, birth date and address. Only that version is published as an artifact.
