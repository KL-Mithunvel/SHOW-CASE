/* Tick: a retro-cartoon alarm-clock mascot that tells visitors the projects are clickable, and has a bit of fun doing it.
   One file, no dependencies. It injects its own CSS and inline SVG. Original character in a 1930s-cartoon style.

   Where she runs
     - index.html (the project list): says every project is a link, points at the one under the cursor; click scrolls to them.
     - every project page (loaded by projects/_shared/base.js): says there are more projects; click goes back to the list.

   What she does
     - Entrance, once per page per visit (a short walk-in after that). Which one is set in SCENES below:
         crash    rolls in like a wheel, smashes a stack of boxes, sits dizzy, gets up
         car      drives in a yellow convertible, skids, hops out, the car drives off
         bull     rides in on a red cartoon bull that rears up and snorts, hops off, the bull trots away
         firebike rides in on a motorbike on fire, wheelie, hops off, the fire fizzles, the bike leaves
     - Then she floats about the whole screen like a hologram: glides along curved paths (bobbing, tilting, now and then
       spinning, rubber-hose arms and legs swinging), grows and shrinks as she goes, or switches off with a flicker and
       materialises somewhere else. She is page-aware: she scores spots by what is underneath and prefers empty space,
       leaves quickly if she is covering text, a picture or a control, moves on after a few seconds anyway, and keeps
       away from the cursor.
     - Eyes follow the cursor. Click: hop and spin, then do what she said. Three quick clicks: a little mischief.
     - Hover her and she stops to listen. The small x hides her for the visit (sessionStorage).
     - prefers-reduced-motion: no entrance and no wandering; she sits still in the corner.
     - Preview any entrance: add ?tick=crash (or car, bull, firebike) to the page address. */
