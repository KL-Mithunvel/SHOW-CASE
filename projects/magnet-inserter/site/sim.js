
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const D = window.MAGNET_DATA;
const $ = id => document.getElementById(id);
const stage = $('sim-stage');
const Y0 = D.bed[1] / 2;          // fixed world Y of the nozzle; the bed slides under it

// ---- scene (Z is up, like the printer; the viewer looks from -Y = the front) -------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e12);
scene.fog = new THREE.Fog(0x0b0e12, 700, 1800);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 3000);
camera.up.set(0, 0, 1);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.minDistance = 30; controls.maxDistance = 1200; controls.maxPolarAngle = Math.PI * 0.52;

scene.add(new THREE.HemisphereLight(0x9fb4d0, 0x1a1f27, 0.35));
const sun = new THREE.DirectionalLight(0xfff2e0, 2.2);
sun.position.set(400, -300, 520); sun.target.position.set(110, 110, 0);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.5;
Object.assign(sun.shadow.camera, { left: -320, right: 320, top: 320, bottom: -320, near: 10, far: 1400 });
scene.add(sun, sun.target);
const rim = new THREE.DirectionalLight(0x6aa8ff, 0.9); rim.position.set(-300, 400, 250); scene.add(rim);

// ---- small helpers ---------------------------------------------------------------------------
const std = (color, rough = .55, metal = .15, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...o });
const BX = (x, y, z) => new THREE.BoxGeometry(x, y, z);
const RBX = (x, y, z, r = 2) => new RoundedBoxGeometry(x, y, z, 3, r);
const CYZ = (r, h, seg = 28) => { const g = new THREE.CylinderGeometry(r, r, h, seg); g.rotateX(Math.PI / 2); return g; };   // axis along Z
function put(parent, geo, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
const M = {
  black: std(0x1b2027, .5, .4), dark: std(0x12161b, .6, .3), alu: std(0xaab2bd, .35, .85),
  accent: std(0xff9a3c, .5, .2), brass: std(0xd4a24a, .3, .9), grey: std(0x7d8696, .45, .35),
  white: std(0xf2f2ee, .6, .05), magnet: [std(0x9aa3b0, .35, .8), std(0xff4d6d, .3, .6, { emissive: 0xff1f4a, emissiveIntensity: .2 }), std(0x3b82f6, .3, .6)],   // side, north face (top), south face (bottom)
};
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
function labelTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'); draw(ctx);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return [tex, c, ctx];
}

// ---- magnet size: exactly the circle the machine printed ---------------------------------------
// nearest toolpath to the pocket centre in the layers just below the seat = the pocket wall;
// the nozzle centreline sits half a line width (0.2 mm) outside the hole, so subtract that.
const [px, py, pz] = D.pocket;
const MAG_T = 3;                                       // magnet thickness, mm (Ø6–10 × 3 mm magnets)
const magR = (() => {
  let r = Infinity;
  for (const s of D.segments) if (s[2] > pz - 2.8 && s[2] < pz) for (const k of [0, 3]) r = Math.min(r, Math.hypot(s[k] - px, s[k + 1] - py));
  return Math.max(1.5, isFinite(r) ? r - 0.2 : 5);
})();

// ---- the printer: floor, base, frame ---------------------------------------------------------
const floor = new THREE.Mesh(new THREE.CircleGeometry(1000, 72), std(0x10151b, .92, 0));
floor.position.set(D.bed[0] / 2, Y0, -60.5); floor.receiveShadow = true; scene.add(floor);
const halo = new THREE.Mesh(new THREE.RingGeometry(330, 333, 96), new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: .16 }));
halo.position.set(D.bed[0] / 2, Y0, -60.2); scene.add(halo);

