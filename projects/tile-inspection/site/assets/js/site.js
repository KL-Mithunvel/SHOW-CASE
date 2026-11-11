(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked: fine */ } },
  };

  /* ---------- theme: system → light → dark ---------- */
  const root = document.documentElement;
  const themeBtn = $('#themeBtn');
  const applyTheme = t => {
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    themeBtn.textContent = t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'Auto';
    themeBtn.setAttribute('aria-label', 'Colour theme: ' + themeBtn.textContent + '. Click to change.');
  };
  let theme = store.get('theme') || 'system';
  applyTheme(theme);
  themeBtn.addEventListener('click', () => {
    theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    store.set('theme', theme); applyTheme(theme);
  });

  /* ---------- media slots: show a placeholder until the file exists ---------- */
  for (const slot of $$('.slot')) {
    const m = $('.media img, .media video', slot);
    if (!m) continue;
    const empty = () => slot.classList.add('empty');
    const full = () => slot.classList.remove('empty');
    if (m.tagName === 'IMG') {
      m.addEventListener('error', empty); m.addEventListener('load', full);
      if (m.complete && m.naturalWidth === 0) empty();
    } else {
      m.addEventListener('error', empty); m.addEventListener('loadedmetadata', full);
      if (m.error || m.networkState === 3) empty();
    }
  }
  for (const img of $$('img.opt-img')) {
    const drop = () => img.remove();
    img.addEventListener('error', drop);
    if (img.complete && img.naturalWidth === 0) drop();
  }
  // optional links (e.g. the report PDF) appear only once the file is in the repo
  for (const a of $$('[data-probe]')) {
    fetch(a.dataset.probe, { method: 'HEAD' }).then(r => { if (r.ok) a.hidden = false; }).catch(() => {});
  }

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  const openLb = (src, alt, cap) => {
    lbImg.src = src; lbImg.alt = alt || ''; lbCap.textContent = cap || '';
    if (typeof lb.showModal === 'function') lb.showModal(); else window.open(src, '_blank');
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('button.zoom');
    if (!b) return;
    const img = $('img', b); if (!img || !img.naturalWidth) return;
    const cap = b.closest('figure') && $('figcaption', b.closest('figure'));
    openLb(img.currentSrc || img.src, img.alt, cap ? cap.textContent : img.alt);
  });
  $('#lbClose').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });

  /* ---------- 3D plant: load on demand ---------- */
  $('#plantStart').addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = 'plant3d.html?embed=1';
    f.title = 'Interactive 3D view of the tile line (synthetic demo line)';
    f.setAttribute('allow', 'fullscreen');
    $('#plantFrame').replaceChildren(f);
    f.focus();
  });

  /* ---------- 88-tile result grid ---------- */
  for (const el of $$('[data-cells]')) {
    const frag = document.createDocumentFragment();
    for (const part of el.dataset.cells.split(' ')) {
      const g = part[0], n = +part.slice(1);
      for (let i = 0; i < n; i++) { const c = document.createElement('i'); c.className = 'g' + g; frag.appendChild(c); }
    }
    el.appendChild(frag);
  }
  // pixel strips, drawn to scale: 1 square = 1 px on the sensor
  const strip = (el, from, to, soft) => {
    for (let i = 0; i < 14; i++) {
      const c = document.createElement('i');
      const on = i >= from && i <= to;
      c.style.background = on ? (soft ? 'color-mix(in srgb, var(--ink) 45%, var(--rule))' : 'var(--ink)') : 'var(--rule)';
      el.appendChild(c);
    }
  };
  strip($('#pxCrack'), 6, 7, false);
  strip($('#pxBlur'), 3, 9, true);

  /* ---------- software tabs ---------- */
  const SW = [
    { id: 'plant', name: 'Plant 3D', img: 'master_plant_3d', alt: 'Master Plant 3D view with station list, line control and grade tally',
      text: 'The whole line in Three.js: status lights follow each station\'s health, tiles ride the belt coloured by grade, and the side panel carries soft controls (start/stop, belt speed, hold-all, sound vote, striker inhibit, feed pause). Tile positions are derived from which stations have reported, not measured.' },
    { id: 'analysis', name: 'Analysis', img: 'master_analysis', alt: 'Analysis view with throughput, grade mix and camera vs sound agreement',
      text: 'Tiles over time by final grade, destinations, throughput, reject/hold/time-out rates and how often camera and sound agree. Rates over fewer than 20 graded tiles carry a "treat as noise" note.' },
    { id: 'trouble', name: 'Troubleshoot', img: 'master_troubleshoot', alt: 'Troubleshoot view with attention list and station uptime timeline',
      text: 'What needs attention now, a per-station health timeline with uptime, and a cheapest-first list of checks matched on the detail strings the Pi really emits. The checks are suggestions, not verified diagnoses.' },
    { id: 'ai', name: 'AI insights', img: 'insights_fault_4_camera_sound_disagree', alt: 'AI insights page: rule-based finding that camera and sound disagree, with the local model\'s explanation',
      text: 'A rule-based detector found that camera and sound agreed on only 29 % of recent tiles against 89 % before. The local model then explained it for the operator in 12 s. Detection stays rule-based because the model sometimes suggests causes the data does not support.' },
    { id: 'record', name: 'Pi record', img: 'master_pi_record_tile_detail', alt: 'Pi record tile detail with the timeline of one tile',
      text: 'Every tile keeps a digital trail: image, tap data and acoustic features, defect sizes, the final grade and the reason for it, size, batch and time. Today\'s manual sheets record only daily totals per grade.' },
    { id: 'label', name: 'Labelling', img: 'annotator_3_pipeline_readings', alt: 'Tile annotator showing the pipeline readings for one tile',
      text: 'A human-in-the-loop calibration workflow: each graded tile is saved with an operator\'s verdict, so crack and corner thresholds come from the line\'s own labelled footage.' },
  ];
  const tabs = $('#swTabs'), panel = $('#swPanel');
  const showSw = id => {
    const s = SW.find(x => x.id === id) || SW[0];
    for (const b of $$('button', tabs)) b.setAttribute('aria-selected', String(b.dataset.id === s.id));
    panel.innerHTML = '';
    const fig = document.createElement('figure');
    fig.innerHTML = '<button class="zoom" type="button"><img class="shot" alt=""></button><figcaption></figcaption>';
    const img = $('img', fig); img.src = 'media/screens/' + s.img + '.webp'; img.alt = s.alt;
    $('figcaption', fig).textContent = 'Synthetic demo data — screens taken with no hardware attached.';
    const p = document.createElement('div'); p.className = 'prose';
    const h = document.createElement('h3'); h.textContent = s.name;
    const t = document.createElement('p'); t.textContent = s.text;
    p.append(h, t); panel.append(fig, p);
  };
  for (const s of SW) {
    const b = document.createElement('button');
    b.type = 'button'; b.role = 'tab'; b.dataset.id = s.id; b.textContent = s.name;
    b.addEventListener('click', () => showSw(s.id));
    tabs.appendChild(b);
  }
  showSw('plant');

  /* ---------- model tabs ---------- */
  const mTabs = $$('#modelTabs button');
  for (const b of mTabs) b.addEventListener('click', () => {
    for (const o of mTabs) { const on = o === b; o.setAttribute('aria-selected', String(on)); $('#' + o.dataset.panel).hidden = !on; }
  });

  /* ---------- gallery ---------- */
  const G = [
    ['Master', 'master_plant_3d', 'Plant 3D view'], ['Master', 'master_plant_view_camera', 'Camera preset'], ['Master', 'master_plant_view_acoustic', 'Acoustic preset'],
    ['Master', 'master_plant_view_gantry', 'Gantry preset'], ['Master', 'master_plant_view_bins', 'Bins preset'], ['Master', 'master_plant_view_master', 'Master PC and operator'],
    ['Master', 'master_analysis', 'Analysis'], ['Master', 'master_troubleshoot', 'Troubleshoot'], ['Master', 'master_control_panel_nodes', 'Control panel: nodes'],
    ['Master', 'master_open_guis_menu', 'Open GUIs menu'], ['Master', 'master_pi_record_tiles', 'Pi record: tiles'], ['Master', 'master_pi_record_tile_detail', 'Pi record: one tile'],
    ['Master', 'master_pi_record_integrity', 'Pi record: integrity check'], ['Master', 'master_classic', 'Classic single-page view'],
    ['AI insights', 'insights_fault_1_reject_rate', 'Reject rate rising'], ['AI insights', 'insights_fault_2_hold_rate', 'More tiles held'],
    ['AI insights', 'insights_fault_3_no_tap_timeouts', 'Tap time-outs'], ['AI insights', 'insights_fault_4_camera_sound_disagree', 'Camera and sound disagree'],
    ['AI insights', 'insights_fault_5_slow_transit', 'Slow camera-to-grade'], ['AI insights', 'insights_fault_6_low_throughput', 'Low throughput'],
    ['AI insights', 'insights_fault_7_alarm_burst', 'Repeating alarm'], ['AI insights', 'master_insights_ai_error', 'Model missing: real error path'],
    ['Camera', 'camera_dashboard', 'Camera dashboard'], ['Camera', 'annotator_1_tile', 'Annotator: tile'], ['Camera', 'annotator_2_context_view', 'Annotator: context'],
    ['Camera', 'annotator_3_pipeline_readings', 'Annotator: readings'], ['Camera', 'annotator_4_zoomed', 'Annotator: zoom'], ['Camera', 'review_sheet_labelling_html', 'Borderline-tile review sheet'],
    ['Station', 'station_run', 'Pi station: run view'], ['Station', 'station_service', 'Pi station: service view'],
    ['Pick & place', 'pickplace_twin_running_jobs', 'Twin running jobs'], ['Pick & place', 'pickplace_twin_idle', 'Twin: needs homing'], ['Pick & place', 'pickplace_twin_top_view', 'Twin: top view'],
    ['Acoustic', 'acoustic_analysis_01-collect-setup', 'Collect: setup'], ['Acoustic', 'acoustic_analysis_02-collect-listen', 'Collect: listen'],
    ['Acoustic', 'acoustic_analysis_03-collect-review', 'Collect: review'], ['Acoustic', 'acoustic_analysis_04-library', 'Library'],
    ['Acoustic', 'acoustic_analysis_05-analyze', 'Analyze'], ['Acoustic', 'acoustic_analysis_06-export', 'Export'], ['Acoustic', 'acoustic_analysis_07-settings', 'Settings'],
    ['Acoustic', 'acoustic_analysis_screen_slice', 'Video slice tool'], ['Acoustic', 'acoustic_analysis_screen_compare', 'Compare'], ['Acoustic', 'acoustic_analysis_screen_noise', 'Noise removal'],
    ['Acoustic', 'acoustic_analysis_screen_calibrate', 'Calibrate'], ['Acoustic', 'acoustic_analysis_screen_monitor', 'Monitor'],
    ['Figures', 'fig_camera_pipeline', 'Camera pipeline', 'figures'], ['Figures', 'fig_grade_fusion', 'Grade fusion', 'figures'], ['Figures', 'fig_sequence', 'Messages for one tile', 'figures'],
    ['Figures', 'fig_tap_fsm', 'Tap sequencer state machine', 'figures'], ['Figures', 'fig_acoustic_synthetic', 'Synthetic tap signals and features', 'figures'],
    ['Figures', 'fig_confusion', 'Decision against human verdict', 'figures'], ['Figures', 'fig_model_tradeoff', 'Model accuracy vs time', 'figures'],
    ['Figures', 'fig_blur', 'Motion smear vs exposure', 'figures'], ['Figures', 'fig_corner_tradeoff', 'Corner-check operating point', 'figures'],
    ['Figures', 'fig_readiness', 'Readiness matrix', 'figures'], ['Figures', 'fig_timeline', 'Hardware and data timeline', 'figures'],
    ['Figures', 'fig_method', 'Development method', 'figures'], ['Figures', 'project_overview', 'Project overview flowchart', 'figures'],
    ['Models', 'camera_confusion_matrices', 'Camera models: confusion matrices', 'models'], ['Models', 'camera_recall_by_grade', 'Camera models: recall per grade', 'models'],
    ['Models', 'acoustic_01_waveforms', 'Real strikes: waveforms', 'models'], ['Models', 'acoustic_02_average_spectra', 'Real strikes: tile vs striker spectra', 'models'],
    ['Models', 'acoustic_03_feature_spread', 'Real strikes: good vs cracked features', 'models'], ['Models', 'acoustic_04_decay', 'Real strikes: energy decay', 'models'],
    ['Models', 'acoustic_05_good_vs_cracked_before_after', 'Good vs cracked, striker removed', 'models'], ['Models', 'acoustic_06_striker_subtraction', 'Striker subtraction', 'models'],
    ['Models', 'acoustic_07_steady_peak_test', 'Steady-peak test', 'models'],
    ['Acoustic', 'acoustic_app_08-label-tool', 'Labelling tool (real strikes)'], ['Acoustic', 'acoustic_app_21-label-tool-labelled', 'Labelling tool with labels'],
    ['Acoustic', 'acoustic_app_09-test-tile', 'Test Tile screen'],    ['Figures', 'fig_acoustic_module', 'Acoustic module architecture', 'figures'],
    ['Figures', 'fig_workflow_acoustic', 'Acoustic workflow: strike to grade', 'figures'],
    ['Figures', 'fig_camera_real_frame_pipeline', 'A real frame through the camera pipeline', 'figures'],
    ['Figures', 'fig_strike_states', 'Striker states', 'figures'],
    ['Figures', 'fig_sensor_timing', 'Tile sensor and strike timing', 'figures'],
    ['Figures', 'fig_first_six', 'First six strikes against the rest', 'figures'],
    ['Models', 'fig_feature_auc', 'Sound features: cracked vs good (5 vs 17, no clear separation)', 'figures'],
    ['Models', 'fig_reference_z', 'Distance from the good-tile reference', 'figures'],
    ['Models', 'camera_confusion_normalized', 'Camera model: normalised confusion matrix', 'models'],
    ['Photos', 'camera_frame_S0020_good', 'Belt camera frame, tile S0020 (good)', 'photos_data'],
    ['Photos', 'camera_frame_S0024_cracked', 'Belt camera frame, tile S0024 (cracked)', 'photos_data'],
    ['Photos', 'tile_S0020_good', 'Tile S0020 (good)', 'photos_data'],
    ['Photos', 'tile_S0024_cracked', 'Tile S0024 (cracked)', 'photos_data'],
    ['Dataset', '3A_dslr_01', 'Grade 3A, DSLR, contact sheet 1', 'dataset'],
    ['Dataset', '3A_dslr_02', 'Grade 3A, DSLR, contact sheet 2', 'dataset'],
    ['Dataset', '3A_dslr_03', 'Grade 3A, DSLR, contact sheet 3', 'dataset'],
    ['Dataset', '3A_dslr_04', 'Grade 3A, DSLR, contact sheet 4', 'dataset'],
    ['Dataset', '3A_dslr_05', 'Grade 3A, DSLR, contact sheet 5', 'dataset'],
    ['Dataset', '3A_phone_01', 'Grade 3A, phone, contact sheet 1', 'dataset'],
    ['Dataset', '3A_phone_02', 'Grade 3A, phone, contact sheet 2', 'dataset'],
    ['Dataset', '3B_dslr_01', 'Grade 3B, DSLR, contact sheet 1', 'dataset'],
    ['Dataset', '3B_dslr_02', 'Grade 3B, DSLR, contact sheet 2', 'dataset'],
    ['Dataset', '3B_dslr_03', 'Grade 3B, DSLR, contact sheet 3', 'dataset'],
    ['Dataset', '3B_dslr_04', 'Grade 3B, DSLR, contact sheet 4', 'dataset'],
    ['Dataset', '3B_phone_01', 'Grade 3B, phone, contact sheet 1', 'dataset'],
    ['Dataset', '4_dslr_01', 'Grade 4, DSLR, contact sheet 1', 'dataset'],
    ['Dataset', '4_dslr_02', 'Grade 4, DSLR, contact sheet 2', 'dataset'],
    ['Dataset', '4_phone_01', 'Grade 4, phone, contact sheet 1', 'dataset'],
    ['Dataset', '4_phone_02', 'Grade 4, phone, contact sheet 2', 'dataset'],
    ['Dataset', '5_dslr_01', 'Grade 5, DSLR, contact sheet 1', 'dataset'],
    ['Dataset', '5_dslr_02', 'Grade 5, DSLR, contact sheet 2', 'dataset'],
    ['Dataset', '5_phone_01', 'Grade 5, phone, contact sheet 1', 'dataset'],
  ];
  const gal = $('#galleryGrid'), filt = $('#galFilters');
  const cats = ['All', ...new Set(G.map(g => g[0]))];
  for (const [cat, file, name, dir] of G) {
    const f = document.createElement('figure');
    f.dataset.cat = cat;
    f.innerHTML = '<button class="zoom" type="button"><img class="shot" loading="lazy" alt=""></button><figcaption></figcaption>';
    const img = $('img', f);
    img.src = 'media/' + (dir || 'screens') + '/' + file + '.webp';
    img.alt = cat + ': ' + name;
    if (dir) img.classList.add('fig-light');
    $('figcaption', f).textContent = name;
    gal.appendChild(f);
  }
  const setCat = c => {
    for (const b of $$('button', filt)) b.setAttribute('aria-selected', String(b.dataset.cat === c));
    for (const f of $$('figure', gal)) f.hidden = !(c === 'All' || f.dataset.cat === c);
  };
  for (const c of cats) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.cat = c; b.textContent = c;
    b.addEventListener('click', () => setCat(c)); filt.appendChild(b);
  }
  setCat('Master');

  /* ---------- hero: the line, drawn ---------- */
  const cv = $('#lineCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = 960, H = 600;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let C = {};
  const readColors = () => {
    const cs = getComputedStyle(root);
    const v = n => cs.getPropertyValue(n).trim();
    C = { paper: v('--sheet'), ink: v('--ink'), muted: v('--muted'), rule: v('--rule'), belt: v('--belt'), beltSoft: v('--belt-soft'),
          clay: v('--clay'), A: v('--g-a'), B: v('--g-b'), C: v('--g-c'), R: v('--g-r'), H: v('--g-h') };
  };
  readColors();
  new MutationObserver(readColors).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColors);

  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth || W;
    cv.width = Math.round(w * dpr); cv.height = Math.round(w * (H / W) * dpr);
    ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
  };
  fit(); addEventListener('resize', fit);

  const BELT = { x0: 30, x1: 712, y: 300, h: 128 };
  const CAM_X = 210, TAP_X = 400, PI_X = 560, PICK_X = 676, SPEED = 95, TS = 66;
  const BINS = ['A', 'B', 'C', 'R', 'H'];
  const BIN = { x: 872, y0: 92, gap: 104, s: 78 };
  const GAN = { x0: 640, x1: 940, y0: 60, y1: 548 };
  const RANK = { A: 0, B: 1, C: 2, R: 3, H: 4 };
  const counts = { A: 0, B: 0, C: 0, R: 0, H: 0 };
  let tiles = [], nextId = 41, spawnT = 0, beltOff = 0, time = 0;
  const flashes = [];
  const gantry = { x: 650, y: BELT.y, z: 1, st: 'idle', tile: null, t: 0 };

  const rnd = (a, b) => a + Math.random() * (b - a);
  function newTile() {
    const r = Math.random();
    const vis = r < 0.66 ? 'none' : r < 0.84 ? 'crack' : 'chip';
    const hidden = vis === 'none' && Math.random() < 0.14;
    const unclear = Math.random() < 0.05;
    return { id: nextId++, x: BELT.x0 - TS, y: BELT.y + rnd(-10, 10), rot: rnd(-0.06, 0.06), vis, hidden, unclear,
             cam: null, snd: null, fin: null, seenCam: false, seenTap: false, seenPi: false, phase: 'belt',
             crack: [[rnd(0.2, 0.4), rnd(0.15, 0.3)], [rnd(0.45, 0.6), rnd(0.4, 0.6)], [rnd(0.6, 0.8), rnd(0.7, 0.85)]] };
  }
  function grade(t) {
    if (t.unclear) return 'H';
    let g = t.cam;
    if (t.snd && RANK[t.snd] > RANK[g]) g = t.snd;
    return g;
  }
  // Fixed feed: one tile every SPAWN_S seconds. The gantry picks on the move (conveyor
  // tracking) and its whole cycle takes about 3 s, so it is always free before the next
  // tile reaches the pick window and tiles never queue or stop on the belt.
  const SPAWN_S = 4.0, GANTRY_V = 420, PARK = { x: 650, y: BELT.y }, PICK_FROM = 606;
  function step(dt) {
    time += dt; beltOff = (beltOff + SPEED * dt) % 32;
    spawnT -= dt;
    if (spawnT <= 0) { tiles.push(newTile()); spawnT += SPAWN_S; }
    // every tile on the belt moves at belt speed, always
    for (const t of tiles) {
      if (t.phase !== 'belt') continue;
      t.x += SPEED * dt;
      if (!t.seenCam && t.x >= CAM_X) {
        t.seenCam = true;
        t.cam = t.vis === 'none' ? 'A' : t.vis === 'crack' ? (Math.random() < 0.5 ? 'B' : 'C') : 'R';
        flashes.push({ k: 'cam', t: 0 });
      }
      if (!t.seenTap && t.x >= TAP_X) {
        t.seenTap = true; t.snd = t.hidden ? 'C' : t.cam === 'R' ? 'R' : 'A';
        flashes.push({ k: 'tap', t: 0, y: t.y });
      }
      if (!t.seenPi && t.x >= PI_X) { t.seenPi = true; t.fin = grade(t); flashes.push({ k: 'pi', t: 0 }); }
    }
    // gantry: pick the waiting tile, carry it to its bin
    const G = gantry, toward = (a, b, v) => Math.abs(b - a) <= v * dt ? b : a + Math.sign(b - a) * v * dt;
    const ready = tiles.find(t => t.phase === 'belt' && t.fin && t.x + TS / 2 >= PICK_FROM);
    if (G.st === 'idle' && ready) { G.tile = ready; G.st = 'toPick'; }
    const T = G.tile;
    let gx = PARK.x, gy = PARK.y;
    // follow the moving tile until it is lifted off the belt
    if (T && (G.st === 'toPick' || G.st === 'down' || G.st === 'grab')) { gx = T.x + TS / 2; gy = T.y; }
    if (T && (G.st === 'toBin' || G.st === 'drop' || G.st === 'rel')) { gx = BIN.x; gy = BIN.y0 + BIN.gap * BINS.indexOf(T.fin); }
    G.x = toward(G.x, gx, GANTRY_V); G.y = toward(G.y, gy, GANTRY_V);
    if (T && (G.st === 'down' || G.st === 'grab')) { G.x = gx; G.y = gy; }   // locked on while tracking
    const atXY = Math.abs(G.x - gx) < 1.5 && Math.abs(G.y - gy) < 1.5;
    const zGoal = (G.st === 'down' || G.st === 'grab' || G.st === 'drop' || G.st === 'rel') ? 0 : 1;
    G.z = toward(G.z, zGoal, 4); const atZ = G.z === zGoal;
    switch (G.st) {
      case 'toPick': if (atXY) G.st = 'down'; break;
      case 'down': if (atZ) { G.st = 'grab'; G.t = 0; } break;
      case 'grab': if ((G.t += dt) > 0.18) { T.phase = 'carried'; G.st = 'up'; } break;
      case 'up': if (atZ) G.st = 'toBin'; break;
      case 'toBin': if (atXY) G.st = 'drop'; break;
      case 'drop': if (atZ) { G.st = 'rel'; G.t = 0; } break;
      case 'rel': if ((G.t += dt) > 0.18) { counts[T.fin]++; tiles = tiles.filter(t => t !== T); G.st = 'lift'; } break;
      case 'lift': if (atZ) { G.st = 'idle'; G.tile = null; } break;
    }
    if (T && T.phase === 'carried') { T.x = G.x - TS / 2; T.y = G.y; }
    // safety net: a tile that somehow reaches the belt end unpicked rolls off rather than piling up
    tiles = tiles.filter(t => t.phase !== 'belt' || t.x < BELT.x1 + 20 || t === G.tile);
    for (const f of flashes) f.t += dt;
    while (flashes.length && flashes[0].t > 0.9) flashes.shift();
  }

  const font = (w, s) => `${w} ${s}px "IBM Plex Mono", ui-monospace, monospace`;
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function chipColor(g) { return C[g]; }
  function drawTile(t, scale = 1) {
    ctx.save();
    ctx.translate(t.x + TS / 2, t.y); ctx.rotate(t.rot); ctx.scale(scale, scale);
    const s = TS, h = s / 2;
    ctx.fillStyle = C.clay;
    ctx.beginPath();
    if (t.vis === 'chip') { ctx.moveTo(-h, -h); ctx.lineTo(h - 22, -h); ctx.lineTo(h, -h + 20); ctx.lineTo(h, h); ctx.lineTo(-h, h); }
    else ctx.rect(-h, -h, s, s);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.18; ctx.fillStyle = C.ink; ctx.fillRect(-h, h - 6, s, 6); ctx.globalAlpha = 1;
    if (t.vis === 'crack') {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.beginPath();
      t.crack.forEach(([u, v], i) => { const px = -h + u * s, py = -h + v * s; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
      ctx.stroke();
    }
    ctx.restore();
    const g = t.fin || t.cam;
    if (g) {
      const cx = t.x + TS / 2, cy = t.y - TS / 2 - 16;
      ctx.fillStyle = chipColor(g); roundRect(cx - 15, cy - 11, 30, 22, 4); ctx.fill();
      ctx.fillStyle = C.paper; ctx.font = font(700, 13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(g, cx, cy + 1);
      if (!t.fin) { ctx.strokeStyle = C.paper; ctx.setLineDash([3, 3]); roundRect(cx - 15, cy - 11, 30, 22, 4); ctx.stroke(); ctx.setLineDash([]); }
    }
    if (t.phase === 'belt') {
      ctx.fillStyle = C.muted; ctx.font = font(500, 11); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('T-' + String(t.id).padStart(4, '0'), t.x + TS / 2, t.y + TS / 2 + 8);
    }
  }
  function label(txt, x, y, col) {
    ctx.font = font(600, 12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col || C.muted;
    ctx.fillText(txt, x, y);
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
    // floor grid
    ctx.strokeStyle = C.rule; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // belt
    const by = BELT.y - BELT.h / 2;
    ctx.fillStyle = C.belt; ctx.fillRect(BELT.x0, by, BELT.x1 - BELT.x0, BELT.h);
    ctx.save(); ctx.beginPath(); ctx.rect(BELT.x0, by, BELT.x1 - BELT.x0, BELT.h); ctx.clip();
    ctx.strokeStyle = C.paper; ctx.globalAlpha = 0.12; ctx.lineWidth = 2;
    for (let x = BELT.x0 - 32 + beltOff; x < BELT.x1; x += 32) { ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x, by + BELT.h); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
    ctx.fillStyle = C.muted;
    ctx.fillRect(BELT.x0 - 4, by - 8, BELT.x1 - BELT.x0 + 8, 6); ctx.fillRect(BELT.x0 - 4, by + BELT.h + 2, BELT.x1 - BELT.x0 + 8, 6);
    // camera: arch + trigger line
    const camFlash = flashes.filter(f => f.k === 'cam').reduce((m, f) => Math.max(m, 1 - f.t / 0.6), 0);
    ctx.fillStyle = C.ink; ctx.fillRect(CAM_X - 6, by - 34, 12, BELT.h + 68);
    ctx.fillRect(CAM_X - 16, BELT.y - 14, 32, 28);
    if (camFlash > 0) { ctx.globalAlpha = 0.35 * camFlash; ctx.fillStyle = C.paper; ctx.fillRect(CAM_X - 70, by, 140, BELT.h); ctx.globalAlpha = 1; }
    ctx.strokeStyle = C.R; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(CAM_X, by - 2); ctx.lineTo(CAM_X, by + BELT.h + 2); ctx.stroke(); ctx.setLineDash([]);
    label('CAMERA', CAM_X, by - 52, C.ink); label('trigger line', CAM_X, by + BELT.h + 46);
    // striker
    ctx.fillStyle = C.ink; ctx.fillRect(TAP_X - 4, by - 34, 8, 40);
    for (const f of flashes.filter(f => f.k === 'tap')) {
      const r = 14 + f.t * 90; ctx.strokeStyle = C.ink; ctx.globalAlpha = Math.max(0, 0.55 - f.t * 0.6); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(TAP_X, f.y, r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(TAP_X, by - 6, 12, 0, Math.PI * 2); ctx.fill();
    label('STRIKER + MIC', TAP_X, by - 52, C.ink); label('listens for hidden cracks', TAP_X, by + BELT.h + 46);
    // Pi
    const piFlash = flashes.filter(f => f.k === 'pi').reduce((m, f) => Math.max(m, 1 - f.t / 0.6), 0);
    ctx.fillStyle = C.ink; roundRect(PI_X - 44, 470, 88, 52, 5); ctx.fill();
    ctx.fillStyle = piFlash > 0 ? C.A : C.muted; ctx.fillRect(PI_X - 30, 480, 8, 8);
    ctx.fillStyle = C.paper; ctx.font = font(600, 12); ctx.textAlign = 'center'; ctx.fillText('PI 5', PI_X + 6, 497);
    ctx.strokeStyle = C.muted; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(PI_X, 470); ctx.lineTo(PI_X, by + BELT.h + 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PI_X - 44, 496); ctx.lineTo(CAM_X, 496); ctx.lineTo(CAM_X, by + BELT.h + 34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(TAP_X, 496); ctx.lineTo(TAP_X, by + BELT.h + 34); ctx.stroke(); ctx.setLineDash([]);
    label('DECISION TREE · one grade', PI_X, 544);
    // bins
    BINS.forEach((g, i) => {
      const y = BIN.y0 + BIN.gap * i;
      ctx.fillStyle = C.beltSoft; ctx.strokeStyle = C.rule; ctx.lineWidth = 1.5;
      roundRect(BIN.x - BIN.s / 2, y - BIN.s / 2, BIN.s, BIN.s, 4); ctx.fill(); ctx.stroke();
      const n = Math.min(counts[g], 6);
      for (let k = 0; k < n; k++) { ctx.fillStyle = C.clay; ctx.globalAlpha = 0.45 + 0.09 * k; ctx.fillRect(BIN.x - 26 + k * 2, y - 26 - k * 2, 52, 52); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = chipColor(g); roundRect(BIN.x + BIN.s / 2 + 8, y - 11, 22, 22, 3); ctx.fill();
      ctx.fillStyle = C.paper; ctx.font = font(700, 12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(g, BIN.x + BIN.s / 2 + 19, y + 1);
      ctx.fillStyle = C.ink; ctx.font = font(600, 13); ctx.textAlign = 'right'; ctx.fillText(String(counts[g]), BIN.x - BIN.s / 2 - 8, y + 1);
    });
    // tiles on the belt (under the gantry), then carried tiles above it
    for (const t of tiles) if (t.phase === 'belt') drawTile(t);
    // gantry frame, beam and carriage
    ctx.strokeStyle = C.muted; ctx.lineWidth = 3;
    ctx.strokeRect(GAN.x0, GAN.y0, GAN.x1 - GAN.x0, GAN.y1 - GAN.y0);
    ctx.fillStyle = C.ink; ctx.globalAlpha = 0.85; ctx.fillRect(gantry.x - 8, GAN.y0, 16, GAN.y1 - GAN.y0); ctx.globalAlpha = 1;
    for (const t of tiles) if (t.phase === 'carried') drawTile(t, 1.08 - 0.08 * gantry.z);
    ctx.fillStyle = C.ink; roundRect(gantry.x - 20, gantry.y - 20, 40, 40, 5); ctx.fill();
    ctx.fillStyle = C.paper; ctx.beginPath(); ctx.arc(gantry.x, gantry.y, 6 + 6 * (1 - gantry.z), 0, Math.PI * 2); ctx.fill();
    label('GANTRY → BINS', (GAN.x0 + GAN.x1) / 2, GAN.y0 - 22, C.ink);
  }

  // warm up so the first frame already shows a working line
  for (let i = 0; i < 60 * 14; i++) step(1 / 60);
  draw();
  if (reduced) return;
  let visible = true, running = false, last = 0;
  const kick = () => { if (running || !visible || document.hidden) return; running = true; last = performance.now(); requestAnimationFrame(loop); };
  function loop(now) {
    if (!visible || document.hidden) { running = false; return; }
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.05)); last = Math.max(last, now);
    step(dt); draw(); requestAnimationFrame(loop);
  }
  new IntersectionObserver(es => { visible = es[0].isIntersecting; kick(); }).observe(cv);
  document.addEventListener('visibilitychange', kick);
  kick();
})();
