// A pretend tile line that runs in the browser, so the master's Plant 3D view works on a
// static site with no Pi, broker or hardware. It is a JavaScript port of the project's own
// master_node/python/master/demo.py (DemoLine) and plant.py (build_plant): same grades, same
// timings, same fail-closed behaviour (hold tiles pause the feed, a camera fault every ~50 s).
// Everything it produces is synthetic. It is not evidence about the real line.

const GRADES = ['Grade A', 'Grade B', 'Reject'];
const WEIGHTS = [7, 2, 1];
const BINS = { 'Grade A':'bin_1', 'Grade B':'bin_2', 'Grade C':'bin_3', 'Reject':'bin_reject', 'Hold':'bin_hold' };

const LINE_TRANSIT_S = 14.0, SORTED_VISIBLE_S = 20.0;
const STAGE_U_CAP = { camera:0.58, acoustic:0.88, sorted:1.0 };
const STATION_U = { camera:0.25, acoustic:0.6, gantry:0.9 };

function pick(rng) {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < GRADES.length; i++) { if ((r -= WEIGHTS[i]) < 0) return GRADES[i]; }
  return GRADES[0];
}

export class DemoLine {
  constructor({ interval = 4.0, transit = 2.5, faultEvery = 50.0, faultFor = 9.0 } = {}) {
    Object.assign(this, { interval, transit, faultEvery, faultFor });
    this.rng = Math.random;
    this.holdAll = false; this.vote = false; this.strike = true;
    this.belt = 60; this.stopped = false; this.saved = {};
    this.feedPaused = false; this.needsPerson = []; this.held = [];
    this.gantryPaused = false;
    this.tally = {}; this.n = 0; this.awaiting = [];
    this.recent = new Map();                 // tile_id -> record, as the master's SQLite copy would hold it
    this.alarms = [];
    const now = this.clock();
    this.camFaultUntil = 0; this.lastFault = now; this.lastTile = 0;
    this.health = {}; this.state = 'waiting'; this.detail = 'waiting for a tile';
    this.step(now);
    this.timer = setInterval(() => this.step(this.clock()), 250);
  }
  clock() { return performance.now() / 1000; }

  // ---- commands from the master ----
  command(path, body) {
    switch (path) {
      case 'line': return this.line(body.state, body.belt_percent);
      case 'belt': {
        const p = body.percent;
        if (typeof p !== 'number' || p < 0 || p > 100) return 'belt percent must be 0 to 100';
        this.belt = p; return null;
      }
      case 'feed': this.setFeed(body.state === 'pause'); return null;
      case 'gantry': this.gantryPaused = body.cmd === 'pause'; return null;
      case 'hold_all': this.holdAll = !!body.enabled; return null;
      case 'vote': this.vote = !!body.enabled; return null;
      case 'strike': this.strike = !!body.enabled; return null;
      case 'clear_alarms': this.alarms = []; return null;
      default: return 'unknown command';
    }
  }
  line(state, pct) {
    if (state === 'stop') {
      if (!this.stopped) { this.saved = { holdAll:this.holdAll, belt:this.belt > 0 ? this.belt : null }; this.stopped = true; }
      this.holdAll = true; this.belt = 0; this.strike = false;
      this.setFeed(true);
    } else if (state === 'start') {
      pct = pct ?? this.saved.belt ?? (this.stopped ? null : this.belt);
      if (pct == null || !(pct > 0 && pct <= 100)) return 'no belt speed to start at: set the belt first';
      this.holdAll = !!this.saved.holdAll;
      this.stopped = false; this.belt = pct; this.strike = true; this.saved = {};
      if (!this.needsPerson.length) this.setFeed(false);   // Start does not confirm hold tiles are gone; Resume feed does
    }
    return null;
  }
  setFeed(paused) {
    this.feedPaused = paused;
    if (!paused) {
      for (const id of this.needsPerson) this.recent.delete(id);   // resuming is the person's confirmation
      this.needsPerson = [];
      const held = this.held; this.held = [];
      for (const [id, p] of held) this.deliver(id, p);
    }
  }
  deliver(id, p) {
    const row = this.recent.get(id);
    if (p.final === 'Hold') {                       // a person's job: never sent to the gantry; it pauses the feed
      this.needsPerson.push(id); this.feedPaused = true;
      if (row) Object.assign(row, { needs_person:true, final_grade:'Hold', destination:BINS.Hold });
      return;
    }
    if (this.feedPaused) { this.held.push([id, p]); return; }
    if (row) Object.assign(row, { final_grade:p.final, destination:BINS[p.final] });
  }