const printer = new THREE.Group(); scene.add(printer);
const cx0 = D.bed[0] / 2, RY = Y0 + 40;                // frame centre X; Y of the gantry
const slope = { y: Y0 - 225 + 17.5 - 0.4, z: -30 + 0.7 };   // middle of the sloped front panel
{ // base with the sloped front the real machine has
  const yb = Y0 - 225, yt = Y0 + 225, s = new THREE.Shape();
  s.moveTo(yt, -60); s.lineTo(yb, -60); s.lineTo(yb, -40); s.lineTo(yb + 35, -20); s.lineTo(yt, -20); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 296, bevelEnabled: true, bevelSize: 2, bevelThickness: 2, bevelSegments: 2 });
  g.translate(0, 0, -148);
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));   // (u,v,depth) -> world (depth, y, z)
  g.translate(cx0, 0, 0);
  const base = new THREE.Mesh(g, M.black); base.castShadow = base.receiveShadow = true; printer.add(base);
  // CREALITY wordmark on the slope (its normal tilts 30 deg back)
  const [logoTex] = labelTex(512, 64, c => { c.fillStyle = '#f4f4f4'; c.font = '700 54px system-ui,Segoe UI,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; if ('letterSpacing' in c) c.letterSpacing = '8px'; c.fillText('CREALITY', 256, 34); });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(110, 13.75), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, toneMapped: false }));
  logo.rotation.x = Math.PI / 6; logo.position.set(cx0 - 25, slope.y, slope.z); printer.add(logo);
}

// phase screen next to the logo
const [scrTex, , scrCtx] = labelTex(256, 128, () => {});
function drawScreen(txt) {
  const c = scrCtx;
  c.fillStyle = '#0a1118'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#ff9a3c'; c.fillRect(0, 0, 256, 5);
  c.fillStyle = '#8b97a8'; c.font = '600 14px system-ui,sans-serif'; c.fillText('ENDER-3 V3 SE', 14, 30);
  c.fillStyle = '#e6ebf2'; c.font = '700 30px system-ui,sans-serif'; c.fillText(txt, 14, 78);
  c.fillStyle = '#3cc8b4'; c.font = '13px system-ui,sans-serif'; c.fillText('magnet embed', 14, 110);
  scrTex.needsUpdate = true;
}
{
  const bezel = put(printer, RBX(60, 2, 32, 1), M.dark, cx0 + 105, slope.y - .2, slope.z + .2); bezel.rotation.x = Math.PI / 6;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(54, 27), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false }));
  screen.rotation.x = Math.PI / 6; screen.position.set(cx0 + 105, slope.y - 1.3, slope.z + 1.1); printer.add(screen);
}
for (const x of [45, 175]) put(printer, new THREE.CylinderGeometry(4, 4, 440, 16), M.alu, x, Y0, -16);   // Y rails
for (const x of [-25, D.bed[0] + 25]) {
  put(printer, RBX(20, 34, 310, 3), M.black, x, RY, 115);                            // uprights
  put(printer, CYZ(1.6, 280, 12), M.brass, x < 0 ? -38 : D.bed[0] + 38, RY, 100);     // Z lead screws
}
put(printer, RBX(270, 22, 16, 3), M.black, cx0, RY, 268);                            // top brace

const gantry = new THREE.Group(); scene.add(gantry);                                // rides up/down with Z
put(gantry, RBX(250, 14, 18, 3), M.dark, cx0, 0, 0);                                // thin X rail
for (const x of [-8, D.bed[0] + 8]) put(gantry, RBX(14, 28, 28, 2), M.black, x, 0, 0);
put(gantry, RBX(40, 40, 40, 3), M.black, -60, 0, 0);                                // X motor

// ---- the bed: everything fixed to the build plate lives here and slides in Y ------------------
const bedGroup = new THREE.Group(); scene.add(bedGroup);
put(bedGroup, RBX(236, 236, 8, 2), std(0x333a44, .5, .6), cx0, cx0, -8);            // aluminium carriage
put(bedGroup, BX(232, 232, 2), std(0x0f1216, .8, .1), cx0, cx0, -3.1);              // magnetic mat
put(bedGroup, RBX(232, 232, 2, 1), std(0x1d2229, .5, .5), cx0, cx0, -1.1);          // spring-steel plate
const grid = new THREE.GridHelper(Math.max(D.bed[0], D.bed[1]), 22, 0x3a4658, 0x2a3340);
grid.rotation.x = Math.PI / 2; grid.position.set(cx0, D.bed[1] / 2, 0.02); bedGroup.add(grid);

