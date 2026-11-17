(function () {
  // Results come from docs/results/phaseB_retune.csv (seeds 1100-1129), neighbour-aware at its layout setting
  // against the fixed plan tuned for each demand level. Delays are mean queueing seconds per vehicle.
  var DATA = [
    { id: "corridor", name: "Corridor", note: "Three junctions in a row, 300 m links, no spillback.",
      rows: [["x0.5", 17.9, 13.9, 11.0, 11.0], ["x1.0", 23.5, 20.0, 16.7, 16.6], ["x1.4", 31.7, 27.4, 25.2, 25.3], ["x1.8", 46.9, 44.5, 43.9, 43.4], ["x2.2", 113.5, 116.0, 127.0, 112.7]],
      remark: "Responding to traffic wins by about 7 s up to x1.4. The gap shrinks to 3 to 4 s at x1.8 and is gone at x2.2 (within noise). An earlier claim of a win at x2.2 came from a search edge and was withdrawn." },
    { id: "short", name: "Short links", note: "The same corridor with 100 m links, spillback, and entrance roads that refuse vehicles when full.",
      rows: [["x0.5", 15.9, 13.8, 11.1, 11.1], ["x1.0", 20.3, 20.5, 17.2, 17.2], ["x1.4", 27.1, 27.8, 25.6, 24.9], ["x1.8", 42.3, 59.0, 59.1, 46.2], ["x2.2", 92.5, 110.4, 109.3, 85.9]],
      remark: "Wins below saturation. At x1.8 a well-tuned fixed plan is better, and only neighbour-aware avoids a collapse. At x2.2 neighbour-aware shows a lower delay but turns away 392 vehicles an hour against 142; counting each at 600 s it is 21 s worse." },
    { id: "grid", name: "2x2 grid", note: "Four junctions in a square joined by two-way 150 m links, with spillback and a limited entrance. Traffic can circle.",
      rows: [["x0.5", 21.6, 17.0, 13.9, 14.4], ["x1.0", 27.9, 23.8, 21.3, 20.7], ["x1.4", 34.4, 33.4, 33.3, 30.4], ["x1.8", 50.2, 53.5, 53.1, 52.9], ["x2.2", 946.7, 272.5, 326.5, 129.3]],
      remark: "Neighbour-aware wins by 7 s below x1.4 and 4 s at x1.4, and is 3 s behind at x1.8. At x2.2 the best fixed plan gridlocks (947 s, about 4,300 vehicles an hour refused) while neighbour-aware holds at 129 s." }
  ];
  var MAXPCT = 85;
  var tabs = document.getElementById("tabs"), note = document.getElementById("note"),
      bars = document.getElementById("bars"), rowsEl = document.getElementById("rows"), axis = document.getElementById("axis");
  var buttons = [];

  function pct(r) { return (r[4] - r[1]) / r[1] * 100; }
  function fmt(n) { return n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : n.toFixed(1); }
  function cell(v, base) { var cls = v < base - 0.05 ? "win" : (v > base + 0.05 ? "lose" : ""); return '<td class="' + cls + '">' + fmt(v) + "</td>"; }

  function show(i) {
    var d = DATA[i];
    buttons.forEach(function (b, j) { b.setAttribute("aria-pressed", j === i ? "true" : "false"); });
    note.textContent = d.note + " " + d.remark;
    var zero = 50;
    bars.innerHTML = d.rows.map(function (r) {
      var p = pct(r), w = Math.min(Math.abs(p), MAXPCT) / MAXPCT * 50, worse = p > 0;
      var left = worse ? zero : zero - w;
      var sign = p > 0 ? "+" : "";
      return '<div class="bar-row"><span class="d">' + r[0] + '</span><div class="bar-track" style="--zero:' + zero + '%"><div class="bar' + (worse ? " worse" : "") +
        '" style="left:' + left + "%;width:" + w + '%"></div></div><span class="v">' + sign + Math.round(p) + "%</span></div>";
    }).join("");
    axis.innerHTML = "<span>-" + MAXPCT + "%</span><span>same as fixed</span><span>+" + MAXPCT + "%</span>";
    rowsEl.innerHTML = d.rows.map(function (r) {
      return "<tr><td>" + r[0] + "</td><td>" + fmt(r[1]) + "</td>" + cell(r[2], r[1]) + cell(r[3], r[1]) + cell(r[4], r[1]) + "</tr>";
    }).join("");
  }

  DATA.forEach(function (d, i) {
    var b = document.createElement("button");
    b.type = "button"; b.id = "tab-" + d.id; b.textContent = d.name; b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () { show(i); });
    tabs.appendChild(b); buttons.push(b);
  });
  show(0);
})();

