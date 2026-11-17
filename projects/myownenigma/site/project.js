"use strict";
(() => {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const ROTORS = {
    I:   { w: "EKMFLGDQVZNTOWYHXUSPAIBRCJ", n: "Q" },
    II:  { w: "AJDKSIRUXBLHWTMCQGZNPYFVOE", n: "E" },
    III: { w: "BDFHJLCPRTXVZNYEIWGAKMUSQO", n: "V" },
    IV:  { w: "ESOVPZJAYQUIRHXLNFTGKDCMWB", n: "J" },
    V:   { w: "VZBRGITYUPSDNHLXAWMJQOFECK", n: "Z" },
  };
  const REFLECTORS = { B: "YRUHQSLDPXNGOKMIEBFZCWVJAT", C: "FVPJIAOYEDRZXWGCTKUQSBNMHL" };
  const PRESETS = [{"name": "Enigma I, I-II-III, no plugs", "rotors": ["I", "II", "III"], "rings": "AAA", "reflector": "B", "plugs": ""}, {"name": "Enigma I with plugboard", "rotors": ["I", "II", "III"], "rings": "AAA", "reflector": "B", "plugs": "AV BS CG DL FU HZ IN KM OW RX"}, {"name": "Rotors III-I-II, rings BCD", "rotors": ["III", "I", "II"], "rings": "BCD", "reflector": "B", "plugs": "AB CD EF"}, {"name": "Rotors IV-V-I, reflector C", "rotors": ["IV", "V", "I"], "rings": "AAA", "reflector": "C", "plugs": ""}];
  const VECTORS = [{"name": "Published, rotors I-II-III", "rotors": ["I", "II", "III"], "rings": "AAA", "start": "AAA", "reflector": "B", "plugs": "", "plain": "AAAAA", "cipher": "BDZGO"}, {"name": "Published, 26 letters", "rotors": ["I", "II", "III"], "rings": "AAA", "start": "AAA", "reflector": "B", "plugs": "", "plain": "AAAAAAAAAAAAAAAAAAAAAAAAAA", "cipher": "BDZGOWCXLTKSBTMCDLPBMUQOFX"}, {"name": "Double-step from ADU", "rotors": ["I", "II", "III"], "rings": "AAA", "start": "ADU", "reflector": "B", "plugs": "", "plain": "AAAAAAAAAAAA", "cipher": "EQIBMGFJBWZF"}, {"name": "FPGA preset 0", "rotors": ["I", "II", "III"], "rings": "AAA", "start": "AAA", "reflector": "B", "plugs": "", "plain": "HELLOWORLDENIGMA", "cipher": "ILBDAAMTAZNMRZAC"}, {"name": "FPGA preset 1", "rotors": ["I", "II", "III"], "rings": "AAA", "start": "QWE", "reflector": "B", "plugs": "AV BS CG DL FU HZ IN KM OW RX", "plain": "HELLOWORLDENIGMA", "cipher": "UCSKNAQHDCZUFHJV"}, {"name": "FPGA preset 2", "rotors": ["III", "I", "II"], "rings": "BCD", "start": "ZDU", "reflector": "B", "plugs": "AB CD EF", "plain": "HELLOWORLDENIGMA", "cipher": "SLQPEQZURYAFKYOM"}, {"name": "FPGA preset 3", "rotors": ["IV", "V", "I"], "rings": "AAA", "start": "MCK", "reflector": "C", "plugs": "", "plain": "HELLOWORLDENIGMA", "cipher": "AMFHFRZVDPMOMSAP"}];
  const LAYOUT = ["QWERTZUIO", "ASDFGHJK", "PYXCVBNML"];
  const mod26 = (n) => ((n % 26) + 26) % 26;
  const $ = (id) => document.getElementById(id);

  function parsePlugs(spec) {
    const map = Array.from({ length: 26 }, (_, i) => i);
    const tokens = spec.toUpperCase().split(/\s+/).filter(Boolean);
    if (tokens.length > 10) return { map, error: "At most 10 plug pairs." };
    const used = new Set();
    for (const t of tokens) {
      if (!/^[A-Z]{2}$/.test(t)) return { map, error: `"${t}" is not a pair of two letters.` };
      if (t[0] === t[1]) return { map, error: `${t} connects a letter to itself.` };
      const a = A.indexOf(t[0]), b = A.indexOf(t[1]);
      if (used.has(a) || used.has(b)) return { map, error: `A letter appears twice (${t}).` };
      used.add(a); used.add(b); map[a] = b; map[b] = a;
    }
    return { map, error: null };
  }

  class Machine {
    constructor(rotors, rings, pos, reflector, plugMap) {
      this.rotors = rotors; this.rings = rings; this.pos = pos.slice(); this.reflector = reflector; this.plug = plugMap;
    }
    notch(slot) { return A.indexOf(ROTORS[this.rotors[slot]].n); }
    step() {
      const midAt = this.pos[1] === this.notch(1), rightAt = this.pos[2] === this.notch(2);
      if (midAt) this.pos[0] = mod26(this.pos[0] + 1);
      if (midAt || rightAt) this.pos[1] = mod26(this.pos[1] + 1);
      this.pos[2] = mod26(this.pos[2] + 1);
    }
    pass(slot, c, forward) {
      const w = ROTORS[this.rotors[slot]].w;
      const shift = mod26(this.pos[slot] - this.rings[slot]);
      const entry = mod26(c + shift);
      const out = forward ? A.indexOf(w[entry]) : w.indexOf(A[entry]);
      return mod26(out - shift);
    }
    press(c) {
      this.step();
      const trace = [c];
      c = this.plug[c]; trace.push(c);
      for (const s of [2, 1, 0]) { c = this.pass(s, c, true); trace.push(c); }
      c = A.indexOf(REFLECTORS[this.reflector][c]); trace.push(c);
      for (const s of [0, 1, 2]) { c = this.pass(s, c, false); trace.push(c); }
      c = this.plug[c]; trace.push(c);
      return { out: c, trace };
    }
  }

  function machineFrom(cfg) {
    const plugs = parsePlugs(cfg.plugs || "");
    return new Machine(cfg.rotors, [...cfg.rings].map((ch) => A.indexOf(ch)), [...cfg.start].map((ch) => A.indexOf(ch)), cfg.reflector, plugs.map);
  }

  // ---- self-check -------------------------------------------------------------------------
  function runSelfCheck() {
    let ok = 0;
    const list = $("sc-list");
    list.textContent = "";
    for (const v of VECTORS) {
      const m = machineFrom(v);
      const got = [...v.plain].map((ch) => A[m.press(A.indexOf(ch)).out]).join("");
      const pass = got === v.cipher;
      if (pass) ok++;
      const mark = document.createElement("span"); mark.className = pass ? "ok" : "bad"; mark.textContent = pass ? "✓" : "✗";
      const text = document.createElement("span");
      text.textContent = `${v.name}: ${v.plain.length > 14 ? v.plain.slice(0, 14) + "…" : v.plain} → ${v.cipher.length > 14 ? v.cipher.slice(0, 14) + "…" : v.cipher}` + (pass ? "" : ` (this page computed ${got})`);
      list.append(mark, text);
    }
    $("sc-badge").textContent = `${ok} of ${VECTORS.length} vectors match`;
    $("selfcheck").classList.toggle("fail", ok !== VECTORS.length);
  }

  // ---- machine UI -------------------------------------------------------------------------------
  const letterOptions = (sel, selected) => { sel.textContent = ""; for (const ch of A) { const o = document.createElement("option"); o.textContent = ch; sel.append(o); } sel.value = selected; };
  for (const id of ["rot-l", "rot-m", "rot-r"]) { const s = $(id); for (const r of Object.keys(ROTORS)) { const o = document.createElement("option"); o.textContent = r; s.append(o); } }
  for (const id of ["ring-l", "ring-m", "ring-r", "start-l", "start-m", "start-r"]) letterOptions($(id), "A");

  const lampEls = {}, keyEls = {};
  const lampsRoot = $("lamps"), keysRoot = $("keys");
  for (const row of LAYOUT) {
    const lr = document.createElement("div"); lr.className = "krow";
    const kr = document.createElement("div"); kr.className = "krow";
    for (const ch of row) {
      const l = document.createElement("div"); l.className = "lamp"; l.textContent = ch; l.setAttribute("aria-hidden", "true"); lr.append(l); lampEls[ch] = l;
      const k = document.createElement("button"); k.className = "key"; k.type = "button"; k.textContent = ch; k.setAttribute("aria-label", `Key ${ch}`); kr.append(k); keyEls[ch] = k;
    }
    lampsRoot.append(lr); keysRoot.append(kr);
  }

  let machine = null, valid = true, plainTape = "", cipherTape = "", lampTimer = null, playToken = 0;

  function readConfig() {
    return {
      rotors: ["rot-l", "rot-m", "rot-r"].map((id) => $(id).value),
      rings: ["ring-l", "ring-m", "ring-r"].map((id) => $(id).value).join(""),
      start: ["start-l", "start-m", "start-r"].map((id) => $(id).value).join(""),
      reflector: $("refl").value,
      plugs: $("plugs").value,
    };
  }
  function windows() { ["l", "m", "r"].forEach((s, i) => { $("win-" + s).textContent = A[machine.pos[i]]; }); }
  function clearLamps() { for (const ch in lampEls) lampEls[ch].classList.remove("on"); }
  function renderTape() {
    const group = (t) => t.replace(/(.{5})/g, "$1 ").trim();
    $("tape-in").textContent = group(plainTape); $("tape-out").textContent = group(cipherTape);
  }
  function clearTrace() { $("trace").textContent = ""; }

  function rebuild(clearTapes) {
    const cfg = readConfig();
    const plugs = parsePlugs(cfg.plugs);
    let err = plugs.error;
    if (!err && new Set(cfg.rotors).size !== 3) err = "Each rotor can be fitted only once.";
    valid = !err;
    $("msg").textContent = err || "";
    keysRoot.setAttribute("aria-disabled", valid ? "false" : "true");
    machine = machineFrom(cfg);
    windows(); clearLamps(); clearTrace();
    if (clearTapes) { plainTape = ""; cipherTape = ""; renderTape(); }
  }

  const LABELS = ["Key", "Plugboard", "Right rotor", "Middle rotor", "Left rotor", "Reflector", "Left rotor", "Middle rotor", "Right rotor", "Plugboard"];
  function showTrace(trace) {
    const ol = $("trace"); ol.textContent = "";
    trace.forEach((c, i) => {
      const li = document.createElement("li");
      if (i >= 6) li.className = "back";
      const s = document.createElement("strong"); s.textContent = A[c];
      const e = document.createElement("em"); e.textContent = LABELS[i];
      li.append(s, e); ol.append(li);
    });
    $("trace-note").textContent = `The rotors stepped to ${A[machine.pos[0]]}${A[machine.pos[1]]}${A[machine.pos[2]]} before the letter flowed. ${A[trace[0]]} became ${A[trace[trace.length - 1]]}; it can never be the same letter.`;
  }

  function press(letter, hold) {
    if (!valid) return;
    const res = machine.press(A.indexOf(letter));
    const out = A[res.out];
    plainTape += letter; cipherTape += out; renderTape(); windows(); showTrace(res.trace);
    clearLamps(); lampEls[out].classList.add("on");
    $("announce").textContent = `${letter} becomes ${out}`;
    clearTimeout(lampTimer);
    if (!hold) lampTimer = setTimeout(clearLamps, 650);
  }
  function release() { clearTimeout(lampTimer); lampTimer = setTimeout(clearLamps, 180); }

  for (const ch in keyEls) {
    const k = keyEls[ch];
    k.addEventListener("pointerdown", (e) => { e.preventDefault(); k.classList.add("down"); press(ch, true); });
    const up = () => { if (k.classList.contains("down")) { k.classList.remove("down"); release(); } };
    k.addEventListener("pointerup", up); k.addEventListener("pointerleave", up); k.addEventListener("pointercancel", up);
    k.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") e.preventDefault(); });
  }
  const typing = (t) => t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA");
  document.addEventListener("keydown", (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
    const ch = e.key.length === 1 ? e.key.toUpperCase() : "";
    if (ch && keyEls[ch]) { playToken++; keyEls[ch].classList.add("down"); press(ch, true); }
  });
  document.addEventListener("keyup", (e) => {
    const ch = e.key.length === 1 ? e.key.toUpperCase() : "";
    if (ch && keyEls[ch]) { keyEls[ch].classList.remove("down"); release(); }
  });

  async function autoType(text) {
    const token = ++playToken;
    for (const ch of text) {
      if (token !== playToken) return;
      keyEls[ch].classList.add("down"); press(ch, true);
      await new Promise((r) => setTimeout(r, 170));
      keyEls[ch].classList.remove("down");
      await new Promise((r) => setTimeout(r, 190));
    }
    release();
  }

  // presets
  const presetRoot = $("presets");
  PRESETS.forEach((p, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "btn"; b.dataset.index = i;
    b.setAttribute("aria-pressed", "false");
    const title = document.createElement("span"); title.textContent = `Preset ${i}`;
    const sm = document.createElement("small"); sm.textContent = p.name;
    b.append(title, sm); presetRoot.append(b);
    b.addEventListener("click", () => {
      playToken++;
      ["l", "m", "r"].forEach((s, k) => { $("rot-" + s).value = p.rotors[k]; $("ring-" + s).value = p.rings[k]; $("start-" + s).value = "A"; });
      $("refl").value = p.reflector; $("plugs").value = p.plugs;
      presetRoot.querySelectorAll(".btn").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
      rebuild(true);
    });
  });
  const unpress = () => presetRoot.querySelectorAll(".btn").forEach((x) => x.setAttribute("aria-pressed", "false"));
  for (const id of ["rot-l", "rot-m", "rot-r", "ring-l", "ring-m", "ring-r", "start-l", "start-m", "start-r", "refl"]) $(id).addEventListener("change", () => { playToken++; unpress(); rebuild(true); });
  $("plugs").addEventListener("input", () => { playToken++; unpress(); rebuild(true); });

  $("btn-new").addEventListener("click", () => { playToken++; rebuild(true); });
  $("btn-hello").addEventListener("click", () => { rebuild(true); if (valid) autoType("HELLOWORLD"); });
  $("btn-decrypt").addEventListener("click", () => {
    const text = cipherTape;
    if (!text) { $("msg").textContent = "Type something first, then decrypt it."; return; }
    rebuild(true); if (valid) autoType(text);
  });
  $("btn-copy").addEventListener("click", async () => {
    const btn = $("btn-copy");
    try { await navigator.clipboard.writeText(cipherTape); btn.textContent = "Copied"; }
    catch (e) { btn.textContent = "Select the text and copy"; }
    setTimeout(() => { btn.textContent = "Copy output"; }, 1500);
  });

  // start state: preset 0, one example already on the tape so the page is complete at rest
  presetRoot.querySelector(".btn").click();
  for (const ch of "ENIGMA") press(ch, true);
  clearLamps();
  runSelfCheck();
})();
