(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- night shift ---------- */
  var JOBS = [
    { t: "00:00", name: "News watch: submit", lane: 0, d: "Every project's news topics, plus standalone topics, go out as one request to the Anthropic Message Batches API. Results are collected over the next hours." },
    { t: "00:05", name: "Materialise", lane: 1, d: "Deterministic, no AI. Seeds today's daily file from yesterday's open tasks, plans and recurring items; also rolls monthly and yearly plans." },
    { t: "02:00", name: "Re-index", lane: 2, d: "Full rebuild of the ChromaDB search index from the Markdown files." },
    { t: "03:15", name: "Backup", lane: 0, d: "Snapshot of the SQLite database." },
    { t: "03:30", name: "Offsite", lane: 1, d: "Pushes the notes' own Git repository offsite and copies a gzipped database snapshot." },
    { t: "03:45", name: "Retention", lane: 2, d: "Old alert and metric rows are archived to JSON and pushed offsite first, and only then deleted." },
    { t: "06:30", name: "Morning briefing", lane: 0, d: "Plans each project that has a target date (this week's goal, today's next step), writes the briefing from today's real task list and inbox, and emails the digest." },
    { t: "23:00", name: "Housekeeping", lane: 0, d: "Read-only checks for bad dates, missing front matter and stale project status; findings go to the inbox. Daily files older than a year are archived." }
  ];
  var clock = $("clock"), info = $("jobinfo");
  function pct(t) { var p = t.split(":"); return (+p[0] * 60 + +p[1]) / 1440 * 100; }
  [0, 3, 6, 9, 12, 15, 18, 21].forEach(function (h) {
    var l = document.createElement("div"); l.className = "hr"; l.style.left = h / 24 * 100 + "%"; clock.appendChild(l);
    var s = document.createElement("span"); s.className = "hl"; s.style.left = h / 24 * 100 + "%"; s.textContent = (h < 10 ? "0" : "") + h + ":00"; clock.appendChild(s);
  });
  var btns = JOBS.map(function (j, i) {
    var tick = document.createElement("div"); tick.className = "tick"; tick.style.left = pct(j.t) + "%"; tick.style.top = "0"; clock.appendChild(tick);
    var b = document.createElement("button");
    b.type = "button"; b.className = "job"; b.textContent = j.t;
    b.setAttribute("aria-label", j.t + " " + j.name);
    b.style.left = Math.min(Math.max(pct(j.t), 4), 96) + "%";
    b.style.top = (26 + j.lane * 28) + "px";
    b.addEventListener("click", function () { pick(i); });
    clock.appendChild(b);
    return b;
  });
  function pick(i) {
    btns.forEach(function (b, k) { b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
    var j = JOBS[i];
    info.innerHTML = "";
    var w = document.createElement("span"); w.className = "when"; w.textContent = j.t + " IST";
    var n = document.createElement("b"); n.textContent = j.name;
    var p = document.createElement("p"); p.textContent = j.d;
    info.append(w, n, p);
  }
  pick(6);

  /* ---------- edit demo ---------- */
  var FILE = "Personal/garden.md";
  var BEFORE = ["## Tasks", "- [ ] Order drip-irrigation kit", "- [ ] Repot the chillies", "- [ ] Repot the chillies"];
  var CASES = {
    ok: { path: FILE, search: "- [ ] Order drip-irrigation kit", replace: "- [ ] Order drip-irrigation kit due:2026-11-20", fileLines: BEFORE.slice(0, 3) },
    missing: { path: FILE, search: "- [ ] Order drip irrigation kit", replace: "- [ ] Order drip irrigation kit due:2026-11-20", fileLines: BEFORE.slice(0, 3) },
    twice: { path: FILE, search: "- [ ] Repot the chillies", replace: "- [x] Repot the chillies", fileLines: BEFORE },
    path: { path: "../../backend/secrets_app.py", search: "API_KEY =", replace: "API_KEY = 'x'", fileLines: null },
    secret: { path: FILE, search: "## Tasks", replace: "## Tasks\nGarden API key: " + ["sk", "ant", "api03"].join("-") + "-" + "x".repeat(24), /* built at runtime so no key-shaped string sits in the source */fileLines: BEFORE.slice(0, 3) }
  };
  var STEPS = [
    ["Parse", "One or more blocks, each with a file and a SEARCH/REPLACE pair."],
    ["Path", "Must stay inside the notes folder; no .., no absolute paths, never the db/ folder."],
    ["Match", "The SEARCH text must appear exactly once, character for character."],
    ["Secrets", "Added lines are scanned for API keys and private-key blocks."],
    ["Diff", "Stored as a pending AI event and shown to me as a diff."],
    ["Commit", "Applied under the Git lock and committed as author sleepy."]
  ];
  var cur = "ok", decided = null;
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function count(lines, needle) { return lines ? lines.filter(function (l) { return l === needle; }).length : 0; }
  function render() {
    var c = CASES[cur];
    $("block").innerHTML = '<span class="mk">```pma-edit</span>\nfile: ' + esc(c.path) + '\n<span class="mk">&lt;&lt;&lt;&lt;&lt;&lt;&lt; SEARCH</span>\n' + esc(c.search) +
      '\n<span class="mk">=======</span>\n' + esc(c.replace) + '\n<span class="mk">&gt;&gt;&gt;&gt;&gt;&gt;&gt; REPLACE</span>\n<span class="mk">```</span>';
    var fail = -1, why = "";
    if (c.path.indexOf("..") !== -1) { fail = 1; why = "Refused: the path leaves the notes folder. Nothing was read or written."; }
    else {
      var n = count(c.fileLines, c.search);
      if (n === 0) { fail = 2; why = "Refused: search text not found. The model has to quote the file exactly, so a guessed or reworded line cannot land in the wrong place."; }
      else if (n > 1) { fail = 2; why = "Refused: the search text matches " + n + " lines, so the edit is ambiguous. The model must include more context."; }
      else if (/sk-ant-|-----BEGIN/.test(c.replace)) { fail = 3; why = "Refused: an added line looks like an Anthropic API key. The error names the pattern, never the secret itself."; }
    }
    var after = null;
    if (c.fileLines && fail === -1) after = c.fileLines.map(function (l) { return l === c.search ? null : l; });
    if (!c.fileLines) $("file").textContent = "(outside the notes folder: never opened)";
    else if (after && decided !== "reject") {
      $("file").innerHTML = '<span class="cap">' + FILE + '</span>\n' + c.fileLines.map(function (l) {
        return l === c.search ? '<span class="del">- ' + esc(l) + '</span>\n<span class="add">+ ' + esc(c.replace) + '</span>' : "  " + esc(l);
      }).join("\n");
    } else $("file").innerHTML = '<span class="cap">' + FILE + '</span>\n' + c.fileLines.map(function (l) { return "  " + esc(l); }).join("\n");

    var html = STEPS.map(function (s, i) {
      var cls, lab;
      if (fail !== -1) { cls = i < fail ? "ok" : i === fail ? "bad" : ""; lab = i < fail ? "pass" : i === fail ? "stop" : "—"; }
      else if (i < 4) { cls = "ok"; lab = "pass"; }
      else if (i === 4) { cls = decided ? "ok" : "wait"; lab = decided ? "done" : "waiting"; }
      else { cls = decided === "confirm" ? "ok" : decided === "reject" ? "bad" : ""; lab = decided === "confirm" ? "done" : decided === "reject" ? "skipped" : "—"; }
      return '<li class="' + cls + '"><span class="st">' + lab + '</span><span><b>' + s[0] + '</b><small>' + s[1] + '</small></span></li>';
    }).join("");
    $("steps").innerHTML = html;
    var v = fail !== -1 ? why
      : decided === "confirm" ? "Committed to the notes' Git history as sleepy, and the audit row marked accepted."
      : decided === "reject" ? "Rejected. The file is untouched; the audit row records the rejection."
      : "All checks passed. The diff is waiting for me: nothing has changed on disk yet.";
    $("verdict").textContent = v;
    $("confirm").disabled = $("reject").disabled = fail !== -1 || !!decided;
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-case]"), function (b) {
    b.addEventListener("click", function () {
      cur = b.getAttribute("data-case"); decided = null;
      Array.prototype.forEach.call(document.querySelectorAll("[data-case]"), function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      render();
    });
  });
  $("confirm").addEventListener("click", function () { decided = "confirm"; render(); });
  $("reject").addEventListener("click", function () { decided = "reject"; render(); });
  render();

  /* ---------- commits per month ---------- */
  var M = [["May", 2], ["Jun", 12], ["Jul", 7], ["Aug", 2], ["Sep", 69], ["Oct", 20], ["Nov", 2]];
  var g = $("bars"), NS = "http://www.w3.org/2000/svg", step = 320 / M.length;
  M.forEach(function (m, i) {
    var h = m[1] / 25 * 60, x = 30 + i * step + 8, w = step - 16;
    var r = document.createElementNS(NS, "rect");
    r.setAttribute("class", "bar"); r.setAttribute("x", x); r.setAttribute("y", 190 - h); r.setAttribute("width", w); r.setAttribute("height", Math.max(h, 1)); r.setAttribute("rx", 2);
    var v = document.createElementNS(NS, "text");
    v.setAttribute("class", "val"); v.setAttribute("x", x + w / 2); v.setAttribute("y", 184 - h); v.setAttribute("text-anchor", "middle"); v.textContent = m[1];
    var l = document.createElementNS(NS, "text");
    l.setAttribute("class", "lab"); l.setAttribute("x", x + w / 2); l.setAttribute("y", 208); l.setAttribute("text-anchor", "middle"); l.textContent = m[0];
    g.append(r, v, l);
  });
})();