// printed toolpath: all segments up front, revealed with drawRange.
// Stable-sort by layer so "first N segments" == "everything printed so far".
const segs = D.segments.map((s, i) => [s, i]).sort((a, b) => a[0][6] - b[0][6] || a[1] - b[1]).map(a => a[0]);
const nA = segs.filter(s => s[6] < D.insertLayer).length;      // printed before the pause
const pos = new Float32Array(segs.length * 6), col = new Float32Array(segs.length * 6);
const cBefore = new THREE.Color(0xff9a3c), cSeal = new THREE.Color(0x3cc8b4);
segs.forEach((s, i) => {
  pos.set([s[0], s[1], s[2], s[3], s[4], s[5]], i * 6);
  const c = s[6] < D.insertLayer ? cBefore : cSeal, k = 0.55 + 0.45 * (s[5] / D.layerZ[D.layerZ.length - 1]);
  for (let v = 0; v < 2; v++) col.set([c.r * k, c.g * k, c.b * k], i * 6 + v * 3);
});
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true }));
lines.frustumCulled = false; bedGroup.add(lines);

// centre on the part itself: layers 0-4 include the slicer's start purge line, well off to one side
const body = segs.filter(s => s[6] >= 5);
const bx0 = Math.min(...body.map(s => s[0])), bx1 = Math.max(...body.map(s => s[0]));
const by0 = Math.min(...body.map(s => s[1])), by1 = Math.max(...body.map(s => s[1]));
const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2;
const topZ = D.layerZ[D.layerZ.length - 1];

// faint solid so the part reads as a block, growing with the print
const ghostGeo = BX(1, 1, 1); ghostGeo.translate(0, 0, .5);
const ghostMat = std(0xff9a3c, .6, 0, { transparent: true, opacity: .14, depthWrite: false });
const ghost = new THREE.Mesh(ghostGeo, ghostMat); ghost.position.set(cx, cy, 0); ghost.scale.set(bx1 - bx0, by1 - by0, .001);
bedGroup.add(ghost);

// pocket marker + magnet (same diameter as the printed pocket, 3 mm thick; seat Z = the magnet's top face)
const ring = new THREE.Mesh(new THREE.RingGeometry(magR, magR + .6, 48), new THREE.MeshBasicMaterial({ color: 0xff4d6d, side: THREE.DoubleSide, transparent: true, opacity: .8 }));
ring.position.set(px, py, pz + .05); bedGroup.add(ring);
const magnet = new THREE.Mesh(CYZ(magR, MAG_T, 40), M.magnet);
magnet.castShadow = true; magnet.visible = false; bedGroup.add(magnet);

// ---- toolhead (origin = nozzle tip) ---------------------------------------------------------
const head = new THREE.Group(); scene.add(head);
const nozzleMat = std(0xd4a24a, .3, .9, { emissive: 0xff6a20, emissiveIntensity: 0 });
const blockMat = std(0xb8bec8, .4, .8, { emissive: 0xff5a1a, emissiveIntensity: 0 });
const cone = new THREE.ConeGeometry(2.4, 8, 24); cone.rotateX(-Math.PI / 2);        // apex down
put(head, cone, nozzleMat, 0, 0, 4);
put(head, BX(14, 14, 9), blockMat, 0, 0, 12.5);                                      // heater block
put(head, CYZ(6.5, 16), M.alu, 0, 0, 21);                                            // heatsink
for (let k = 0; k < 4; k++) put(head, CYZ(8.2, 1.2), M.alu, 0, 0, 15 + k * 4.4);     // fins
put(head, RBX(30, 12, 20, 2), M.black, 0, -14, 22);                                  // fan shroud
put(head, BX(10, 12, 6), M.black, 0, -11, 8);                                        // cooling duct
put(head, RBX(36, 22, 36, 3), M.black, 0, 16, 42);                                   // extruder body
put(head, RBX(26, 26, 8, 2), M.dark, 0, 16, 64);                                     // extruder motor
put(head, RBX(46, 5, 64, 2), M.dark, 0, 29.5, 32);                                   // carriage plate on the rail

