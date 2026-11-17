"""Pre-deploy checks for the published site. Run from the repo root: python tools/check_site.py
Exit code 1 if anything fails. Used by .github/workflows/check.yml and by hand before a PR."""
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
PUBLISHED = ["index.html", "about.html", "assets", "projects"]
MAX_MB = 50
FORBIDDEN = ["showcase-private", "PERSONAL-DETAILS", ".env"]
REF = re.compile(r'(?:href|src)\s*=\s*["\']([^"\']+)["\']', re.I)
errors = []


def published_files():
    for name in PUBLISHED:
        p = ROOT / name
        if p.is_file():
            yield p
        elif p.is_dir():
            yield from (f for f in p.rglob("*") if f.is_file())
        else:
            errors.append(f"missing published path: {name}")


files = list(published_files())

# 1. size limit
for f in files:
    mb = f.stat().st_size / 1_048_576
    if mb > MAX_MB:
        errors.append(f"{f.relative_to(ROOT)} is {mb:.0f} MB (limit {MAX_MB} MB)")

# 2. private material must not be tracked
tracked = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True).stdout.splitlines()
for t in tracked:
    if any(t == s or t.startswith(s + "/") or t.endswith("/" + s) for s in FORBIDDEN):
        errors.append(f"private path is tracked by git: {t}")

# 3. internal links and images resolve
for f in files:
    if f.suffix.lower() != ".html":
        continue
    text = f.read_text(encoding="utf-8", errors="replace")
    refs = []
    for tag in TAG.findall(text):
        if "opt-img" in tag:  # optional image: page shows a fallback if the file is absent
            continue
        refs += REF.findall(tag)
    for ref in refs:
        if re.match(r"^(https?:|mailto:|tel:|data:|javascript:|#|//)", ref) or "{" in ref:
            continue
        path = unquote(ref.split("#")[0].split("?")[0])
        if not path:
            continue
        if path.startswith("/"):
            errors.append(f"{f.relative_to(ROOT)}: root-absolute link breaks under /SHOW-CASE/: {ref}")
            continue
        target = (f.parent / path).resolve()
        if target.is_dir():
            target = target / "index.html"
        if not target.exists():
            errors.append(f"{f.relative_to(ROOT)}: broken link {ref}")

print(f"checked {len(files)} published files")
if errors:
    print(f"{len(errors)} problem(s):")
    for e in errors:
        print("  -", e)
    sys.exit(1)
print("all checks passed")