  // ---- the line ----
  step(now) {
    let faulty = now < this.camFaultUntil;
    if (!faulty && now - this.lastFault >= this.faultEvery) {
      this.lastFault = now; this.camFaultUntil = now + this.faultFor; faulty = true;
      this.alarms.unshift({ ts:now, level:'alarm', kind:'camera_silent', message:'demo: the camera service stopped sending heartbeats' });
      this.alarms = this.alarms.slice(0, 10);
    }
    if (this.belt > 0 && !faulty && now - this.lastTile >= this.interval) {
      this.lastTile = now; this.n += 1;
      const id = 'DEMO-' + String(this.n).padStart(5, '0');
      const grade = pick(this.rng);
      this.recent.set(id, { tile_id:id, first_ts:now, camera_grade:grade });
      this.awaiting.push({ id, camera:grade, due:now + this.transit });
    }
    while (this.awaiting.length && now >= this.awaiting[0].due) this.finish(this.awaiting.shift());

    // forget records nobody can see any more
    for (const [id, r] of this.recent) if (!r.needs_person && now - r.first_ts > 60) this.recent.delete(id);

    const unoq = this.needsPerson.length
      ? { level:'warn', detail:`${this.needsPerson.length} hold tile(s) need a person - take them off the belt, then Resume feed (${this.held.length} held back)` }
      : this.feedPaused ? { level:'warn', detail:`feed paused by the master, ${this.held.length} held back` }
      : this.gantryPaused ? { level:'warn', detail:'paused' }
      : { level:'ok', detail:'demo acknowledgements' };
    this.health = {
      camera: faulty ? { level:'fail', detail:`silent for ${this.faultFor} s (demo fault)` } : { level:'ok', detail:`${this.n} tiles` },
      mic: { level:'ok', detail:'synthetic microphone' + (this.strike ? '' : ', striker inhibited') },
      nano: { level:'ok', detail:`belt ${this.belt.toFixed(0)} %` },
      unoq,
    };
    if (faulty) [this.state, this.detail] = ['fault', 'camera: demo fault'];
    else if (this.stopped) [this.state, this.detail] = ['line_stopped', 'line stopped (soft stop from the master - not an e-stop)'];
    else if (this.holdAll) [this.state, this.detail] = ['hold_all', 'every tile is being held for a person'];
    else if (this.awaiting.length) [this.state, this.detail] = ['awaiting_tap', `${this.awaiting.length} tile(s) waiting for a tap`];
    else [this.state, this.detail] = ['waiting', 'waiting for a tile'];
  }
  finish(t) {
    const row = this.recent.get(t.id);
    if (this.strike && row) row.acoustic_grade = t.camera;     // demo: sound copies the camera
    let final = t.camera;
    if (this.holdAll) final = 'Hold';
    this.tally[final] = (this.tally[final] || 0) + 1;
    this.deliver(t.id, { final });
  }

  // ---- what /api/plant returns (plant.py build_plant) ----
  plant() {
    const now = this.clock();
    const lvl = s => s === 'fault' ? 'fail' : (s === 'hold_all' || s === 'line_stopped') ? 'warn' : 'ok';
    const st = [
      { id:'pi', label:'Station service (Pi)', level:lvl(this.state), detail:this.detail },
      { id:'camera', label:'Camera station', ...this.health.camera },
      { id:'acoustic', label:'Acoustic station', ...this.health.mic },
      { id:'conveyor', label:'Conveyor (Nano)', ...this.health.nano },
      { id:'gantry', label:'Pick & place (UNO Q)', ...this.health.unoq },
      { id:'master', label:'Master PC', level:'ok', detail:'observer + data collector (this page)' },
    ].map(s => ({ ...s, u:STATION_U[s.id] ?? null }));

    const tiles = [];
    const rows = [...this.recent.values()].sort((a, b) => b.first_ts - a.first_ts);
    for (const r of rows) {
      const age = Math.max(0, now - r.first_ts);
      const stage = r.needs_person ? 'needs_person' : r.final_grade ? 'sorted' : r.acoustic_grade ? 'acoustic' : 'camera';
      if (stage === 'sorted' && age > SORTED_VISIBLE_S) continue;
      tiles.push({ tile_id:r.tile_id, stage, age_s:age, u:Math.min(age / LINE_TRANSIT_S, STAGE_U_CAP[stage] ?? 1),
                   grade:r.final_grade || r.camera_grade, destination:r.destination || null });
    }
    return {
      now, demo:true, demo_label:'demo — synthetic line', controls:true, broker_connected:true,
      line: { state:this.state, detail:this.detail, belt_pct:this.belt, hold_all:this.holdAll, stopped:this.stopped,
              feed_paused:this.feedPaused, held_back:this.held.length, needs_person:this.needsPerson.length,
              vote_enabled:this.vote, awaiting:this.awaiting.length },
      stations: st, tiles, tally:{ ...this.tally }, alarms:this.alarms.slice(),
    };
  }
}
