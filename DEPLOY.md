# Deploying the showcase (GitHub Pages)

Live URL: https://kl-mithunvel.github.io/SHOW-CASE/ — static site, no build step.

## Branches
- `main` — development. All commits happen here.
- `prod` — deployment only. Never commit to it directly; it changes only by merging a PR from `main`. A push to `prod` runs `.github/workflows/deploy.yml`.
- `machine-vision` — personal copy, never merged (see `.CLAUDE/CLAUDE.md`).

## What gets published
Only `index.html`, `about.html` (a redirect to `index.html#about`; the profile section now lives in `index.html`), `assets/` and `projects/` (copied into `_site/` by the deploy workflow). `design-lab/`, `tools/`, `.CLAUDE/`, docs and `TODO.md` stay out. `showcase-private/` is gitignored and never leaves the machine.
`assets/js/site.js` loads `design-lab/` icons only if a non-classic icon style is set. The default is `classic`, which lives in `assets/img/pixel/`. If you ever change the default, move that icon set into `assets/` first.

## Release procedure
1. Build and commit on `main`.
2. Test locally: open the pages via `file://`; check light and dark themes and the console.
3. `python tools/check_site.py` (link, size and private-file checks). Fix anything it reports.
4. Push `main`. The `check` workflow runs the same script.
5. Open a PR: base `prod`, compare `main`. Review the diff.
6. The `check` job must pass. Merge with a **merge commit** (not squash or rebase, so the branches do not drift apart).
7. The `deploy` workflow publishes. Open the live URL and look at the changed pages.
8. Tag the release if the version changed: `git tag v<VERSION>` on `prod`, then push the tag.

## Rollback
Open a PR on `prod` that reverts the merge commit (`git revert -m 1 <merge>` on a branch off `prod`), merge it, and the deploy re-runs. Or re-run an earlier successful `deploy` run from the Actions tab.

## One-time GitHub setup (repo Settings)
1. Pages → Build and deployment → Source: **GitHub Actions**.
2. Branches → add a rule for `prod`: require a pull request; require status check `check`; block force pushes and deletions.
3. Environments → `github-pages` → deployment branches: `prod` only.
