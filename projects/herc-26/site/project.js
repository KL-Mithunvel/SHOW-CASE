(function () {
  /* ---------- status frame decoder ---------- */
  var mvNames = ["STOP", "FWD", "BACK", "LEFT", "RIGHT"];
  var hex = function (n) { return (n < 16 ? "0" : "") + n.toString(16).toUpperCase(); };
  var $ = function (id) { return document.getElementById(id); };
  function renderFrame() {
    var mv = Number(document.querySelector('input[name="mv"]:checked').value);
    var f = [
      { v: 0xAA, n: "sync 1", cls: "sync" }, { v: 0x55, n: "sync 2", cls: "sync" },
      { v: $("f-water").checked ? 1 : 0, n: "tool water" }, { v: $("f-air").checked ? 1 : 0, n: "tool air" },
      { v: $("f-soil").checked ? 1 : 0, n: "tool soil" }, { v: $("f-ibus").checked ? 1 : 0, n: "RC signal" },
      { v: mv, n: "movement", sub: mvNames[mv] }, { v: $("f-pump").checked ? 1 : 0, n: "pump" },
      { v: $("f-fail").checked ? 1 : 0, n: "failsafe", alarm: true }
    ];
    $("bytes").innerHTML = f.map(function (b, i) {
      var cls = "byte" + (b.cls ? " " + b.cls : "") + (!b.cls && b.v ? (b.alarm ? " alarm" : " on") : "");
      return '<div class="' + cls + '"><small>byte ' + i + '</small><b>' + hex(b.v) + '</b><i>' + b.n + (b.sub ? " · " + b.sub : "") + '</i></div>';
    }).join("");
    var fs = $("f-fail").checked;
    $("frame-note").textContent = fs
      ? "Failsafe set: the Mega has lost the RC signal for 500 ms and stopped every output."
      : "9 bytes, pushed every 100 ms at 115200 baud.";
  }
  document.querySelectorAll(".dec input").forEach(function (el) { el.addEventListener("change", renderFrame); });
  renderFrame();

  /* ---------- validation timers (same rules as the Pi's validation module) ---------- */
  var RULES = { air: { wait: 0, stab: 0, n: 15 }, soil: { wait: 10, stab: 0, n: 15 }, water: { wait: 65, stab: 30, n: 15 } };
  var tool = "water", speed = 20, timer = null, st = null;
  function fmt(s) { return (Math.round(s * 10) / 10) + " s"; }
  function track() {
    var r = RULES[tool], total = r.wait + r.stab + r.n, segs = [];
    if (r.wait) segs.push('<div class="seg wait" style="flex:' + r.wait + '">waiting ' + r.wait + ' s</div>');
    if (r.stab) segs.push('<div class="seg stab" style="flex:' + r.stab + '">settling ' + r.stab + ' s</div>');
    segs.push('<div class="seg valid" style="flex:' + r.n + '">' + r.n + ' reads</div>');
    $("v-track").innerHTML = segs.join("") + '<div class="needle" id="v-needle"></div>';
    return total;
  }
  function pill(p) {
    var map = { off: "off", waiting: "wait", stabilizing: "stab", valid_window: "valid", done: "done" };
    var label = { off: "off", waiting: "waiting", stabilizing: "stabilizing", valid_window: "valid window", done: "done" };
    return '<span class="pill ' + map[p] + '">' + label[p] + '</span>';
  }
  function draw() {
    var r = RULES[tool], total = r.wait + r.stab + r.n;
    var on = st ? st.on : 0;
    var pos = Math.min(on, total) / total * 100;
    var nd = $("v-needle"); if (nd) nd.style.left = "calc(" + pos + "% - 1px)";
    $("v-phase").innerHTML = pill(st ? st.phase : "off");
    $("v-on").textContent = fmt(on);
    $("v-left").textContent = st ? st.left : 0;
    $("v-ok").textContent = st ? st.ok : 0;
  }
  function tick(failRead) {
    var r = RULES[tool];
    st.on += 1; // one poll per second, as shipped in config.xml
    if (st.on < r.wait) { st.phase = "waiting"; return; }
    if (st.on < r.wait + r.stab) { st.phase = "stabilizing"; return; }
    if (!st.started) { st.started = true; st.left = r.n; }
    if (st.left > 0 && failRead) { st.phase = "valid_window"; return; }
    if (st.left > 0) { st.left -= 1; st.ok += 1; st.phase = "valid_window"; return; }
    st.phase = "done";
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } st = null; $("v-go").textContent = "Switch tool on"; $("v-err").disabled = true; draw(); }
  function start() {
    st = { on: 0, phase: "off", left: 0, ok: 0, started: false, doneNext: false, pendingFail: false };
    $("v-go").textContent = "Switch tool off"; $("v-err").disabled = false;
    timer = setInterval(function () {
      var f = st.pendingFail; st.pendingFail = false;
      tick(f);
      if (st.phase === "done") { clearInterval(timer); timer = null; $("v-err").disabled = true; $("v-go").textContent = "Reset"; }
      draw();
    }, 1000 / speed);
    draw();
  }
  $("v-go").addEventListener("click", function () { if (timer || st) stop(); else start(); });
  $("v-err").addEventListener("click", function () { if (st) st.pendingFail = true; });
  document.querySelectorAll("[data-tool]").forEach(function (b) {
    b.addEventListener("click", function () {
      tool = b.dataset.tool;
      document.querySelectorAll("[data-tool]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      stop(); track(); draw();
    });
  });
  document.querySelectorAll("[data-speed]").forEach(function (b) {
    b.addEventListener("click", function () {
      speed = Number(b.dataset.speed);
      document.querySelectorAll("[data-speed]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      if (st) { stop(); start(); }
    });
  });
  track(); draw();
})();