// ---- clip-on applicator, modelled on the SolidWorks CAD / photo ------------------------------
// perforated cover over the whole hotend (left) + mount plate on the right whose gear faces the front,
// servo behind it, two vertical racks either side of the gear, and an L-arm out to the holding tip
const [ox, oy, oz] = D.offset;                           // holding tip = nozzle + (52, -36.8, 0)
function hexTex(cols, rows) {                            // opaque white with hex holes cut out (alphaTest)
  const [tex, c, ctx] = labelTex(cols * 64, rows * 64, () => {});
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    ctx.beginPath();
    for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3, x = (i + .5) * 64 + Math.cos(a) * 20, y = (j + .5) * 64 + Math.sin(a) * 20; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.closePath(); ctx.fill();
  }
  tex.needsUpdate = true; return tex;
}
const CV = { x: -7, y: 1, z0: 10, w: 54, d: 52, h: 68 };   // cover: encloses heater block, heatsink, shroud and extruder; nozzle pokes out below
const perf = cols => new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: .6, map: hexTex(cols, 6), alphaTest: .5, side: THREE.DoubleSide });
const coverMat = perf(5);
for (const dy of [-1, 1]) put(head, new THREE.PlaneGeometry(CV.w, CV.h).rotateX(Math.PI / 2), coverMat, CV.x, CV.y + dy * CV.d / 2, CV.z0 + CV.h / 2, false);
for (const dx of [-1, 1]) put(head, new THREE.PlaneGeometry(CV.d, CV.h).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), coverMat, CV.x + dx * CV.w / 2, CV.y, CV.z0 + CV.h / 2, false);
put(head, RBX(CV.w, CV.d, 2, 1), M.white, CV.x, CV.y, CV.z0);                       // floor (the nozzle comes out underneath)
put(head, RBX(CV.w, CV.d, 2, 1), M.white, CV.x, CV.y, CV.z0 + CV.h);                // lid

const PIN = { x: 54, y: -8, z: 55, R: 10 };
put(head, BX(46, 4, 58), M.grey, PIN.x, -4, 50);                                     // mount plate, faces the front
put(head, BX(58, 6, 6), M.grey, 49, 2, 80);                                          // bridge from the cover over the dispenser to the plate
put(head, RBX(23, 12, 22, 1), std(0x2563a8, .5, .2), PIN.x, 4, PIN.z);               // SG90 servo, BEHIND the plate
const gearShape = new THREE.Shape();
{ const teeth = 18; for (let k = 0; k < teeth * 4; k++) { const a = k / (teeth * 4) * Math.PI * 2, r = (k % 4 === 1 || k % 4 === 2) ? PIN.R + 2 : PIN.R - 1; if (k) gearShape.lineTo(Math.cos(a) * r, Math.sin(a) * r); else gearShape.moveTo(r, 0); } gearShape.closePath(); }
const gearGeo = new THREE.ExtrudeGeometry(gearShape, { depth: 3, bevelEnabled: false }); gearGeo.translate(0, 0, -1.5); gearGeo.rotateX(Math.PI / 2);   // gear lies in X-Z, axis along Y
const gear = put(head, gearGeo, std(0xbdb5a6, .4, .7), PIN.x, PIN.y, PIN.z);
put(head, CYZ(3.5, 3, 20).rotateX(Math.PI / 2), std(0x2563a8, .4, .3), PIN.x, PIN.y - 1.6, PIN.z);   // servo horn on the front of the gear
const rackMat = std(0xcfd5dd, .4, .6);
const rackD = put(head, BX(3.5, 4, 44), rackMat, PIN.x + PIN.R + 2.5, PIN.y, PIN.z);  // dispense rack (right of the gear)
const rackR = put(head, BX(3.5, 4, 44), rackMat, PIN.x - PIN.R - 2.5, PIN.y, PIN.z);  // release rack (left of the gear)
put(head, BX(5, 32, 4), M.grey, 52, -22, 22);                                        // L-arm: out of the plate toward the front
put(head, BX(5, 5, 22), M.grey, ox, oy, 11);                                         // holding tip post: tip at z = oz
put(head, CYZ(Math.min(magR, 2.2), 1.2, 16), std(0xaab2bd, .3, .8), ox, oy, .6);    // holding pad