(function () {
  var NS = "http://www.w3.org/2000/svg";
  var SERIES = [
    { key: "fixed", name: "Fixed, tuned", color: "var(--text)", dash: "6 5" },
    { key: "act", name: "Queue-actuated", color: "var(--bar-neutral)" },
    { key: "arr", name: "Arrival-aware", color: "var(--accent)" },
    { key: "nb", name: "Neighbour-aware", color: "var(--ok)" }
  ];
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function swatches(id, list) {
    document.getElementById(id).innerHTML = list.map(function (s) {
      return '<span><i style="background:' + s.color + '"></i>' + s.name + "</span>";
    }).join("");
  }
  // cats: x labels; series: [{name, color, dash, values}]; opts: {log, min, max, ticks, fmt}
  function lineChart(host, cats, series, opts) {
    var W = 460, H = 280, L = 46, Rr = 16, T = 14, B = 34;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, "class": "chart", role: "img", "aria-label": opts.label });
    function y(v) {
      var lo = opts.log ? Math.log(opts.min) : opts.min, hi = opts.log ? Math.log(opts.max) : opts.max;
      var p = ((opts.log ? Math.log(Math.max(v, opts.min)) : v) - lo) / (hi - lo);
      return T + (1 - p) * (H - T - B);
    }
    function x(i) { return L + (cats.length === 1 ? 0 : i / (cats.length - 1)) * (W - L - Rr); }
    opts.ticks.forEach(function (tv) {
      el("line", { x1: L, x2: W - Rr, y1: y(tv), y2: y(tv), "class": "grid" }, svg);
      var tx = el("text", { x: L - 6, y: y(tv) + 4, "text-anchor": "end" }, svg); tx.textContent = tv;
    });
    el("line", { x1: L, x2: L, y1: T, y2: H - B, "class": "axis-line" }, svg);
    el("line", { x1: L, x2: W - Rr, y1: H - B, y2: H - B, "class": "axis-line" }, svg);
    cats.forEach(function (c, i) {
      var tx = el("text", { x: x(i), y: H - B + 18, "text-anchor": "middle" }, svg); tx.textContent = c;
    });
    series.forEach(function (s) {
      var pts = s.values.map(function (v, i) { return x(i) + "," + y(v); }).join(" ");
      var pl = el("polyline", { points: pts, "class": "ln", stroke: s.color }, svg);
      if (s.dash) pl.setAttribute("stroke-dasharray", s.dash);
      s.values.forEach(function (v, i) {
        var c = el("circle", { cx: x(i), cy: y(v), r: 3.5, fill: s.color, "class": "dot" }, svg);
        var tt = el("title", {}, c); tt.textContent = s.name + ", " + cats[i] + ": " + v;
      });
    });
    var ylab = el("text", { x: 4, y: 10 }, svg); ylab.textContent = opts.ylabel;
    host.innerHTML = ""; host.appendChild(svg);
  }

  // 1. delay against demand, per layout (phaseB_retune.csv, seeds 1100-1129)
  var LAYOUTS = {
    corridor: { fixed: [17.9, 23.5, 31.7, 46.9, 113.5], act: [13.9, 20.0, 27.4, 44.5, 116.0], arr: [11.0, 16.7, 25.2, 43.9, 127.0], nb: [11.0, 16.6, 25.3, 43.4, 112.7] },
    short: { fixed: [15.9, 20.3, 27.1, 42.3, 92.5], act: [13.8, 20.5, 27.8, 59.0, 110.4], arr: [11.1, 17.2, 25.6, 59.1, 109.3], nb: [11.1, 17.2, 24.9, 46.2, 85.9] },
    grid: { fixed: [21.6, 27.9, 34.4, 50.2, 946.7], act: [17.0, 23.8, 33.4, 53.5, 272.5], arr: [13.9, 21.3, 33.3, 53.1, 326.5], nb: [14.4, 20.7, 30.4, 52.9, 129.3] }
  };
  var NAMES = { corridor: "Corridor", short: "Short links (spillback)", grid: "2x2 grid (spillback)" };
  var host = document.getElementById("chart-lines"), cap = document.getElementById("cap-lines");
  var picker = document.createElement("div"); picker.className = "tabs"; picker.style.margin = "0 0 8px";
  host.parentNode.insertBefore(picker, host);
  function drawLines(key) {
    cap.textContent = NAMES[key] + ". Mean queueing delay in seconds, log scale, 30 fresh seeds. The highest points are gridlocked networks, and on short links and the grid the delay hides refused vehicles (see the remarks above).";
    lineChart(host, ["x0.5", "x1.0", "x1.4", "x1.8", "x2.2"], SERIES.map(function (s) {
      return { name: s.name, color: s.color, dash: s.dash, values: LAYOUTS[key][s.key] };
    }), { log: true, min: 8, max: 1200, ticks: [10, 30, 100, 300, 1000], ylabel: "seconds", label: "Delay against demand, " + NAMES[key] });
    Array.prototype.forEach.call(picker.children, function (b) { b.setAttribute("aria-pressed", b.dataset.k === key ? "true" : "false"); });
  }
  Object.keys(LAYOUTS).forEach(function (k) {
    var b = document.createElement("button"); b.type = "button"; b.dataset.k = k; b.id = "lines-" + k; b.textContent = NAMES[k].split(" (")[0];
    b.addEventListener("click", function () { drawLines(k); }); picker.appendChild(b);
  });
  swatches("sw-lines", SERIES);
  drawLines("corridor");

  // 2. entrance queue growth (scripts/diagnose_spillback.py output)
  var QS = [
    { name: "Fixed", color: "var(--text)", dash: "6 5", values: [13, 28, 20, 24, 34] },
    { name: "Queue-actuated", color: "var(--bar-neutral)", values: [15, 41, 47, 38, 58] },
    { name: "Neighbour-aware", color: "var(--ok)", values: [2, 10, 11, 8, 10] }
  ];
  lineChart(document.getElementById("chart-queue"), ["600 s", "1200 s", "1800 s", "2400 s", "3000 s"], QS,
    { min: 0, max: 60, ticks: [0, 20, 40, 60], ylabel: "vehicles queued", label: "Entrance queue growth on short links" });
  swatches("sw-queue", QS);

  // 3. how the claim shrank (final_fair / retune results, corridor x1.8, seeds 400-429)
  var bars = [["Fixed plan tuned at normal demand", 81.8, "var(--bad)"], ["Fixed plan tuned for this demand", 45.8, "var(--bar-neutral)"], ["Arrival-aware controller", 43.8, "var(--ok)"]];
  var W = 460, H = 200, svg = el("svg", { viewBox: "0 0 " + W + " " + H, "class": "chart", role: "img", "aria-label": "Corridor delay at 1.8 times demand for three controllers" });
  bars.forEach(function (b, i) {
    var y0 = 12 + i * 60, w = (b[1] / 90) * (W - 24);
    var lab = el("text", { x: 4, y: y0 + 10 }, svg); lab.textContent = b[0];
    el("rect", { x: 4, y: y0 + 16, width: w, height: 26, fill: b[2] }, svg);
    var v = el("text", { x: 4 + w + 6, y: y0 + 35, "class": "endlabel" }, svg); v.textContent = b[1].toFixed(1) + " s";
  });
  document.getElementById("chart-claim").appendChild(svg);
})();
