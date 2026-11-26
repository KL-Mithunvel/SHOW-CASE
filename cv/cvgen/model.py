"""Pure logic: turn master data + a job profile into a render context.

No file writing here. Both renderers (docx, html) take the same context, so the
two outputs always carry the same content.

Selection rules for list sections (education, experience, projects, skills,
certificates, activities):
  1. If the profile lists `select.<section>.only: [ids]`, exactly those items are
     used, in that order. An unknown id is an error (catches typos).
  2. Otherwise an item is kept when it has no tags, or when it shares a tag with
     the profile's `include_tags`. An empty `include_tags` keeps everything.
  3. `select.<section>.exclude: [ids]` drops items; `select.<section>.limit: N`
     keeps the first N.
Bullets inside an item follow rule 2 too; a bullet may be a plain string
(always kept) or {text, tags}.
"""
from __future__ import annotations

import datetime as _dt
from pathlib import Path

import yaml


class CVError(Exception):
    """Bad or missing data/profile. The message says what to fix."""


SECTION_TITLES = {
    "personal": "Personal details",
    "profile": "Profile",
    "education": "Education",
    "experience": "Practical experience",
    "projects": "Selected projects",
    "skills": "Technical skills",
    "certificates": "Certificates",
    "languages": "Languages",
    "activities": "Activities & awards",
}
LIST_SECTIONS = {"education", "experience", "projects", "skills", "certificates", "activities"}
PERSON_REQUIRED = ("name", "email")
# (label shown, person field). Order = order in the CV header.
CONTACT_FIELDS = (("E-mail", "email"), ("Phone", "phone"), ("LinkedIn", "linkedin"),
                  ("GitHub", "github"), ("Portfolio", "portfolio"))


def _contact_url(field: str, value: str) -> str | None:
    """Link target for a contact entry; None for entries that are not links (phone)."""
    if field == "email":
        return f"mailto:{value}"
    if field in ("linkedin", "github", "portfolio"):
        return value if value.startswith("http") else f"https://{value}"
    return None


def load_yaml(path: Path) -> dict:
    if not path.is_file():
        raise CVError(f"file not found: {path}")
    with path.open(encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    if not isinstance(data, dict):
        raise CVError(f"{path} must contain a YAML mapping at the top level")
    return data


def list_profiles(data_dir: Path) -> list[str]:
    return sorted(p.stem for p in (data_dir / "profiles").glob("*.yaml"))


def load_profile(data_dir: Path, name: str) -> dict:
    path = data_dir / "profiles" / f"{name}.yaml"
    if not path.is_file():
        known = ", ".join(list_profiles(data_dir)) or "none"
        raise CVError(f"profile '{name}' not found in {path.parent} (available: {known})")
    return load_yaml(path)


# ---------- selection ----------

def _tags(obj) -> set[str]:
    return set(obj.get("tags") or []) if isinstance(obj, dict) else set()


def _tag_match(obj, include: set[str]) -> bool:
    tags = _tags(obj)
    return not include or not tags or bool(tags & include)


def select_items(items: list[dict], section: str, include: set[str], rules: dict | None) -> list[dict]:
    rules = rules or {}
    if rules.get("only"):
        by_id = {it.get("id"): it for it in items}
        missing = [i for i in rules["only"] if i not in by_id]
        if missing:
            raise CVError(f"{section}: unknown id(s) in 'only': {', '.join(missing)}")
        chosen = [by_id[i] for i in rules["only"]]
    else:
        chosen = [it for it in items if _tag_match(it, include)]
    exclude = set(rules.get("exclude") or [])
    chosen = [it for it in chosen if it.get("id") not in exclude]
    limit = rules.get("limit")
    if limit is not None:
        chosen = chosen[: int(limit)]
    return chosen


def _bullets(raw, include: set[str]) -> list[str]:
    out = []
    for b in raw or []:
        if isinstance(b, str):
            out.append(b)
        elif _tag_match(b, include):
            out.append(b["text"])
    return out


def _when(item: dict) -> str:
    if item.get("when"):
        return str(item["when"])
    start, end = item.get("start"), item.get("end")
    if start and end:
        return f"{start} – {end}"
    return str(start or end or "")


# ---------- context ----------

def _timeline(items, include):
    return [
        {
            "when": _when(it),
            "title": it.get("title", ""),
            "org": it.get("org", ""),
            "note": it.get("note", ""),
            "bullets": _bullets(it.get("bullets"), include),
            "label": (it.get("label") or ""),
        }
        for it in items
    ]


def _dated(items):
    return [{"when": _when(it), "text": it.get("text", ""), "org": it.get("org", "")} for it in items]


def build_context(master: dict, profile: dict, *, public: bool = False,
                  redact: list[str] | None = None, today: _dt.date | None = None,
                  date_format: str = "%d.%m.%Y") -> dict:
    person = dict(master.get("person") or {})
    for key in PERSON_REQUIRED:
        if not person.get(key):
            raise CVError(f"master.yaml: person.{key} is required")
    if public:
        for key in redact or []:
            person.pop(key, None)

    include = set(profile.get("include_tags") or [])
    select = profile.get("select") or {}
    titles = {**SECTION_TITLES, **(profile.get("titles") or {})}
    show = profile.get("show") or {}

    sections = []
    for key in profile.get("sections") or list(SECTION_TITLES):
        if key not in SECTION_TITLES:
            raise CVError(f"profile: unknown section '{key}' (known: {', '.join(SECTION_TITLES)})")
        sec = {"key": key, "title": titles[key], "page_break_before": key in (profile.get("page_break_before") or [])}
        if key == "personal":
            rows = []
            dob = person.get("dob") if show.get("dob", True) else None
            pob = person.get("pob") if show.get("pob", True) else None
            if dob and pob:
                rows.append({"label": "Born", "value": f"{dob} in {pob}"})
            elif dob or pob:
                rows.append({"label": "Date of birth" if dob else "Place of birth", "value": str(dob or pob)})
            for label, field in (("Nationality", "nationality"), ("Address", "address")):
                if person.get(field) and show.get(field, True):
                    rows.append({"label": label, "value": str(person[field])})
            if profile.get("availability"):
                rows.append({"label": "Available", "value": profile["availability"]})
            sec.update(kind="kv", rows=rows)
        elif key == "profile":
            sec.update(kind="text", text=(profile.get("summary") or master.get("summary") or "").strip())
        elif key == "languages":
            sec.update(kind="languages", rows=[
                {"name": l["name"], "level": l.get("level", "")} for l in master.get("languages") or []])
        else:
            chosen = select_items(master.get(key) or [], key, include, select.get(key))
            if key in ("education", "experience", "projects"):
                sec.update(kind="timeline", rows=_timeline(chosen, include))
            elif key == "skills":
                sec.update(kind="kv", rows=[{"label": s["group"], "value": ", ".join(s["items"])} for s in chosen])
            else:
                sec.update(kind="dated", rows=_dated(chosen))
        if sec.get("rows") or sec.get("text"):
            sections.append(sec)

    today = today or _dt.date.today()
    photo = person.get("photo") if show.get("photo", True) else None
    contact = [(label, person[f], _contact_url(f, str(person[f]))) for label, f in CONTACT_FIELDS
               if person.get(f) and show.get(f, True)]
    return {
        "person": person,
        "headline": profile.get("headline") or master.get("headline", ""),
        "contact": contact,
        "photo": photo,
        "sections": sections,
        "sign": {
            "place": profile.get("sign_place", ""),
            "date": today.strftime(date_format) if profile.get("sign_date", True) else "",
        },
        "public": public,
        "profile_title": profile.get("title", ""),
    }