(function () {
  "use strict";
  if (window.__tick) return;
  window.__tick = true;

  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var forced = (location.search.match(/[?&]tick=(crash|car|bull|firebike)/) || [])[1] || null;
  function store(kind, key, val) {
    try { var s = window[kind]; if (val === undefined) return s.getItem(key); s.setItem(key, val); } catch (e) { return null; }
    return null;
  }
  if (!forced && store("sessionStorage", "tkm-off") === "1") return;

  var SCENES = { landing: "crash", magnet: "firebike", ros: "car", tile: "bull", arm: "crash",
                 sleepy: "bull", herc: "firebike", enigma: "car", traffic: "car" };
  var QUIPS = {
    enigma: "Fun fact: an Enigma letter can never turn into itself.",
    magnet: "A magnet, sealed inside a print. Sneaky!",
    ros: "Robots! My favourite kind of clock.",
    tile: "Tap tap. That tile sounds fine to me.",
    arm: "Five kilos, ninety degrees. Show-off.",
    sleepy: "Even when sleeping, work gets done. Like me!",
    herc: "Six wheels? I only have two feet.",
    traffic: "Green means go. Go see more projects!"
  };

  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  ready(function () {
    var back = document.querySelector(".pbar .back");
    var list = document.getElementById("projects");
    if (!back && !list) return;
    var onProject = !!back;
    var home = onProject ? back.getAttribute("href") + "#projects" : null;
    var page = onProject ? (document.documentElement.getAttribute("data-project") || "project") : "landing";

    var SAY = onProject ? {
      hello: "Like this one? There are more projects to see.",
      click: "Off we go! Back to the list.",
      sly: "Three clicks? Hee hee. Go on, see the other projects.",
      chat: ["Psst. More projects that way!", "Tick tock! Time for another project?", "Click me and I'll take you to the others.",
             "I've read this whole page. Twice.", "Don't mind me, just walking."]
    } : {
      hello: "Psst! Every project here is a link. Click one to see the whole story.",
      over: "That one! Click it to see the full project.",
      click: "Whee! Here they are. Pick any one.",
      sly: "Three clicks? Hee hee. Just click a project. You know you want to.",
      chat: ["Every title down there is a link!", "Tick tock! Pick a project.", "Click me and I'll show you the projects.",
             "Don't mind me, just walking.", "I like the robot ones best. Shh."]
    };
    if (QUIPS[page]) SAY.chat.push(QUIPS[page]);

    /* ---------------------------------------------------------------- styles */
    var css = [
      ".tkm{position:fixed;left:0;top:0;z-index:900;width:92px;height:116px;font:500 13px/1.35 'Inter',system-ui,sans-serif;color:var(--text,#1d1e24);-webkit-tap-highlight-color:transparent;transform-origin:50% 100%}",
      ".tkm[hidden],.tkm-veh[hidden]{display:none}",
      ".tkm.walking{transition-property:transform;transition-timing-function:linear}",
      "@media(max-width:600px){.tkm{width:66px;height:84px}}",
      "@media print{.tkm,.tkm-veh,.tkm-prop{display:none}}",
      ".tkm-size,.tkm-holo,.tkm-lean,.tkm-hop,.tkm-bob,.tkm-btn{display:block;width:100%;height:100%}",
      ".tkm-size{transform-origin:50% 55%;transition:transform 1.1s cubic-bezier(.34,1.4,.5,1)}",
      ".tkm-holo{position:relative;transform-origin:50% 55%}",
      ".tkm.glide.go-l .tkm-lean{transform:rotate(-12deg)}.tkm.glide.go-r .tkm-lean{transform:rotate(12deg)}",
      ".tkm.say-b .tkm-say{bottom:auto;top:calc(100% + 4px);transform-origin:90% 0}.tkm.say-b .tkm-say:after{bottom:auto;top:-9px;border-width:2px 0 0 2px}",
      ".tkm.gone .tkm-holo{opacity:0}",
      ".tkm-lean{transition:transform .3s ease}",
      ".tkm.walking.go-l .tkm-lean{transform:rotate(-7deg)}.tkm.walking.go-r .tkm-lean{transform:rotate(7deg)}",
      ".tkm-btn{padding:0;margin:0;border:0;background:none;cursor:pointer;border-radius:50% 50% 30% 30%;filter:drop-shadow(0 6px 8px rgba(0,0,0,.22))}",
      ".tkm-btn:focus-visible{outline:3px solid var(--accent,#0b7a6f);outline-offset:4px}",
      ".tkm svg{display:block;width:100%;height:100%;overflow:visible}",
      /* bubble: above her, flips to the other side near the left edge */
      ".tkm-say{position:absolute;right:2px;bottom:calc(100% + 4px);width:max-content;max-width:min(220px,62vw);padding:.55rem .75rem;background:var(--bg,#fff);color:var(--text,#1d1e24);border:2px solid var(--text,#1d1e24);border-radius:14px;opacity:0;transform:translateY(6px) scale(.96);transform-origin:90% 100%;pointer-events:none;transition:opacity .25s ease,transform .3s cubic-bezier(.22,.7,.2,1)}",
      ".tkm-say.show{opacity:1;transform:none}",
      ".tkm-say:after{content:'';position:absolute;right:26px;bottom:-9px;width:14px;height:14px;background:var(--bg,#fff);border:solid var(--text,#1d1e24);border-width:0 2px 2px 0;transform:rotate(45deg)}",
      ".tkm.say-l .tkm-say{right:auto;left:2px;transform-origin:10% 100%}.tkm.say-l .tkm-say:after{right:auto;left:26px}",
      ".tkm-x{position:absolute;top:-4px;right:-4px;width:22px;height:22px;padding:0;border-radius:50%;border:1px solid var(--border,#e4e4ea);background:var(--bg,#fff);color:var(--muted,#5f6070);font:600 13px/1 system-ui,sans-serif;cursor:pointer;opacity:0;transition:opacity .2s}",
      ".tkm:hover .tkm-x,.tkm-x:focus-visible{opacity:1}",
      "@media(hover:none){.tkm-x{opacity:.8}}",
      ".tkm.seated .tkm-x,.tkm.ball .tkm-x{display:none}",
      /* character */
      ".t-rim{fill:#f6b73c;stroke:#2a1a10;stroke-width:2.2}.t-face{fill:#ff7a1c}.t-shine{fill:#ffa04d;opacity:.8}",
      ".t-tick{stroke:#2a1a10;stroke-width:2;stroke-linecap:round}",
      ".t-line{fill:none;stroke:#2a1a10;stroke-linecap:round;stroke-linejoin:round}.t-halo{stroke:#fff;opacity:.85}",
      ".t-hand{stroke:#2a1a10;stroke-linecap:round}",
      ".t-white{fill:#fff;stroke:#2a1a10;stroke-width:1.8}.t-shoe{fill:#2a1a10;stroke:#fff;stroke-width:1.6}",
      ".t-pupil{fill:#14100c}.t-nose{fill:#c24a0a}.t-mouth{fill:#fff;stroke:#2a1a10;stroke-width:2.4;stroke-linejoin:round}",
      ".t-cheek{fill:#ff5a2a;opacity:.55}",
      ".t-joy,.t-smirk,.t-dizzy,.t-stars{display:none}",
      ".tkm.joy .t-eye,.tkm.joy .t-smile{display:none}.tkm.joy .t-joy{display:inline}",
      ".tkm.sly .t-smile{display:none}.tkm.sly .t-smirk{display:inline}.tkm.sly .t-pupil{transform:scale(.7)}",
      ".tkm.dizzy .t-eye{display:none}.tkm.dizzy .t-dizzy,.tkm.dizzy .t-stars{display:inline}",
      ".t-brow-l{transform-origin:46px 38px}.t-brow-r{transform-origin:74px 38px}",
      ".tkm.sly .t-brow-l{transform:rotate(20deg) translateY(3px)}.tkm.sly .t-brow-r{transform:rotate(-20deg) translateY(3px)}",
      ".t-hm,.t-hh{transform-origin:60px 62px}",
      ".t-arm-l{transform-origin:20px 70px}.t-arm-r{transform-origin:100px 68px}.t-leg-l{transform-origin:50px 106px}.t-leg-r{transform-origin:70px 106px}",
      ".t-stars{transform-origin:60px 6px}",
      /* rolling like a wheel, and sitting in a vehicle */
      ".tkm.ball .t-leg-l,.tkm.ball .t-leg-r,.tkm.ball .t-arm-l,.tkm.ball .t-arm-r{display:none}",
      ".tkm.seated{position:absolute;left:auto;bottom:auto}",
      ".tkm.seated.legless .t-leg-l,.tkm.seated.legless .t-leg-r{display:none}",
      /* landing page: the entries flash when she points at them */
      ".tkm-flash{animation:tkm-flash 1.3s ease both;animation-delay:calc(var(--k,0) * 90ms)}",
      "@keyframes tkm-flash{0%,100%{box-shadow:none}30%{box-shadow:0 0 0 3px var(--accent,#0b7a6f),0 0 22px color-mix(in srgb,var(--accent,#0b7a6f) 55%,transparent)}}",
      /* vehicles and props */
      ".tkm-veh{position:fixed;left:0;bottom:6px;z-index:899;pointer-events:none;transform-origin:0 100%}",
      ".tkm-vs{position:absolute;left:0;bottom:0;transform-origin:0 100%}",
      "@media(max-width:600px){.tkm-vs{transform:scale(.72)}}",
      ".tkm-vs>svg{position:absolute;left:0;bottom:0;overflow:visible}",
      ".v-wheel{transform-box:fill-box;transform-origin:50% 50%}",
      ".tkm-veh.moving .v-wheel{animation:tkm-spin .35s linear infinite reverse}",
      ".tkm-veh.moving .v-leg{animation:tkm-gallop .32s ease-in-out infinite alternate}",
      ".v-leg{transform-box:fill-box;transform-origin:50% 0}.v-leg.b{animation-delay:-.16s!important}",
      "@keyframes tkm-gallop{from{transform:rotate(-24deg)}to{transform:rotate(24deg)}}",
      ".v-flame{transform-box:fill-box;transform-origin:50% 100%;animation:tkm-flick .18s ease-in-out infinite alternate}",
      ".v-flame.b{animation-duration:.23s;animation-delay:-.1s}",
      "@keyframes tkm-flick{from{transform:scale(1,1)}to{transform:scale(.82,1.25)}}",
      ".v-fire{transition:opacity .9s ease,transform .9s ease;transform-box:fill-box;transform-origin:50% 100%}",
      ".tkm-veh.out .v-fire{opacity:0;transform:scale(.3)}",
      ".tkm-prop{position:fixed;z-index:898;pointer-events:none}",
      ".tkm-box{width:34px;height:30px;background:#c98a55;border:2px solid #6b4423;border-radius:3px;box-shadow:inset 0 -6px 0 rgba(0,0,0,.12)}",
      ".tkm-box:after{content:'';position:absolute;left:50%;top:0;bottom:0;width:6px;margin-left:-3px;background:#e7c08f;opacity:.8}",
      ".tkm-puff{width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 40% 40%,#fff,#cfcfd6 60%,transparent 70%)}",
      "@media(prefers-reduced-motion:no-preference){",
      ".tkm.float .tkm-bob{animation:tkm-bob 2.6s ease-in-out infinite}",
      "@keyframes tkm-bob{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-6px) rotate(1.5deg)}}",
      ".tkm.float .t-arm-r{animation:tkm-wave 6s ease-in-out 1.5s infinite}",
      "@keyframes tkm-wave{0%,62%,100%{transform:none}68%{transform:rotate(-24deg)}74%{transform:rotate(12deg)}80%{transform:rotate(-24deg)}86%{transform:rotate(8deg)}92%{transform:none}}",
      ".tkm.float .t-leg-l{animation:tkm-leg 2.6s ease-in-out infinite}.tkm.float .t-leg-r{animation:tkm-leg 2.6s ease-in-out -1.3s infinite}",
      "@keyframes tkm-leg{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}",
      ".tkm.walking .tkm-bob{animation:tkm-step .36s ease-in-out infinite alternate}",
      "@keyframes tkm-step{from{transform:translateY(0)}to{transform:translateY(-7px)}}",
      ".tkm.walking .t-leg-l{animation:tkm-stride .36s ease-in-out infinite alternate}.tkm.walking .t-leg-r{animation:tkm-stride .36s ease-in-out -.36s infinite alternate}",
      "@keyframes tkm-stride{from{transform:rotate(-22deg)}to{transform:rotate(22deg)}}",
      ".tkm.walking .t-arm-l{animation:tkm-swing .36s ease-in-out infinite alternate}.tkm.walking .t-arm-r{animation:tkm-swing .36s ease-in-out -.36s infinite alternate}",
      "@keyframes tkm-swing{from{transform:rotate(14deg)}to{transform:rotate(-14deg)}}",
      ".tkm.seated .tkm-bob{animation:tkm-jiggle .22s ease-in-out infinite alternate}",
      "@keyframes tkm-jiggle{from{transform:translateY(0)}to{transform:translateY(-3px)}}",
      ".tkm.seated .t-arm-r{animation:tkm-wave 2.2s ease-in-out infinite}",
      ".t-hm{animation:tkm-spin 12s steps(12) infinite}.t-hh{animation:tkm-spin 144s steps(12) infinite}",
      ".tkm.dizzy .t-stars{animation:tkm-spin 1s linear infinite}",
      ".tkm.dizzy .tkm-bob{animation:tkm-woozy .9s ease-in-out infinite alternate}",
      "@keyframes tkm-woozy{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}",
      "@keyframes tkm-spin{to{transform:rotate(360deg)}}",
      ".tkm-hop.go{animation:tkm-hop .95s cubic-bezier(.3,.7,.3,1)}",
      "@keyframes tkm-hop{0%{transform:none}18%{transform:translateY(7px) scale(1.12,.86)}50%{transform:translateY(-38px) rotate(190deg) scale(1.3)}78%{transform:translateY(0) rotate(360deg) scale(1.12,.92)}100%{transform:rotate(360deg)}}",
      ".tkm-hop.go.sly{animation:tkm-wobble .9s ease}",
      "@keyframes tkm-wobble{0%,100%{transform:none}20%{transform:rotate(-9deg) scale(1.15)}40%{transform:rotate(8deg) scale(1.22)}60%{transform:rotate(-6deg) scale(1.15)}80%{transform:rotate(4deg) scale(1.08)}}",
      ".tkm-hop.boing{animation:tkm-boing .7s cubic-bezier(.3,.7,.3,1)}",
      /* gliding: rubber-hose limbs swing loose, the body bobs faster */
      ".tkm.glide .tkm-bob{animation:tkm-glidebob .55s ease-in-out infinite alternate}",
      "@keyframes tkm-glidebob{from{transform:translateY(-4px) rotate(-4deg)}to{transform:translateY(4px) rotate(4deg)}}",
      ".tkm.glide .t-leg-l{animation:tkm-hose .5s ease-in-out infinite alternate}.tkm.glide .t-leg-r{animation:tkm-hose .5s ease-in-out -.25s infinite alternate}",
      "@keyframes tkm-hose{from{transform:rotate(-34deg)}to{transform:rotate(30deg)}}",
      ".tkm.glide .t-arm-l{animation:tkm-flap .42s ease-in-out infinite alternate}.tkm.glide .t-arm-r{animation:tkm-flap .42s ease-in-out -.21s infinite alternate}",
      "@keyframes tkm-flap{from{transform:rotate(38deg)}to{transform:rotate(-30deg)}}",
      /* hologram: switch off into a line, flicker back in with colour fringes and scan lines */
      ".tkm.holo-out .tkm-holo{animation:tkm-off .42s ease-in forwards}",
      ".tkm.holo-in .tkm-holo{animation:tkm-on .6s ease-out}",
      "@keyframes tkm-off{0%{opacity:1;transform:none;filter:none}25%{opacity:.35;filter:drop-shadow(4px 0 #00e5ff) drop-shadow(-4px 0 #ff2bd6)}40%{opacity:1}65%{opacity:1;transform:scale(1.3,.06);filter:brightness(2.2) drop-shadow(0 0 8px #7ff)}100%{opacity:0;transform:scale(0,.02)}}",
      "@keyframes tkm-on{0%{opacity:0;transform:scale(0,.02)}30%{opacity:1;transform:scale(1.3,.06);filter:brightness(2.2) drop-shadow(0 0 8px #7ff)}55%{transform:none;opacity:.45;filter:drop-shadow(4px 0 #00e5ff) drop-shadow(-4px 0 #ff2bd6)}68%{opacity:1}80%{opacity:.55}100%{opacity:1;filter:none}}",
      ".tkm.holo-in .tkm-holo:after,.tkm.holo-out .tkm-holo:after{content:'';position:absolute;inset:-6px;border-radius:50%;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(120,255,255,.38) 0 2px,transparent 2px 5px);mix-blend-mode:screen}",
      "@keyframes tkm-boing{0%,100%{transform:none}25%{transform:translateY(5px) scale(1.1,.88)}55%{transform:translateY(-30px) scale(.95,1.08)}80%{transform:translateY(0) scale(1.06,.94)}}",
      "}"
    ].join("\n");
    var styleEl = document.createElement("style");
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    /* ---------------------------------------------------------------- the character (120 x 150 box) */
    var ticks = "";
    for (var h = 0; h < 12; h++) {
      var an = h * Math.PI / 6, r1 = h % 3 === 0 ? 34 : 36, r2 = 40;
      ticks += '<line class="t-tick" x1="' + (60 + r1 * Math.sin(an)).toFixed(1) + '" y1="' + (62 - r1 * Math.cos(an)).toFixed(1) +
        '" x2="' + (60 + r2 * Math.sin(an)).toFixed(1) + '" y2="' + (62 - r2 * Math.cos(an)).toFixed(1) + '"/>';
    }
    function limb(d) { return '<path class="t-line t-halo" stroke-width="6.6" d="' + d + '"/><path class="t-line" stroke-width="3.4" d="' + d + '"/>'; }
    var svg =
      '<svg viewBox="0 0 120 150" aria-hidden="true" focusable="false">' +
      '<g class="t-leg-l">' + limb("M50 106 C49 120 47 128 46 136") + '<ellipse class="t-shoe" cx="42" cy="140" rx="10" ry="5"/></g>' +
      '<g class="t-leg-r">' + limb("M70 106 C71 120 73 128 74 136") + '<ellipse class="t-shoe" cx="78" cy="140" rx="10" ry="5"/></g>' +
      '<g class="t-arm-l">' + limb("M20 70 C6 72 3 86 9 96") + '<circle class="t-white" cx="9" cy="99" r="7"/></g>' +
      '<g class="t-arm-r">' + limb("M100 68 C114 66 118 52 112 42") + '<circle class="t-white" cx="111" cy="38" r="7"/></g>' +
      '<circle class="t-rim" cx="60" cy="62" r="50"/><circle class="t-face" cx="60" cy="62" r="42"/>' +
      '<path class="t-shine" d="M30 44 C34 30 46 22 60 21 C48 26 38 34 34 48 Z"/>' + ticks +
      '<g class="t-hh"><line class="t-hand" stroke-width="3.6" x1="60" y1="62" x2="60" y2="50"/></g>' +
      '<g class="t-hm"><line class="t-hand" stroke-width="2.6" x1="60" y1="62" x2="60" y2="44"/></g>' +
      '<circle cx="60" cy="62" r="3" fill="#2a1a10"/>' +
      '<ellipse class="t-cheek" cx="33" cy="72" rx="6" ry="4"/><ellipse class="t-cheek" cx="87" cy="72" rx="6" ry="4"/>' +
      '<ellipse class="t-nose" cx="60" cy="68" rx="3.2" ry="2.4"/>' +
      '<path class="t-line t-brow-l" stroke-width="2" d="M36 38 Q46 31 55 37"/><path class="t-line t-brow-r" stroke-width="2" d="M65 37 Q74 31 84 38"/>' +
      '<g class="t-eye"><ellipse class="t-white t-eye-l" cx="45" cy="52" rx="11" ry="14"/><circle class="t-pupil t-p" cx="45" cy="54" r="6.2"/><circle cx="43" cy="50.5" r="1.9" fill="#fff"/></g>' +
      '<g class="t-eye"><ellipse class="t-white t-eye-r" cx="75" cy="52" rx="11" ry="14"/><circle class="t-pupil t-p" cx="75" cy="54" r="6.2"/><circle cx="73" cy="50.5" r="1.9" fill="#fff"/></g>' +
      '<g class="t-joy"><path class="t-line" stroke-width="3" d="M35 56 Q45 42 55 56"/><path class="t-line" stroke-width="3" d="M65 56 Q75 42 85 56"/></g>' +
      '<g class="t-dizzy"><path class="t-line" stroke-width="2.4" d="M45 52 m-7 0 a7 7 0 1 1 7 7 a4 4 0 1 1 4 -4"/><path class="t-line" stroke-width="2.4" d="M75 52 m-7 0 a7 7 0 1 1 7 7 a4 4 0 1 1 4 -4"/></g>' +
      '<g class="t-smile"><path class="t-mouth" d="M38 78 Q60 100 82 78 Q60 84 38 78 Z"/></g>' +
      '<g class="t-smirk"><path class="t-mouth" d="M38 80 Q58 96 84 74 Q62 84 38 80 Z"/><path class="t-line" stroke-width="2" d="M84 74 L88 70"/></g>' +
      '<g class="t-stars">' + star(36, 2) + star(84, 2) + star(60, -8) + '</g>' +
      '</svg>';
    function star(x, y) {
      return '<path d="M' + x + ' ' + (y - 7) + ' L' + (x + 2) + ' ' + (y - 2) + ' L' + (x + 7) + ' ' + y + ' L' + (x + 2) + ' ' + (y + 2) + ' L' + x + ' ' + (y + 7) +
        ' L' + (x - 2) + ' ' + (y + 2) + ' L' + (x - 7) + ' ' + y + ' L' + (x - 2) + ' ' + (y - 2) + ' Z" fill="#ffd23f" stroke="#2a1a10" stroke-width="1.2"/>';
    }

    /* ---------------------------------------------------------------- elements */
    var root = document.createElement("div");
    root.className = "tkm";
    root.hidden = true;
    root.innerHTML = '<div class="tkm-say" aria-hidden="true"></div>' +
      '<div class="tkm-size"><div class="tkm-holo"><div class="tkm-lean"><div class="tkm-hop"><div class="tkm-bob"><button type="button" class="tkm-btn">' + svg + '</button></div></div></div></div></div>' +
      '<button type="button" class="tkm-x" aria-label="Hide the clock character">×</button>';
    document.body.appendChild(root);
    var sayEl = root.querySelector(".tkm-say"), hop = root.querySelector(".tkm-hop"), btn = root.querySelector(".tkm-btn"), sizer = root.querySelector(".tkm-size");
    var pupils = root.querySelectorAll(".t-p"), eyes = [root.querySelector(".t-eye-l"), root.querySelector(".t-eye-r")];
    var extras = [];   // vehicles, boxes, puffs: removed when she is hidden

    function W() { return root.offsetWidth || 92; }
    function H() { return root.offsetHeight || 116; }
    function floorY() { return vh() - H() - (vw() <= 600 ? 8 : 12); }
    function topY() { var bar = document.querySelector(".pbar"); return (bar ? bar.getBoundingClientRect().bottom : 0) + 12; }
    function vw() { return document.documentElement.clientWidth || window.innerWidth; }
    function vh() { return window.innerHeight; }
    function minX() { return 8; }
    function maxX() { return vw() - W() - 8; }

    /* ---------- position: top-left corner in the viewport, plus a size factor ---------- */
    var x = 0, y = 0, size = 1;
    function place(nx, ny) {
      x = nx; if (ny !== undefined) y = ny;
      root.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      root.classList.toggle("say-l", x < 170);
      root.classList.toggle("say-b", y < topY() + 70);
    }
    function grow(s, instant) {
      size = s;
      if (instant) sizer.style.transition = "none";
      sizer.style.transform = s === 1 ? "" : "scale(" + s + ")";
      if (instant) { void sizer.offsetWidth; sizer.style.transition = ""; }
    }

    /* ---------- speech ---------- */
    var hideTimer = 0;
    function label(text) { btn.setAttribute("aria-label", (onProject ? "Back to the project list. " : "Jump to the project list. ") + text); }
    function speak(text, ms) {
      sayEl.textContent = text; label(text);
      sayEl.classList.add("show");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { sayEl.classList.remove("show"); }, ms || 5500);
    }
    function quiet(ms) { clearTimeout(hideTimer); hideTimer = setTimeout(function () { sayEl.classList.remove("show"); }, ms || 600); }
    label(SAY.hello);

    /* ---------- eyes ---------- */
    var px = null, py = null, queued = false, gaze = null;
    function look() {
      queued = false;
      for (var i = 0; i < 2; i++) {
        var r = eyes[i].getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = 0, dy = 0;
        var tx = gaze ? cx + gaze.x * 200 : px, ty = gaze ? cy + gaze.y * 200 : py;
        if (tx !== null && tx !== undefined) {
          var vx = tx - cx, vy = ty - cy, d = Math.sqrt(vx * vx + vy * vy) || 1, k = Math.min(d / 160, 1) * 5.2;
          dx = vx / d * k; dy = vy / d * k;
        }
        pupils[i].style.transform = "translate(" + dx.toFixed(2) + "px," + dy.toFixed(2) + "px)";
      }
    }
    function relook() { if (!queued) { queued = true; requestAnimationFrame(look); } }
    document.addEventListener("pointermove", function (e) { px = e.clientX; py = e.clientY; relook(); }, { passive: true });
    document.addEventListener("pointerdown", function (e) { px = e.clientX; py = e.clientY; relook(); }, { passive: true });
    document.documentElement.addEventListener("mouseleave", function () { px = null; relook(); });
    function blink() {
      eyes.forEach(function (e) { e.style.transformBox = "fill-box"; e.style.transformOrigin = "50% 50%"; e.style.transform = "scaleY(.12)"; });
      Array.prototype.forEach.call(pupils, function (p) { p.style.opacity = "0"; });
      setTimeout(function () {
        eyes.forEach(function (e) { e.style.transform = ""; });
        Array.prototype.forEach.call(pupils, function (p) { p.style.opacity = ""; });
      }, 120);
    }
    (function blinkLoop() { setTimeout(function () { if (!root.hidden) blink(); blinkLoop(); }, rand(2600, 5800)); })();

    /* ---------- moods and hops ---------- */
    var moodTimer = 0;
    function mood(name, ms) {
      root.classList.remove("joy", "sly", "dizzy");
      clearTimeout(moodTimer);
      if (name) { root.classList.add(name); if (ms) moodTimer = setTimeout(function () { root.classList.remove(name); }, ms); }
    }
    function bounce(kind) {
      if (reduce) return;
      hop.classList.remove("go", "sly", "boing");
      void hop.offsetWidth;
      kind.split(" ").forEach(function (k) { hop.classList.add(k); });
    }

    /* ---------- reading the page: how much of what is under a spot would she hide? ---------- */
    var CONTENT = "p,li,dt,dd,h1,h2,h3,h4,a,button,input,select,textarea,label,img,video,canvas,figure,table,pre,code,blockquote," +
                  ".stat,.panel,.card,.stage,.entry,.fc-box,.btn,.chip,.step,.lamps,.keys,.trace,svg";
    function coverAt(left, top, s) {   // 0 = only empty background under her, 1 = all content
      var w = W() * s, h = H() * s, cx = left + W() / 2, cy = top + H() * 0.55, hits = 0, n = 0;
      for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) {
        var sx = cx + i * w * 0.36, sy = cy + j * h * 0.36;
        if (sx < 0 || sy < 0 || sx > vw() || sy > vh()) continue;
        n++;
        var els = document.elementsFromPoint(sx, sy);
        for (var k = 0; k < els.length; k++) {
          var el = els[k];
          if (el === root || root.contains(el) || (el.closest && el.closest(".tkm-veh,.tkm-prop"))) continue;
          if (el.closest && el.closest(CONTENT)) hits++;
          break;   // only the top-most element that is not her counts
        }
      }
      return n ? hits / n : 1;
    }
    function coverage() { return coverAt(x, y, size); }
    function findSpot() {   // sample spots, score them, pick one of the best few
      var lo = 8, hi = vw() - W() - 8, top = topY(), bottom = floorY(), best = [];
      var small = vw() <= 600;
      for (var i = 0; i < 26; i++) {
        var s = small ? rand(0.7, 1) : rand(0.72, 1.25);
        var cx = rand(lo, hi), cy = rand(top, bottom);
        var cost = coverAt(cx, cy, s) * 3;
        if (px !== null) { var d = Math.hypot(cx + W() / 2 - px, cy + H() / 2 - py); if (d < 180) cost += (180 - d) / 180 * 1.5; }
        var away = Math.hypot(cx - x, cy - y);
        if (away < 160) cost += 0.8;                   // go somewhere new
        if (away > vw() * 0.8) cost += 0.3;            // but not always to the far corner
        best.push({ x: cx, y: cy, s: s, cost: cost });
      }
      best.sort(function (a, b) { return a.cost - b.cost; });
      return best[Math.floor(Math.random() * Math.min(3, best.length))];
    }

    /* ---------- gliding along a curved path (Web Animations; any action can halt it) ---------- */
    var flight = null;
    function halt() {
      if (!flight) return;
      var f = flight; flight = null;
      try { f.anim.commitStyles(); } catch (e) { /* not supported: she snaps to the end */ }
      f.anim.cancel();
      if (f.spin) f.spin.cancel();
      var m = new DOMMatrixReadOnly(getComputedStyle(root).transform);
      root.classList.remove("glide", "go-l", "go-r");
      gaze = null; relook();
      place(m.m41, m.m42);
      f.done();
    }
    function glideTo(tx, ty, s) {
      halt();
      tx = clamp(tx, 8, vw() - W() - 8); ty = clamp(ty, topY(), floorY());
      var dx = tx - x, dy = ty - y, dist = Math.hypot(dx, dy);
      if (dist < 6) { grow(s); return Promise.resolve(); }
      var ms = clamp(dist / 230 * 1000, 900, 2800);
      var bend = rand(-0.35, 0.35) * dist;             // the path bows to one side
      var mx = x + dx / 2 - dy / dist * bend, my = y + dy / 2 + dx / dist * bend - dist * 0.12;
      var from = "translate3d(" + x + "px," + y + "px,0)";
      gaze = { x: dx / dist, y: dy / dist }; relook();
      root.classList.add("glide", dx < 0 ? "go-l" : "go-r");
      grow(s);
      return new Promise(function (res) {
        var anim = root.animate([
          { transform: from },
          { transform: "translate3d(" + mx.toFixed(1) + "px," + my.toFixed(1) + "px,0)", offset: 0.5 },
          { transform: "translate3d(" + tx + "px," + ty + "px,0)" }
        ], { duration: ms, easing: "cubic-bezier(.45,.05,.35,1)" });
        var spin = Math.random() < 0.25 ? hop.animate([{ transform: "rotate(0)" }, { transform: "rotate(" + (dx < 0 ? -360 : 360) + "deg)" }],
          { duration: ms * 0.6, delay: ms * 0.2, easing: "ease-in-out" }) : null;
        flight = { anim: anim, spin: spin, done: res };
        place(tx, ty);
        anim.finished.then(function () {
          if (!flight || flight.anim !== anim) return;
          flight = null;
          root.classList.remove("glide", "go-l", "go-r");
          gaze = null; relook();
          res();
        }, function () { /* halted */ });
      });
    }
    async function teleport(tx, ty, s) {   // switch off, reappear somewhere else
      halt();
      root.classList.add("holo-out");
      await sleep(430);
      root.classList.add("gone");
      root.classList.remove("holo-out");
      place(clamp(tx, 8, vw() - W() - 8), clamp(ty, topY(), floorY()));
      grow(s, true);
      await sleep(rand(250, 700));
      root.classList.remove("gone");
      root.classList.add("holo-in");
      await sleep(620);
      root.classList.remove("holo-in");
    }

    /* ---------- rolling like a wheel along the bottom (crash entrance) ---------- */
    function roll(fromX, toX, ms, easing) {
      root.classList.add("ball");
      root.classList.remove("float");
      var fy = floorY(), turns = (toX - fromX) / (Math.PI * W() * 0.86) * 360;
      var a = root.animate([{ transform: "translate3d(" + fromX + "px," + fy + "px,0)" }, { transform: "translate3d(" + toX + "px," + fy + "px,0)" }],
        { duration: ms, easing: easing || "cubic-bezier(.3,.1,.4,1)" });
      var b = hop.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(" + turns + "deg)" }], { duration: ms, easing: easing || "cubic-bezier(.3,.1,.4,1)" });
      place(toX, fy);
      function done() { root.classList.remove("ball"); root.classList.add("float"); }
      return Promise.all([a.finished, b.finished]).then(done, done);
    }

    /* ---------- props ---------- */
    function prop(cls, left, bottom, w, h) {
      var el = document.createElement("div");
      el.className = "tkm-prop " + cls;
      el.style.left = left + "px"; el.style.bottom = bottom + "px";
      if (w) el.style.width = w + "px";
      if (h) el.style.height = h + "px";
      el.setAttribute("aria-hidden", "true");
      document.body.appendChild(el);
      extras.push(el);
      return el;
    }
    function puff(left, bottom, n) {
      for (var i = 0; i < (n || 4); i++) {
        var p = prop("tkm-puff", left + rand(-10, 10), bottom + rand(0, 8));
        p.animate([{ transform: "scale(.4)", opacity: 0.9 }, { transform: "translate(" + rand(-40, 40) + "px," + rand(-50, -20) + "px) scale(" + rand(1.2, 2) + ")", opacity: 0 }],
          { duration: rand(600, 1000), easing: "ease-out", fill: "forwards" }).finished.then(function (e) { return function () { e.remove(); }; }(p));
      }
    }
    function drop(el, ms) { setTimeout(function () { if (el.parentNode) el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, fill: "forwards" }).finished.then(function () { el.remove(); }); }, ms); }

    /* ---------------------------------------------------------------- vehicles (original art; all face left, the way they drive) */
    var VEH = {
      /* low, wide race car: pointed nose, oval four-point headlights, hood vents, flared arches, huge swan-neck wing.
         She sits behind the side window; the glass is drawn over her. */
      car: { w: 270, h: 112, seat: { x: 140, y: 84, s: 0.5 }, legless: true,
        back: '<path d="M96 60 C106 50 116 44 128 43 L170 44 C184 47 194 53 204 61 Z" fill="#2a2f3a"/>',
        front:
          /* swan-neck wing: struts rise from the deck and hang the wing from above */
          '<path d="M226 60 C222 44 230 32 238 27 M240 61 C238 46 244 34 250 28" fill="none" stroke="#14161c" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M208 22 L264 18 L266 26 L210 30 Z" fill="#1b1e26" stroke="#0b0c10" stroke-width="1.6"/>' +
          '<path d="M210 30 L266 26 L266 29 L212 33 Z" fill="#3b4150"/>' +
          '<path d="M262 14 L268 14 L268 32 L262 32 Z" fill="#14161c"/>' +
          /* body, with the side window cut out so she shows through */
          '<path fill-rule="evenodd" d="M10 94 L4 84 C4 76 12 72 26 70 L84 59 C96 47 110 39 126 37 L176 38 C196 41 214 52 230 60 L252 63 C258 66 260 76 258 90 L252 95 L14 95 Z M96 60 C106 50 116 44 128 43 L170 44 C184 47 194 53 204 61 Z" fill="#1f8fd6" stroke="#0b2440" stroke-width="2.4"/>' +
          '<path d="M30 70 C60 64 90 60 120 58" fill="none" stroke="#7cc4f2" stroke-width="2.4" opacity=".7"/>' +
          '<path d="M96 60 C106 50 116 44 128 43 L170 44 C184 47 194 53 204 61 Z" fill="#bfe3ff" opacity=".35" stroke="#0b2440" stroke-width="2"/>' +
          '<path d="M150 43 L148 61" stroke="#0b2440" stroke-width="3"/>' +
          /* doors, side channel behind the front wheel, rear arch intake */
          '<path d="M92 62 C92 72 93 80 96 90 M150 62 C150 72 150 80 148 90" fill="none" stroke="#0b2440" stroke-width="1.6"/>' +
          '<path d="M80 72 C86 74 90 80 90 88 L84 88 C84 82 82 78 78 76 Z" fill="#0b0c10"/>' +
          '<path d="M168 70 L184 68 L182 78 L170 80 Z" fill="#0b0c10"/>' +
          /* hood vents, front intake, headlight with four points */
          '<path d="M34 72 L52 68 M58 66 L76 62" stroke="#0b0c10" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M6 84 L34 82 L32 90 L8 91 Z" fill="#0b0c10"/>' +
          '<ellipse cx="18" cy="75" rx="8" ry="5" fill="#eaf6ff" stroke="#0b2440" stroke-width="1.6"/>' +
          '<circle cx="15" cy="73.5" r="1.2" fill="#7fd3ff"/><circle cx="21" cy="73.5" r="1.2" fill="#7fd3ff"/><circle cx="15" cy="76.5" r="1.2" fill="#7fd3ff"/><circle cx="21" cy="76.5" r="1.2" fill="#7fd3ff"/>' +
          /* carbon side skirt, diffuser, tail light, exhausts */
          '<path d="M70 92 L190 92 L188 97 L72 97 Z" fill="#1b1e26"/>' +
          '<path d="M232 92 L258 90 L258 98 L232 99 Z M238 92 L238 99 M246 91 L246 99" fill="#14161c" stroke="#3b4150" stroke-width="1.2"/>' +
          '<path d="M252 66 L259 68" stroke="#ff3b30" stroke-width="3.4" stroke-linecap="round"/>' +
          '<circle cx="250" cy="88" r="2.6" fill="#c9d1de" stroke="#14161c"/><circle cx="244" cy="89" r="2.6" fill="#c9d1de" stroke="#14161c"/>' +
          /* flared arches and wheels: wider at the rear */
          '<path d="M24 94 A28 28 0 0 1 80 94" fill="none" stroke="#0b2440" stroke-width="5"/>' +
          '<path d="M176 94 A32 32 0 0 1 240 94" fill="none" stroke="#0b2440" stroke-width="5"/>' +
          alloy(52, 94, 21) + alloy(208, 94, 24)
      },
      /* a red bull: hump, dewlap, long face, forward horns, ears, muscle lines, cloven hooves, tufted tail */
      bull: { w: 230, h: 150, seat: { x: 128, y: 47, s: 0.56 },
        back:
          '<path d="M200 60 C214 70 216 92 212 108" fill="none" stroke="#9e1f18" stroke-width="4.4" stroke-linecap="round"/>' +
          '<path d="M206 104 C204 116 216 122 220 112 C222 106 216 100 212 102 Z" fill="#5a0f0b"/>' +
          bleg(78, 92, "b", true) + bleg(176, 90, "", true) +
          '<path d="M56 70 C58 46 78 28 104 30 C130 30 160 36 184 44 C202 50 210 66 206 84 C202 100 186 106 160 106 L100 106 C80 106 66 100 60 92 Z" fill="#c8261d" stroke="#2a1a10" stroke-width="2.6"/>' +
          '<path d="M70 96 C100 104 160 106 196 92 C190 104 170 108 150 108 L100 108 C84 108 74 104 70 96 Z" fill="#8e1a14" opacity=".55"/>' +
          '<path d="M72 34 C84 28 100 26 112 30" fill="none" stroke="#e8564a" stroke-width="3" stroke-linecap="round" opacity=".8"/>' +
          '<path d="M90 56 C98 66 98 82 92 96 M170 52 C180 62 182 78 176 92 M126 74 C140 80 152 80 162 76" fill="none" stroke="#8e1a14" stroke-width="2" stroke-linecap="round"/>' +
          '<path d="M58 86 C54 98 60 108 72 106 C74 100 70 94 66 90 Z" fill="#b3221a" stroke="#2a1a10" stroke-width="2"/>' +
          bleg(96, 94, "", false) + bleg(160, 92, "b", false) +
          /* head turned toward the viewer: symmetric horns, ears, two eyes, two nostrils */
          '<path d="M26 50 C14 46 6 34 10 22 C14 32 20 38 30 42 Z M56 50 C68 46 76 34 72 22 C68 32 62 38 52 42 Z" fill="#f3e6c8" stroke="#2a1a10" stroke-width="2"/>' +
          '<path d="M10 22 C8 26 9 29 11 30 L14 26 Z M72 22 C74 26 73 29 71 30 L68 26 Z" fill="#3a3a3a"/>' +
          '<path d="M22 58 C8 54 4 64 14 68 C18 66 20 62 22 58 Z M60 58 C74 54 78 64 68 68 C64 66 62 62 60 58 Z" fill="#b3221a" stroke="#2a1a10" stroke-width="2"/>' +
          '<path d="M20 54 C22 42 32 38 41 38 C50 38 60 42 62 54 C64 70 60 92 54 104 C50 110 32 110 28 104 C22 92 18 70 20 54 Z" fill="#c8261d" stroke="#2a1a10" stroke-width="2.6"/>' +
          '<path d="M30 46 C36 43 46 43 52 46" fill="none" stroke="#e8564a" stroke-width="2.4" stroke-linecap="round"/>' +
          '<path d="M34 72 C38 76 44 76 48 72" fill="none" stroke="#8e1a14" stroke-width="1.6" stroke-linecap="round"/>' +
          '<ellipse cx="31" cy="64" rx="5" ry="5.5" fill="#fff" stroke="#2a1a10" stroke-width="1.6"/><ellipse cx="51" cy="64" rx="5" ry="5.5" fill="#fff" stroke="#2a1a10" stroke-width="1.6"/>' +
          '<circle cx="30" cy="65" r="2.6" fill="#2a1a10"/><circle cx="50" cy="65" r="2.6" fill="#2a1a10"/>' +
          '<circle cx="29.2" cy="63.8" r=".9" fill="#fff"/><circle cx="49.2" cy="63.8" r=".9" fill="#fff"/>' +
          '<path d="M25 56 L36 59.5 M57 56 L46 59.5" stroke="#2a1a10" stroke-width="2.6" stroke-linecap="round"/>' +
          '<ellipse cx="41" cy="97" rx="17" ry="11" fill="#d9584a" stroke="#2a1a10" stroke-width="2.2"/>' +
          '<ellipse cx="35" cy="97" rx="3" ry="4" fill="#2a1a10"/><ellipse cx="47" cy="97" rx="3" ry="4" fill="#2a1a10"/>' +
          '<path d="M35 105 a6 6 0 0 0 12 0" fill="none" stroke="#d9a441" stroke-width="2.8"/>',
        front: ''
      },
      /* demon chopper: long, low, scorched black frame, raked extended fork, ape-hanger bars, V-twin with glowing
         fins, hanging chain, fire wrapped round both wheels and pouring off the tank and exhausts */
      firebike: { w: 280, h: 142, seat: { x: 150, y: 73, s: 0.54 },
        back:
          '<g class="v-fire">' + flame(252, 98, 1.3, "") + flame(270, 94, 1.0, "b") + flame(236, 104, 0.9, "b") + flame(284, 100, 0.7, "") + '</g>' +
          fireWheel(208, 108, 28),
        front:
          fireWheel(42, 108, 26) +
          /* rear fender, frame, raked fork, bars */
          '<path d="M174 92 A36 36 0 0 1 238 86" fill="none" stroke="#111" stroke-width="6" stroke-linecap="round"/>' +
          '<path d="M84 50 L152 66 L208 108 M88 58 L124 98 L208 108" fill="none" stroke="#151515" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>' +
          '<path d="M84 50 L152 66 L208 108 M88 58 L124 98" fill="none" stroke="#ff7a1c" stroke-width="1.2" opacity=".55"/>' +
          '<path d="M82 46 L40 108 M88 48 L46 108" fill="none" stroke="#6b6f78" stroke-width="4" stroke-linecap="round"/>' +
          '<path d="M82 46 L40 108" fill="none" stroke="#2a2a2a" stroke-width="1.4"/>' +
          '<path d="M84 48 C80 34 76 24 70 18 M70 18 L58 18 M84 48 C88 36 92 26 96 20 L104 22" fill="none" stroke="#3a3d44" stroke-width="3.6" stroke-linecap="round"/>' +
          /* V-twin engine with glowing fins, exhausts */
          '<path d="M112 76 L132 66 L142 84 L124 96 Z M140 78 L160 72 L164 92 L144 98 Z" fill="#2b2d33" stroke="#0b0b0b" stroke-width="2"/>' +
          '<path d="M116 80 L134 72 M118 86 L138 78 M144 82 L160 78 M146 88 L162 84" stroke="#ff8a1c" stroke-width="1.8" opacity=".9"/>' +
          '<path d="M150 96 C180 100 220 98 252 94 M146 100 C178 106 222 104 254 100" fill="none" stroke="#5c6068" stroke-width="4.4" stroke-linecap="round"/>' +
          '<path d="M150 96 C180 100 220 98 252 94" fill="none" stroke="#ff7a1c" stroke-width="1" opacity=".7"/>' +
          /* tank with a burning crack, low seat */
          '<path d="M96 52 C104 40 132 40 146 54 L140 66 C124 66 108 64 98 62 Z" fill="#1a1a1a" stroke="#000" stroke-width="2"/>' +
          '<path d="M104 52 L114 56 L120 50 L130 56 L138 52" fill="none" stroke="#ffb32e" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M140 60 C152 56 172 58 182 66 L176 72 C164 70 152 70 142 70 Z" fill="#0d0d0d"/>' +
          /* drive chain and a chain hanging from the frame */
          chain(150, 94, 206, 104, 8) +
          '<path d="M118 68 C116 84 124 96 132 100" fill="none" stroke="#8a8f99" stroke-width="2.4" stroke-dasharray="3 2.4" stroke-linecap="round"/>' +
          /* glowing headlight */
          '<circle cx="76" cy="56" r="9" fill="#ffcf4a" opacity=".35"/><circle cx="76" cy="56" r="6" fill="#ffe08a" stroke="#111" stroke-width="2"/>' +
          '<g class="v-fire">' + flame(108, 46, 0.6, "b") + flame(124, 44, 0.75, "") + flame(138, 48, 0.55, "b") + flame(254, 96, 0.7, "") + '</g>'
      }
    };
    function alloy(cx, cy, r) {   // racing wheel: low-profile tyre, five-spoke rim, brake caliper
      var g = '<g class="v-wheel" style="' + axle(cx, cy) + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#111318"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.78).toFixed(1) + '" fill="#c9d1de" stroke="#2a2f3a" stroke-width="1.6"/>';
      for (var k = 0; k < 5; k++) {
        var a = k * Math.PI * 2 / 5;
        g += '<path d="M' + cx + ' ' + cy + ' L' + (cx + Math.cos(a) * r * 0.74).toFixed(1) + ' ' + (cy + Math.sin(a) * r * 0.74).toFixed(1) + '" stroke="#5c6474" stroke-width="3.4" stroke-linecap="round"/>';
      }
      return g + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.16).toFixed(1) + '" fill="#2a2f3a"/></g>' +
        '<path d="M' + (cx - r * 0.55) + ' ' + (cy - r * 0.45) + ' a' + (r * 0.7) + ' ' + (r * 0.7) + ' 0 0 1 ' + (r * 0.5) + ' ' + (-r * 0.22) + '" fill="none" stroke="#ffd23f" stroke-width="4" stroke-linecap="round"/>';
    }
    function fireWheel(cx, cy, r) {   // a dark tyre with fire wrapped all the way round; the whole ring turns
      var g = '<g class="v-wheel" style="' + axle(cx, cy) + '"><g class="v-fire">';
      for (var k = 0; k < 10; k++) {
        var deg = k * 36;
        g += '<g transform="rotate(' + deg + ' ' + cx + ' ' + cy + ')">' + flame(cx, cy - r + 4, 0.55, k % 2 ? "b" : "") + '</g>';
      }
      g += '</g><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#1a1a1a" stroke="#ff7a1c" stroke-width="2.4"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.62).toFixed(1) + '" fill="none" stroke="#4a4d55" stroke-width="3"/>';
      for (var j = 0; j < 6; j++) {
        var a = j * Math.PI / 3;
        g += '<path d="M' + cx + ' ' + cy + ' L' + (cx + Math.cos(a) * r * 0.62).toFixed(1) + ' ' + (cy + Math.sin(a) * r * 0.62).toFixed(1) + '" stroke="#3a3d44" stroke-width="2"/>';
      }
      return g + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.2).toFixed(1) + '" fill="#ffb32e" stroke="#111" stroke-width="1.6"/></g>';
    }
    function flame(fx, fy, s, cls) {   // one flickering flame, base at (fx, fy)
      var o = 'M0 0 C-14 -8 -12 -26 -2 -44 C0 -30 10 -30 8 -16 C14 -22 16 -30 14 -36 C24 -22 20 -4 6 2 Z';
      var i = 'M0 0 C-7 -6 -6 -16 0 -26 C2 -16 8 -14 6 -6 C8 -2 6 2 0 2 Z';
      return '<g transform="translate(' + fx + ' ' + fy + ') scale(' + s + ')"><g class="v-flame ' + cls + '"><path d="' + o + '" fill="#ff5a1f" stroke="#a8231c" stroke-width="1.6"/><path d="' + i + '" fill="#ffd23f"/></g></g>';
    }
    function axle(cx, cy) { return 'transform-box:view-box;transform-origin:' + cx + 'px ' + cy + 'px'; }   // spin about the hub
    function chain(x1, y1, x2, y2, n) {
      var g = '';
      for (var k = 0; k <= n; k++) {
        var t = k / n;
        g += '<circle cx="' + (x1 + (x2 - x1) * t).toFixed(1) + '" cy="' + (y1 + (y2 - y1) * t).toFixed(1) + '" r="2.2" fill="none" stroke="#8a8f99" stroke-width="1.4"/>';
      }
      return g;
    }
    function bleg(x0, y0, cls, far) {   // bull leg: thick upper, knee, slim lower, cloven hoof
      var fill = far ? "#9e1f18" : "#b92a22";
      return '<g class="v-leg ' + cls + '"><path d="M' + (x0 - 9) + ' ' + y0 + ' C' + (x0 - 10) + ' ' + (y0 + 14) + ' ' + (x0 - 6) + ' ' + (y0 + 20) + ' ' + (x0 - 6) + ' ' + (y0 + 26) +
        ' L' + (x0 - 5) + ' ' + (y0 + 38) + ' L' + (x0 + 5) + ' ' + (y0 + 38) + ' L' + (x0 + 6) + ' ' + (y0 + 26) + ' C' + (x0 + 7) + ' ' + (y0 + 18) + ' ' + (x0 + 10) + ' ' + (y0 + 12) + ' ' + (x0 + 9) + ' ' + y0 + ' Z" fill="' + fill + '" stroke="#2a1a10" stroke-width="2"/>' +
        '<path d="M' + (x0 - 7) + ' ' + (y0 + 38) + ' L' + (x0 - 1) + ' ' + (y0 + 38) + ' L' + (x0 - 1) + ' ' + (y0 + 45) + ' L' + (x0 - 8) + ' ' + (y0 + 45) + ' Z M' + (x0 + 1) + ' ' + (y0 + 38) + ' L' + (x0 + 7) + ' ' + (y0 + 38) + ' L' + (x0 + 8) + ' ' + (y0 + 45) + ' L' + (x0 + 1) + ' ' + (y0 + 45) + ' Z" fill="#1a1a1a"/></g>';
    }
    function vehicle(kind) {
      var v = VEH[kind];
      var el = document.createElement("div");
      el.className = "tkm-veh";
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = '<div class="tkm-vs" style="width:' + v.w + 'px;height:' + v.h + 'px">' +
        '<svg width="' + v.w + '" height="' + v.h + '" viewBox="0 0 ' + v.w + ' ' + v.h + '">' + v.back + '</svg>' +
        '<div class="tkm-seat"></div>' +
        '<svg width="' + v.w + '" height="' + v.h + '" viewBox="0 0 ' + v.w + ' ' + v.h + '">' + v.front + '</svg></div>';
      document.body.appendChild(el);
      extras.push(el);
      var seat = el.querySelector(".tkm-seat");
      seat.style.cssText = "position:absolute;left:" + (v.seat.x - 46) + "px;bottom:" + (v.h - v.seat.y - 6) + "px;width:92px;height:116px";
      return { el: el, v: v, seat: seat, scale: function () { return vw() <= 600 ? 0.72 : 1; } };
    }
    function board(car) {
      halt();
      root.classList.add("seated");
      if (car.v.legless) root.classList.add("legless");
      root.classList.remove("float");
      root.style.transform = "scale(" + car.v.seat.s + ")";
      root.style.width = "92px"; root.style.height = "116px";
      car.seat.appendChild(root);
    }
    function hopOff(landX) {   // leave the seat and land on the floor at landX (behind the vehicle, so it can drive off past her)
      var r = root.getBoundingClientRect();
      document.body.appendChild(root);
      root.classList.remove("seated", "legless");
      root.style.width = ""; root.style.height = "";
      var w = W(), h = H(), s = r.width / w;
      var sx = r.left - w * (1 - s) / 2, sy = r.bottom - h;
      var tx = clamp(landX, 8, vw() - w - 8), ty = floorY();
      place(tx, ty);
      return root.animate([
        { transform: "translate3d(" + sx + "px," + sy + "px,0) scale(" + s + ")" },
        { transform: "translate3d(" + ((sx + tx) / 2) + "px," + (Math.min(sy, ty) - 70) + "px,0) scale(.9) rotate(-200deg)", offset: 0.5 },
        { transform: "translate3d(" + tx + "px," + ty + "px,0) scale(1) rotate(-360deg)" }
      ], { duration: 750, easing: "cubic-bezier(.3,.6,.4,1)" }).finished;
    }
    function drive(car, from, to, ms, easing) {
      car.el.classList.add("moving");
      var sc = car.scale();
      var a = car.el.animate([{ transform: "translateX(" + from + "px) scale(" + sc + ")" }, { transform: "translateX(" + to + "px) scale(" + sc + ")" }],
        { duration: ms, easing: easing || "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
      return a.finished.then(function () { car.el.classList.remove("moving"); });
    }
    function tilt(car, at, deg, ms) {
      var sc = car.scale();
      return car.el.animate([
        { transform: "translateX(" + at + "px) scale(" + sc + ")" },
        { transform: "translateX(" + at + "px) scale(" + sc + ") rotate(" + deg + "deg)", offset: 0.4 },
        { transform: "translateX(" + at + "px) scale(" + sc + ")" }
      ], { duration: ms, easing: "ease-in-out", fill: "forwards" }).finished;
    }

    /* ---------------------------------------------------------------- entrances */
    async function enterRide(kind) {
      var car = vehicle(kind), sc = car.scale(), wpx = car.v.w * sc;
      var stopAt = clamp(vw() * 0.5, 120, vw() - wpx - 20);
      board(car);
      root.hidden = false;
      speak(kind === "car" ? "Beep beep! Coming through!" : kind === "bull" ? "Yee-haw!" : "Too hot to handle!", 2400);
      await drive(car, vw() + 30, stopAt, kind === "bull" ? 1500 : 1300);
      if (kind === "car") { puff(stopAt + 30, 6, 5); await tilt(car, stopAt, -3, 400); }
      if (kind === "bull") { puff(stopAt + 10, 70, 3); await tilt(car, stopAt, 12, 700); }
      if (kind === "firebike") { await tilt(car, stopAt, 16, 800); }
      await sleep(250);
      await hopOff(car.el.querySelector(".tkm-vs").getBoundingClientRect().right + 6);
      root.classList.add("float");
      speak(SAY.hello, 6500);
      if (kind === "firebike") { car.el.classList.add("out"); puff(stopAt + 120, 20, 6); await sleep(1100); }
      await sleep(kind === "bull" ? 500 : 700);
      await drive(car, stopAt, -wpx - 60, 1400, "cubic-bezier(.5,0,.8,.6)");
      car.el.remove();
    }
    async function enterCrash() {
      var w = W(), boxX = clamp(vw() * 0.38, 60, vw() - 260), floor = vw() <= 600 ? 8 : 12;
      var boxes = [];
      [[0, 0], [36, 0], [72, 0], [18, 32], [54, 32], [36, 64]].forEach(function (p) { boxes.push(prop("tkm-box", boxX + p[0], floor + p[1])); });
      root.hidden = false;
      speak("Wheeee!", 1800);
      var hitX = boxX + 110;
      await roll(vw() + 40, hitX, 1500, "cubic-bezier(.4,0,.9,.7)");
      boxes.forEach(function (b, i) {   // boxes fly
        var dx = rand(-260, -60) - i * 10, up = rand(60, 160), spin = rand(-540, 540);
        b.animate([
          { transform: "none" },
          { transform: "translate(" + dx * 0.5 + "px," + -up + "px) rotate(" + spin * 0.5 + "deg)", offset: 0.45 },
          { transform: "translate(" + dx + "px," + (Number(b.style.bottom.replace("px", "")) - floor) + "px) rotate(" + spin + "deg)" }
        ], { duration: rand(800, 1100), easing: "cubic-bezier(.2,.6,.5,1)", fill: "forwards" });
        drop(b, 9000);
      });
      puff(hitX, floor + 20, 6);
      var fy = floorY();
      root.animate([{ transform: "translate3d(" + hitX + "px," + fy + "px,0)" }, { transform: "translate3d(" + (hitX + 70) + "px," + (fy - 30) + "px,0)", offset: 0.4 },
        { transform: "translate3d(" + (hitX + 110) + "px," + fy + "px,0)" }], { duration: 600, easing: "ease-out" });
      place(hitX + 110, fy);
      await sleep(620);
      mood("dizzy");
      speak("Ow. Who put those there?", 2600);
      await sleep(2300);
      mood(null);
      root.classList.add("float");
      bounce("boing");
      await sleep(500);
      speak("Ta-da! I meant to do that. " + SAY.hello, 7000);
    }
    async function enterPoof() {   // later visits: she just materialises somewhere sensible
      var spot = findSpot();
      place(spot.x, spot.y); grow(spot.s, true);
      root.classList.add("gone", "float");
      root.hidden = false;
      await sleep(50);
      root.classList.remove("gone");
      root.classList.add("holo-in");
      await sleep(620);
      root.classList.remove("holo-in");
      speak(SAY.hello, 6000);
    }

    /* ---------------------------------------------------------------- floating about the page */
    var busy = false, hovered = false, alive = true, nudge = false;
    async function dwell(ms) {   // wait, but leave early if nudged (scrolled onto content); never move while hovered
      var end = Date.now() + ms;
      while (alive && (Date.now() < end || hovered || busy || document.hidden || root.hidden) && !(nudge && !hovered && !busy)) await sleep(200);
      nudge = false;
    }
    async function life() {
      while (alive) {
        var cov = coverage();
        await dwell(cov > 0.34 ? rand(900, 1800) : rand(3000, 6500));   // covering something: move soon
        if (!alive) return;
        var spot = findSpot();
        try {
          if (Math.random() < 0.62) await glideTo(spot.x, spot.y, spot.s);
          else await teleport(spot.x, spot.y, spot.s);
          if (Math.random() < 0.35) speak(pick(SAY.chat), 3800);
          else if (Math.random() < 0.2) bounce("boing");
        } catch (e) { /* halted by a click: carry on */ }
      }
    }
    var scrollT = 0;
    window.addEventListener("scroll", function () {
      clearTimeout(scrollT);
      scrollT = setTimeout(function () { if (!root.hidden && coverage() > 0.34) nudge = true; }, 300);
    }, { passive: true });

    /* ---------------------------------------------------------------- clicks and hover */
    var clicks = [];
    btn.addEventListener("click", function () {
      if (root.classList.contains("seated") || root.classList.contains("ball")) return;
      halt();
      var now = Date.now();
      clicks = clicks.filter(function (t) { return now - t < 2500; });
      clicks.push(now);
      if (clicks.length >= 3) { clicks = []; mood("sly", 2200); bounce("go sly"); speak(SAY.sly, 4500); return; }
      mood("joy", 1100); bounce("go"); speak(SAY.click, 3500);
      if (onProject) { setTimeout(function () { location.href = home; }, reduce ? 150 : 900); return; }
      list.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      Array.prototype.forEach.call(document.querySelectorAll("#projects .entry"), function (el, i) {
        el.style.setProperty("--k", i);
        el.classList.remove("tkm-flash"); void el.offsetWidth; el.classList.add("tkm-flash");
        setTimeout(function () { el.classList.remove("tkm-flash"); }, 2600);
      });
    });
    root.querySelector(".tkm-x").addEventListener("click", function () {
      alive = false; halt();
      root.hidden = true;
      extras.forEach(function (e) { e.remove(); });
      store("sessionStorage", "tkm-off", "1");
    });
    btn.addEventListener("mouseenter", function () { hovered = true; halt(); if (!sayEl.classList.contains("show")) speak(SAY.hello, 4000); });
    btn.addEventListener("mouseleave", function () { hovered = false; });
    btn.addEventListener("focus", function () { hovered = true; halt(); speak(SAY.hello, 4000); });
    btn.addEventListener("blur", function () { hovered = false; });
    if (!onProject) {
      var current = null;
      document.addEventListener("mouseover", function (e) {
        var entry = e.target.closest && e.target.closest("#projects .entry");
        if (entry === current) return;
        current = entry;
        if (entry) speak(SAY.over, 2600); else quiet();
      });
    }
    window.addEventListener("resize", function () { if (!root.classList.contains("seated")) place(clamp(x, 8, vw() - W() - 8), clamp(y, topY(), floorY())); });

    /* ---------------------------------------------------------------- start */
    async function start() {
      if (reduce || !root.animate) {
        place(vw() - W() - 14, floorY()); root.hidden = false; speak(SAY.hello, 7000);
        return;
      }
      var seenKey = "tkm-seen-" + page;
      var scene = forced || (store("sessionStorage", seenKey) ? "poof" : SCENES[page] || "poof");
      store("sessionStorage", seenKey, "1");
      busy = true;
      try {
        if (scene === "crash") await enterCrash();
        else if (scene === "poof") await enterPoof();
        else await enterRide(scene);
      } catch (e) {   // anything odd: fall back to standing in the corner
        document.body.appendChild(root);
        root.classList.remove("seated", "legless", "ball", "dizzy");
        root.style.width = ""; root.style.height = "";
        place(vw() - W() - 14, floorY()); root.hidden = false; root.classList.add("float");
      }
      busy = false;
      life();
    }
    setTimeout(start, reduce ? 600 : 1100);
  });
})();
