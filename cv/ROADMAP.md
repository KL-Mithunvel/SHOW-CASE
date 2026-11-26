# CV generator — plan

Goal: keep one source of truth about me, and for each job produce a tailored, correct CV in the format
that job expects, with checks that catch mistakes before the file is sent.
The code is in `cv/`, and the data is in `showcase-private/cv/` (see `README.md`).

Status legend: ✅ done · 🟡 in progress · 🟢 not started · ⏸ parked (only if a need appears)

---

## Phase 1 — Core generator ✅ (2026-11-26)
- **Goal:** one data file, one profile per job, giving a Word file, a PDF and an HTML preview.
- **Built:** `build.py`; `cvgen/model.py` (selection by tags or ids, redaction), `render_docx.py`, `render_html.py` and `photo.py`; `config.yaml`; sample data plus 16 tests.
- **Success:** the HÄNDLE CV builds to 2 A4 pages, and the public preview has no phone, birth date or address.

## Phase 2 — Data refresh from the official transcript ✅ (2026-11-27)
- **Goal:** the CV carries the latest verified numbers.
- **Done:**
  - CGPA 7.61 → **7.71**, with 139 credits earned (VIT transcript, 10-Nov-2026).
  - Relevant courses now lead with **Industrial Automation, Industrial Robotics, Machine Vision and Fluid Power Systems**.
  - The 2025 HÄNDLE internship is shown as credited towards the degree.
  - German A1 is backed by the German I course.
  - The transcript is stored as `showcase-private/documents/vit-transcript-2026-11.pdf`.
- **Rule:** grades of single courses are not put on the CV, only the CGPA. The transcript goes in the application as an attachment.

## Phase 3 — Pre-send checks ✅ (2026-11-27)
- **Goal:** catch the mistakes that cost an application before the file is sent.
- **Steps:**
  1. **Keyword coverage:** the profile gets `keywords: [...]`, taken from the job ad or internship plan. The build reports which keywords appear in the CV and which do not, so you can decide whether to add them.
  2. **Page limit:** the profile gets `max_pages: N`. After `--pdf`, the build counts the PDF pages and fails if there are too many.
  3. **Placeholder scan:** a warning for `[...]`, `TODO`, `TBD` or `?` left in any text.
- **Files:** `cvgen/checks.py` (new, pure functions), `build.py` (prints the report and fails on `--strict`), `tests/test_cvgen.py`.
- **Success:** `python cv/build.py haendle-2027 --pdf` prints the keyword coverage, shows the page count, and exits non-zero when the PDF is over the limit.

## Phase 4 — Application folder 🟢 (needs the owner's go-ahead)
- **Goal:** keep everything for one application together: the motivation letter you already have, the CV, the transcript and the certificates.
- **Steps:** add `showcase-private/applications/<job>/` holding the motivation letter (your file, unchanged), `notes.md` (contact, deadline, what was sent and when) and a `send/` list of attachments in order. A `build.py <job> --pack` command copies the CV PDF and the listed attachments into one folder (or one merged PDF) ready to email or upload.
- **Needs from you:** the motivation letter file, and which documents HÄNDLE or the visa office want in which order.
- **Success:** one command gives the exact set of files to send.

## Phase 5 — More formats for other jobs 🟢 (when a second job appears)
- **German CV (Lebenslauf):** profile `lang: de` switches the section titles and labels (Persönliche Daten, Ausbildung, Praktische Erfahrung, Verfügbar ab, Ort/Datum/Unterschrift). Content can carry optional `text_de` and `bullets_de`; the build falls back to English and warns when they are missing.
- **One-page variant:** profile `compact: true` uses smaller spacing and a limit on bullets per item, for career fairs and companies outside Germany.
- **No-photo / no-birth-date variant:** this already works with `show:`. It is for UK, US and Ireland applications, where a photo and birth date are not expected.
- **Second visual template:** a modern single-column layout, chosen by profile `template:`. Only if a job needs a different look.

## Phase 6 — Convenience ⏸
- `build.py --new <job> --from haendle-2027` copies a profile to start a new application.
- `applications.yaml` tracker (company, role, date sent, status, profile, CV file). Add it only if you start applying to several places at once.
- LinkedIn sync: once the LinkedIn data export (or Chrome access) is available, pull posts and skills into `showcase-private/linkedin/` and tag anything worth using in `master.yaml`.

---

## Not planned (and why)
- **Cover-letter generator:** you already write your own motivation letters. Phase 4 only stores them next to the CV.
- **AI-written text in the build:** the CV text stays in `master.yaml`, where you can read and correct it. The build only selects and lays it out.
- **Europass format:** not asked for by HÄNDLE or the visa checklist.
