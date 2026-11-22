/* Tick: a small retro-cartoon alarm-clock mascot that tells visitors the project list is clickable.
   One file, no dependencies. It injects its own CSS and an inline SVG.

   Where it runs
     - index.html (the project list): rolls in, says every project is a link, and points at the entry under the cursor.
     - every project page (loaded by projects/_shared/base.js): says there are more projects, and takes you back to the list.

   What she does
     - rolls in from the right edge a moment after the page settles, then floats and now and then waves
     - eyes follow the cursor (or the last tap on a touch screen)
     - click: hops, spins, grows for a moment, then does what she said (landing: scrolls to the projects and flashes them;
       project page: goes back to the project list). Click her three times quickly and she gets a little mischievous.
     - the small x hides her for the rest of the visit (sessionStorage)
     - prefers-reduced-motion: no rolling, floating, hopping or spinning; the eyes still follow the cursor

   She is an original character in a retro 1930s-cartoon style, not a copy of any existing mascot. */
(function () {
  "use strict";
  if (window.__tick) return;
  window.__tick = true;

  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  try { if (sessionStorage.getItem("tick-off") === "1") return; } catch (e) { /* storage blocked: show her */ }

  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }

  ready(function () {
    var back = document.querySelector(".pbar .back");            // project pages have this link back to the list
    var list = document.getElementById("projects");              // the landing page has this section
    if (!back && !list) return;
    var onProject = !!back;
    var home = onProject ? back.getAttribute("href") + "#projects" : null;

    var SAY = onProject ? {
      hello: "Like this one? There are more projects to see.",
      click: "Off we go! Back to the list.",
      sly: "Three clicks? Hee hee. Go on, see the other projects."
    } : {
      hello: "Psst! Every project here is a link. Click one to see the whole story.",
      over: "That one! Click it to see the full project.",
      click: "Whee! Here they are. Pick any one.",
      sly: "Three clicks? Hee hee. Just click a project. You know you want to."
    };

    /* ---------- styles ---------- */
    var css = [
      ".tick{position:fixed;right:14px;bottom:12px;z-index:900;width:92px;height:116px;font:500 13px/1.35 'Inter',system-ui,sans-serif;color:var(--text,#1d1e24);-webkit-tap-highlight-color:transparent}",
      ".tick[hidden]{display:none}",
      "@media(max-width:600px){.tick{width:66px;height:84px;right:8px;bottom:8px}}",
      "@media print{.tick{display:none}}",
      ".tick-hop,.tick-bob,.tick-btn{display:block;width:100%;height:100%}",
      ".tick-btn{padding:0;margin:0;border:0;background:none;cursor:pointer;border-radius:50% 50% 30% 30%;filter:drop-shadow(0 6px 8px rgba(0,0,0,.22))}",
      ".tick-btn:focus-visible{outline:3px solid var(--accent,#0b7a6f);outline-offset:4px}",
      ".tick svg{display:block;width:100%;height:100%;overflow:visible}",
      /* bubble */
      ".tick-say{position:absolute;right:2px;bottom:calc(100% + 4px);width:max-content;max-width:min(220px,62vw);padding:.55rem .75rem;background:var(--bg,#fff);color:var(--text,#1d1e24);border:2px solid var(--text,#1d1e24);border-radius:14px;opacity:0;transform:translateY(6px) scale(.96);transform-origin:90% 100%;pointer-events:none;transition:opacity .25s ease,transform .3s cubic-bezier(.22,.7,.2,1)}",
      ".tick-say.show{opacity:1;transform:none}",
      ".tick-say:after{content:'';position:absolute;right:26px;bottom:-9px;width:14px;height:14px;background:var(--bg,#fff);border:solid var(--text,#1d1e24);border-width:0 2px 2px 0;transform:rotate(45deg)}",
      /* dismiss */
      ".tick-x{position:absolute;top:-4px;right:-4px;width:22px;height:22px;padding:0;border-radius:50%;border:1px solid var(--border,#e4e4ea);background:var(--bg,#fff);color:var(--muted,#5f6070);font:600 13px/1 system-ui,sans-serif;cursor:pointer;opacity:0;transition:opacity .2s}",
      ".tick:hover .tick-x,.tick-x:focus-visible{opacity:1}",
      "@media(hover:none){.tick-x{opacity:.8}}",
      /* character colours */
      ".t-rim{fill:#f6b73c;stroke:#2a1a10;stroke-width:2.2}",
      ".t-face{fill:#ff7a1c}",
      ".t-shine{fill:#ffa04d;opacity:.8}",
      ".t-tick{stroke:#2a1a10;stroke-width:2;stroke-linecap:round}",
      ".t-line{fill:none;stroke:#2a1a10;stroke-linecap:round;stroke-linejoin:round}",
      ".t-hand{stroke:#2a1a10;stroke-linecap:round}",
      ".t-white{fill:#fff;stroke:#2a1a10;stroke-width:1.8}",
      ".t-halo{stroke:#fff;opacity:.85}",
      ".t-shoe{fill:#2a1a10;stroke:#fff;stroke-width:1.6}",
      ".t-pupil{fill:#14100c}",
      ".t-nose{fill:#c24a0a}",
      ".t-mouth{fill:#fff;stroke:#2a1a10;stroke-width:2.4;stroke-linejoin:round}",
      ".t-tongue{fill:#e8533d}",
      ".t-cheek{fill:#ff5a2a;opacity:.55}",
      ".t-joy,.t-smirk{display:none}",
      ".tick.joy .t-eye,.tick.joy .t-smile{display:none}.tick.joy .t-joy{display:inline}",
      ".tick.sly .t-smile{display:none}.tick.sly .t-smirk{display:inline}",
      ".tick.sly .t-pupil{transform:scale(.7)}",
      ".t-brow-l{transform-origin:46px 38px}.t-brow-r{transform-origin:74px 38px}",
      ".tick.sly .t-brow-l{transform:rotate(20deg) translateY(3px)}.tick.sly .t-brow-r{transform:rotate(-20deg) translateY(3px)}",
      ".t-hm{transform-origin:60px 62px}.t-hh{transform-origin:60px 62px}",
      ".t-arm-r{transform-origin:100px 68px}.t-leg-l{transform-origin:50px 106px}.t-leg-r{transform-origin:70px 106px}",
      /* lit entries on the landing page */
      ".tick-flash{animation:tick-flash 1.3s ease both;animation-delay:calc(var(--k,0) * 90ms)}",
      "@keyframes tick-flash{0%,100%{box-shadow:none}30%{box-shadow:0 0 0 3px var(--accent,#0b7a6f),0 0 22px color-mix(in srgb,var(--accent,#0b7a6f) 55%,transparent)}}",
      /* motion (everything below is skipped for reduced motion) */
      "@media(prefers-reduced-motion:no-preference){",
      ".tick.rolling{animation:tick-roll 1.9s cubic-bezier(.18,.75,.3,1) both}",
      "@keyframes tick-roll{0%{transform:translateX(calc(100vw + 120px)) rotate(-900deg)}78%{transform:translateX(-10px) rotate(14deg)}90%{transform:translateX(3px) rotate(-5deg)}100%{transform:none}}",
      ".tick.float .tick-bob{animation:tick-bob 2.6s ease-in-out infinite}",
      "@keyframes tick-bob{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-6px) rotate(1.5deg)}}",
      ".tick.float .t-arm-r{animation:tick-wave 6s ease-in-out 1.5s infinite}",
      "@keyframes tick-wave{0%,62%,100%{transform:none}68%{transform:rotate(-24deg)}74%{transform:rotate(12deg)}80%{transform:rotate(-24deg)}86%{transform:rotate(8deg)}92%{transform:none}}",
      ".tick.float .t-leg-l{animation:tick-leg 2.6s ease-in-out infinite}.tick.float .t-leg-r{animation:tick-leg 2.6s ease-in-out -1.3s infinite}",
      "@keyframes tick-leg{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}",
      ".t-hm{animation:tick-spin 12s steps(12) infinite}.t-hh{animation:tick-spin 144s steps(12) infinite}",
      "@keyframes tick-spin{to{transform:rotate(360deg)}}",
      ".tick-hop.go{animation:tick-hop .95s cubic-bezier(.3,.7,.3,1)}",
      "@keyframes tick-hop{0%{transform:none}18%{transform:translateY(7px) scale(1.12,.86)}50%{transform:translateY(-38px) rotate(190deg) scale(1.3)}78%{transform:translateY(0) rotate(360deg) scale(1.12,.92)}100%{transform:rotate(360deg)}}",
      ".tick-hop.go.sly{animation:tick-wobble .9s ease}",
      "@keyframes tick-wobble{0%,100%{transform:none}20%{transform:rotate(-9deg) scale(1.15)}40%{transform:rotate(8deg) scale(1.22)}60%{transform:rotate(-6deg) scale(1.15)}80%{transform:rotate(4deg) scale(1.08)}}",
      "}"
    ].join("\n");
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    /* ---------- character (original art, 120 x 150 box) ---------- */
    var ticks = "";
    for (var h = 0; h < 12; h++) {
      var a = h * Math.PI / 6, big = h % 3 === 0;
      var r1 = big ? 34 : 36, r2 = 40;
      ticks += '<line class="t-tick" x1="' + (60 + r1 * Math.sin(a)).toFixed(1) + '" y1="' + (62 - r1 * Math.cos(a)).toFixed(1) +
        '" x2="' + (60 + r2 * Math.sin(a)).toFixed(1) + '" y2="' + (62 - r2 * Math.cos(a)).toFixed(1) + '"/>';
    }
    var svg =
      '<svg viewBox="0 0 120 150" aria-hidden="true" focusable="false">' +
      /* legs and shoes */
      '<g class="t-leg-l"><path class="t-line t-halo" stroke-width="6.6" d="M50 106 C49 120 47 128 46 136"/><path class="t-line" stroke-width="3.4" d="M50 106 C49 120 47 128 46 136"/><ellipse class="t-shoe" cx="42" cy="140" rx="10" ry="5"/></g>' +
      '<g class="t-leg-r"><path class="t-line t-halo" stroke-width="6.6" d="M70 106 C71 120 73 128 74 136"/><path class="t-line" stroke-width="3.4" d="M70 106 C71 120 73 128 74 136"/><ellipse class="t-shoe" cx="78" cy="140" rx="10" ry="5"/></g>' +
      /* arms with white gloves */
      '<path class="t-line t-halo" stroke-width="6.6" d="M20 70 C6 72 3 86 9 96"/><path class="t-line" stroke-width="3.4" d="M20 70 C6 72 3 86 9 96"/><circle class="t-white" cx="9" cy="99" r="7"/>' +
      '<g class="t-arm-r"><path class="t-line t-halo" stroke-width="6.6" d="M100 68 C114 66 118 52 112 42"/><path class="t-line" stroke-width="3.4" d="M100 68 C114 66 118 52 112 42"/><circle class="t-white" cx="111" cy="38" r="7"/></g>' +
      /* body: gold rim, orange face */
      '<circle class="t-rim" cx="60" cy="62" r="50"/><circle class="t-face" cx="60" cy="62" r="42"/>' +
      '<path class="t-shine" d="M30 44 C34 30 46 22 60 21 C48 26 38 34 34 48 Z"/>' + ticks +
      /* clock hands at the centre */
      '<g class="t-hh"><line class="t-hand" stroke-width="3.6" x1="60" y1="62" x2="60" y2="50"/></g>' +
      '<g class="t-hm"><line class="t-hand" stroke-width="2.6" x1="60" y1="62" x2="60" y2="44"/></g>' +
      '<circle cx="60" cy="62" r="3" fill="#2a1a10"/>' +
      /* cheeks, nose */
      '<ellipse class="t-cheek" cx="33" cy="72" rx="6" ry="4"/><ellipse class="t-cheek" cx="87" cy="72" rx="6" ry="4"/>' +
      '<ellipse class="t-nose" cx="60" cy="68" rx="3.2" ry="2.4"/>' +
      /* eyebrows */
      '<path class="t-line t-brow-l" stroke-width="2" d="M36 38 Q46 31 55 37"/><path class="t-line t-brow-r" stroke-width="2" d="M65 37 Q74 31 84 38"/>' +
      /* eyes: whites and pupils (pupils follow the cursor) */
      '<g class="t-eye"><ellipse class="t-white t-eye-l" cx="45" cy="52" rx="11" ry="14"/><circle class="t-pupil t-p" cx="45" cy="54" r="6.2"/><circle cx="43" cy="50.5" r="1.9" fill="#fff"/></g>' +
      '<g class="t-eye"><ellipse class="t-white t-eye-r" cx="75" cy="52" rx="11" ry="14"/><circle class="t-pupil t-p" cx="75" cy="54" r="6.2"/><circle cx="73" cy="50.5" r="1.9" fill="#fff"/></g>' +
      /* happy eyes (shown while she is clicked) */
      '<g class="t-joy"><path class="t-line" stroke-width="3" d="M35 56 Q45 42 55 56"/><path class="t-line" stroke-width="3" d="M65 56 Q75 42 85 56"/></g>' +
      /* mouth: wide smile, and a smirk for the mischievous moment */
      '<g class="t-smile"><path class="t-mouth" d="M38 78 Q60 100 82 78 Q60 84 38 78 Z"/></g>' +
      '<g class="t-smirk"><path class="t-mouth" d="M38 80 Q58 96 84 74 Q62 84 38 80 Z"/><path class="t-line" stroke-width="2" d="M84 74 L88 70"/></g>' +
      '</svg>';

    /* ---------- elements ---------- */
    var root = document.createElement("div");
    root.className = "tick";
    root.hidden = true;
    root.innerHTML = '<div class="tick-say" aria-hidden="true"></div>' +
      '<div class="tick-hop"><div class="tick-bob"><button type="button" class="tick-btn">' + svg + '</button></div></div>' +
      '<button type="button" class="tick-x" aria-label="Hide the clock character">×</button>';
    document.body.appendChild(root);

    var say = root.querySelector(".tick-say"), hop = root.querySelector(".tick-hop"), btn = root.querySelector(".tick-btn");
    var pupils = root.querySelectorAll(".t-p"), eyes = [root.querySelector(".t-eye-l"), root.querySelector(".t-eye-r")];

    function label(text) { btn.setAttribute("aria-label", (onProject ? "Back to the project list. " : "Jump to the project list. ") + text); }
    var hideTimer = 0;
    function speak(text, ms) {
      say.textContent = text;
      label(text);
      say.classList.add("show");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { say.classList.remove("show"); }, ms || 6500);
    }
    function quiet() { clearTimeout(hideTimer); hideTimer = setTimeout(function () { say.classList.remove("show"); }, 700); }

    /* ---------- eyes follow the pointer ---------- */
    var px = null, py = null, queued = false;
    function look() {
      queued = false;
      for (var i = 0; i < 2; i++) {
        var r = eyes[i].getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = 0, dy = 0;
        if (px !== null) {
          var vx = px - cx, vy = py - cy, d = Math.sqrt(vx * vx + vy * vy) || 1, k = Math.min(d / 160, 1) * 5.2;
          dx = vx / d * k; dy = vy / d * k;
        }
        pupils[i].style.transform = "translate(" + dx.toFixed(2) + "px," + dy.toFixed(2) + "px)";
      }
    }
    function aim(x, y) { px = x; py = y; if (!queued) { queued = true; requestAnimationFrame(look); } }
    document.addEventListener("pointermove", function (e) { aim(e.clientX, e.clientY); }, { passive: true });
    document.addEventListener("pointerdown", function (e) { aim(e.clientX, e.clientY); }, { passive: true });
    document.documentElement.addEventListener("mouseleave", function () { px = null; if (!queued) { queued = true; requestAnimationFrame(look); } });

    /* blink now and then (squash the eye whites for a moment) */
    function blink() {
      for (var i = 0; i < 2; i++) { eyes[i].style.transform = "scaleY(.12)"; eyes[i].style.transformOrigin = "50% 50%"; eyes[i].style.transformBox = "fill-box"; }
      for (var j = 0; j < 2; j++) { pupils[j].style.opacity = "0"; }
      setTimeout(function () {
        for (var i = 0; i < 2; i++) eyes[i].style.transform = "";
        for (var j = 0; j < 2; j++) pupils[j].style.opacity = "";
      }, 120);
    }
    (function blinkLoop() { setTimeout(function () { if (!root.hidden) blink(); blinkLoop(); }, 2600 + Math.random() * 3200); })();

    /* ---------- reactions ---------- */
    var clicks = [], moodTimer = 0;
    function mood(name, ms) {
      root.classList.remove("joy", "sly");
      if (name) root.classList.add(name);
      clearTimeout(moodTimer);
      if (name) moodTimer = setTimeout(function () { root.classList.remove("joy", "sly"); }, ms);
    }
    function jump(sly) {
      if (reduce) return;
      hop.classList.remove("go", "sly");
      void hop.offsetWidth;
      hop.classList.add("go");
      if (sly) hop.classList.add("sly");
    }
    btn.addEventListener("click", function () {
      var now = Date.now();
      clicks = clicks.filter(function (t) { return now - t < 2500; });
      clicks.push(now);
      if (clicks.length >= 3) {                        // clicked three times quickly: a little mischief
        clicks = [];
        mood("sly", 2200); jump(true); speak(SAY.sly, 4500);
        return;
      }
      mood("joy", 1100); jump(false); speak(SAY.click, 3500);
      if (onProject) {
        setTimeout(function () { location.href = home; }, reduce ? 150 : 900);
      } else {
        list.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        var entries = document.querySelectorAll("#projects .entry");
        Array.prototype.forEach.call(entries, function (el, i) {
          el.style.setProperty("--k", i);
          el.classList.remove("tick-flash"); void el.offsetWidth; el.classList.add("tick-flash");
          setTimeout(function () { el.classList.remove("tick-flash"); }, 2600);
        });
      }
    });
    root.querySelector(".tick-x").addEventListener("click", function () {
      root.hidden = true;
      try { sessionStorage.setItem("tick-off", "1"); } catch (e) { /* fine */ }
    });
    btn.addEventListener("mouseenter", function () { if (!say.classList.contains("show")) speak(SAY.hello, 4000); });
    btn.addEventListener("focus", function () { speak(SAY.hello, 4000); });

    /* landing page: point at the project entry under the cursor */
    if (!onProject) {
      var current = null;
      document.addEventListener("mouseover", function (e) {
        var entry = e.target.closest && e.target.closest("#projects .entry");
        if (entry === current) return;
        current = entry;
        if (entry) speak(SAY.over, 2600); else quiet();
      });
    }

    /* ---------- arrival ---------- */
    function arrive() {
      root.hidden = false;
      if (reduce) { speak(SAY.hello, 7000); return; }
      root.classList.add("rolling");
      setTimeout(function () { root.classList.remove("rolling"); root.classList.add("float"); speak(SAY.hello, 7500); }, 1900);
    }
    setTimeout(arrive, reduce ? 600 : 1300);
  });
})();