// dispenser: the vertical column BETWEEN the hex cover and the rack plate. Magnets stack flat inside it;
// the bottom one is pushed out by the racks and goes forward to the holding tip.
const DS = { x: 27, y: -4, w: 10, d: 16, z0: 22, h: 58 };
put(head, BX(DS.w, DS.d, DS.h), std(0x9fd7ff, .1, 0, { transparent: true, opacity: .3, depthWrite: false }), DS.x, DS.y, DS.z0 + DS.h / 2);
put(head, BX(DS.w + 2, DS.d + 2, 2), M.grey, DS.x, DS.y, DS.z0 + DS.h + 1);                              // cap
put(head, BX(DS.w + 2, DS.d + 2, 2), M.grey, DS.x, DS.y, DS.z0 - 1);                                     // base
put(head, BX(DS.w, DS.d, 24), std(0x9fd7ff, .1, 0, { transparent: true, opacity: .16, depthWrite: false }), DS.x, DS.y, DS.z0 - 14);   // chute below the stack
put(head, BX(30, 6, 4), M.grey, 37, -9, 18);                                                             // foot out to the L-arm
const magDiscs = [];
for (let k = 0; k < 14; k++) magDiscs.push(put(head, CYZ(magR, MAG_T, 28), M.magnet, DS.x, DS.y, DS.z0 + 1 + MAG_T / 2 + k * (MAG_T + .3)));

// the magnet's route: down the chute, forward along Y, then in along X to the holding tip
const FEED = [[DS.x, DS.y, DS.z0 + 1], [DS.x, DS.y, -MAG_T / 2], [DS.x, oy, -MAG_T / 2], [ox, oy, -MAG_T / 2]];
const feedLen = FEED.slice(1).map((p, i) => Math.hypot(...p.map((v, k) => v - FEED[i][k])));
function feedPos(f) {
  let d = f * feedLen.reduce((a, b) => a + b, 0);
  for (let i = 0; i < feedLen.length; i++) { if (d <= feedLen[i] || i === feedLen.length - 1) return lerp(FEED[i], FEED[i + 1], Math.min(d / feedLen[i], 1)); d -= feedLen[i]; }
}

// flat cable from the head up to the top brace
let cable = new THREE.Mesh(new THREE.BufferGeometry(), std(0x0d0f12, .7, .1)); scene.add(cable);
const CABLE_END = new THREE.Vector3(cx0 + 70, RY + 4, 258);
function updateCable(hx, hz) {
  const a = new THREE.Vector3(hx, Y0 + 30, hz + 70), e = CABLE_END;
  const curve = new THREE.CatmullRomCurve3([a, new THREE.Vector3(hx, Y0 + 38, hz + 100), new THREE.Vector3((hx + e.x) / 2, RY + 14, Math.max(hz + 150, 190)), new THREE.Vector3(e.x, e.y + 6, e.z - 18), e]);
  cable.geometry.dispose(); cable.geometry = new THREE.TubeGeometry(curve, 28, 2.4, 6, false);
}

// ---- timeline: A print -> B insert -> C seal ------------------------------
const T = { A: 6, B: 11, C: 4 }; T.total = T.A + T.B + T.C;
const N = D.nozzle, P = D.phases;                     // N has one more point than P
const seg = i => Math.hypot(...[0, 1, 2].map(k => N[i + 1][k] - N[i][k]));
const w = P.map((p, i) => Math.max(seg(i), 6) * ((p === 'PRESS' || p === 'SHEAR') ? 3 : 1));
const wSum = w.reduce((a, b) => a + b, 0);
const parkIdx = Math.max(P.indexOf('PARK'), 0), shearIdx = P.indexOf('SHEAR');
// real order is SAVE -> PARK -> DISPENSE -> APPROACH ...: the dispense beat happens at the parked position
const seq = [];
P.forEach((p, i) => { seq.push({ phase: p, i, w: w[i] }); if (i === parkIdx) seq.push({ phase: 'DISPENSE', i, w: Math.max(wSum * .14, 10), hold: true }); });
const seqSum = seq.reduce((a, s) => a + s.w, 0);
const NOTE = {
  PRINT: 'Printing the part up to the insert layer.',
  PARK: 'Head lifts clear of the part.', DISPENSE: 'Servo turns the pinion; the dispense rack pushes one magnet out of the column to the holding tip.',
  APPROACH: 'Carriage shifts so the holding tip (not the nozzle) sits over the pocket.',
  PRESS: 'Slow Z push press-fits the magnet into the pocket.', SHEAR: 'Release rack frees the magnet; the tool slides sideways off it.',
  LIFT: 'Z lifts clear.', CLEAR: 'Head moves out of the way.', RESUME: 'Back to the saved position; printing resumes.',
  SEAL: 'Printing the sealing layer over the magnet.',
};
const STEPS = ['Print', 'Park', 'Dispense', 'Approach', 'Press', 'Shear', 'Lift', 'Seal'];
const STEP_OF = { PRINT: 0, PARK: 1, DISPENSE: 2, APPROACH: 3, PRESS: 4, SHEAR: 5, LIFT: 6, CLEAR: 6, RESUME: 7, SEAL: 7 };
$('sim-steps').innerHTML = STEPS.map(s => `<span>${s}</span>`).join('');
const stepEls = [...$('sim-steps').children];
let t = T.total * .5, playing = false, speed = 1;   // rests mid-insert so the first frame already shows the applicator working

function insertState(u) {                              // u in [0,1] across stage B
  let x = u * seqSum;
  for (let k = 0; k < seq.length; k++) {
    const s = seq[k];
    if (x <= s.w || k === seq.length - 1) {
      const f = Math.min(x / s.w, 1);
      return { phase: s.phase, i: s.i, f, nz: s.hold ? N[s.i + 1] : lerp(N[s.i], N[s.i + 1], f) };
    }
    x -= s.w;
  }
}
// pinion angle (deg): + dispense stroke, - release stroke
function pinionDeg(phase, f) {
  if (phase === 'DISPENSE') return 60 * ease(f);
  if (phase === 'APPROACH' || phase === 'PRESS') return 60;
  if (phase === 'SHEAR') return 60 - 120 * ease(f);
  if (phase === 'LIFT') return -60 * (1 - ease(f));
  return 0;
}

let heat = 1, flash = 0, frameDt = 0, shownPhase = '';
function setMagnet(where, p) {                         // 'carried' (p = local pos on the head) | 'placed' in the pocket | null
  magnet.visible = !!where;
  if (where === 'carried') { if (magnet.parent !== head) head.add(magnet); magnet.position.set(p[0], p[1], p[2]); }
  else if (where === 'placed') { if (magnet.parent !== bedGroup) bedGroup.add(magnet); magnet.position.set(px, py, pz - MAG_T / 2); }
}
function render() {
  let phase, nz, f = 0, shown = 0, magnetAt = null, mp = null;
  if (t < T.A) { const u = t / T.A; shown = Math.floor(u * nA); phase = 'PRINT'; nz = segs[Math.max(shown - 1, 0)].slice(3); }
  else if (t < T.A + T.B) {
    shown = nA; const s = insertState((t - T.A) / T.B); phase = s.phase; nz = s.nz; f = s.f;
    if (phase === 'DISPENSE') { magnetAt = 'carried'; mp = feedPos(ease(f)); }
    else if (phase !== 'PARK') { magnetAt = s.i < shearIdx ? 'carried' : 'placed'; mp = [ox, oy, oz - MAG_T / 2]; }
  } else { const u = (t - T.A - T.B) / T.C; shown = nA + Math.floor(u * (segs.length - nA)); phase = 'SEAL'; nz = segs[Math.max(shown - 1, nA)].slice(3); magnetAt = 'placed'; }
  geo.setDrawRange(0, shown * 2);

  // bed-slinger kinematics: head = X + Z, bed = Y
  head.position.set(nz[0], Y0, nz[2]);
  gantry.position.set(0, RY, nz[2] + 32);
  bedGroup.position.y = Y0 - nz[1];
  updateCable(nz[0], nz[2]);
  setMagnet(magnetAt, mp);

  const zTop = shown > 0 ? segs[shown - 1][5] : 0;
  ghost.scale.z = Math.max(zTop, .001); ghostMat.color.set(phase === 'SEAL' ? 0x3cc8b4 : 0xff9a3c);
  magDiscs[0].visible = phase === 'PRINT' || phase === 'PARK' || (phase === 'DISPENSE' && f < .02);   // one magnet leaves the stack

  if (phase === 'SHEAR' && shownPhase !== 'SHEAR') flash = 1;                       // magnet just released
  if (phase !== shownPhase) {
    shownPhase = phase;
    const label = phase === 'PRINT' || phase === 'SEAL' ? phase.charAt(0) + phase.slice(1).toLowerCase() : phase;
    $('sim-phase').textContent = label; $('sim-note').textContent = NOTE[phase] || ''; drawScreen(label.toUpperCase());
    const cur = STEP_OF[phase];
    stepEls.forEach((el, i) => { el.className = i === cur ? 'on' + (cur === 7 ? ' seal' : '') : i < cur ? 'done' : ''; });
  }
  // hotend runs hot while printing, cooled to standby during the pause
  const heatTarget = (phase === 'PRINT' || phase === 'SEAL' || phase === 'RESUME') ? 1 : .3;
  heat += (heatTarget - heat) * Math.min(1, frameDt * 3);
  nozzleMat.emissiveIntensity = heat * 1.1; blockMat.emissiveIntensity = heat * .8;
  const rad = pinionDeg(phase, f) * Math.PI / 180;
  gear.rotation.y = rad; rackD.position.z = PIN.z - PIN.R * rad; rackR.position.z = PIN.z + PIN.R * rad;
  flash = Math.max(0, flash - frameDt * 1.2);
  ring.scale.setScalar(1 + flash * .6); ring.material.opacity = .55 + .15 * Math.sin(performance.now() / 400) + .3 * flash;
  $('sim-scrub').value = Math.round(t / T.total * 1000);
}

// ---- camera / view ---------------------------------------------------------
const VIEWS = [
  { name: 'Close-up', target: [cx, cy, topZ / 2 + 20], dist: 190 },
  { name: 'Printer', target: [D.bed[0] / 2, Y0, 50], dist: 380 },
  { name: 'Full machine', target: [D.bed[0] / 2, Y0, 90], dist: 640 },
];
let viewIdx = 1;
function setView() {
  const v = VIEWS[viewIdx];
  controls.target.set(...v.target);
  camera.position.set(v.target[0] + v.dist * .55, v.target[1] - v.dist * .8, v.target[2] + v.dist * .6);
  controls.update(); $('sim-view').textContent = 'View: ' + v.name;
}
$('sim-view').onclick = () => { viewIdx = (viewIdx + 1) % VIEWS.length; setView(); };
function resize() { const r = stage.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize(); setView();

// ---- controls --------------------------------------------------------------
$('sim-play').onclick = () => { if (t >= T.total) t = 0; playing = !playing; $('sim-play').textContent = playing ? 'Pause' : 'Play'; };
$('sim-restart').onclick = () => { t = 0; playing = true; $('sim-play').textContent = 'Pause'; };
$('sim-scrub').oninput = e => { t = e.target.value / 1000 * T.total; playing = false; $('sim-play').textContent = 'Play'; };
$('sim-speed').onchange = e => speed = +e.target.value;

let last = performance.now(), visible = true;
new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(stage);
renderer.setAnimationLoop(now => {
  const dt = Math.min((now - last) / 1000, .1); last = now; frameDt = dt;
  if (!visible) return;
  if (playing) { t += dt * speed; if (t >= T.total) { t = T.total; playing = false; $('sim-play').textContent = 'Replay'; } }
  render(); controls.update(); renderer.render(scene, camera);
});

