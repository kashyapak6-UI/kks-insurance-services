import * as THREE from 'three';

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

function makeRenderer(canvas, mobile) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  r.setClearColor(0x000000, 0);
  return r;
}
function glowTexture(inner, outer = 'rgba(0,0,0,0)') {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 32, 28, 0, Math.PI * 2); g.fill();
  return new THREE.CanvasTexture(c);
}
const rand = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(42);
const ll = (lat, lon, r) => { const p = THREE.MathUtils.degToRad(lat), l = THREE.MathUtils.degToRad(lon); return new THREE.Vector3(r * Math.cos(p) * Math.sin(l), r * Math.sin(p), r * Math.cos(p) * Math.cos(l)); };

/* ---------------- HERO GLOBE ---------------- */
export function createGlobe(canvas, { mobile = false, reduced = false } = {}) {
  const renderer = makeRenderer(canvas, mobile);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 7.2);
  const R = 1.75, dot = dotTexture();

  const tilt = new THREE.Group(), spin = new THREE.Group();
  tilt.rotation.x = 0.62; tilt.add(spin); scene.add(tilt);

  // halo
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(110,112,255,0.55)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(R * 3.6); scene.add(halo);

  // dark core to occlude back dots
  spin.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 64, 48), new THREE.MeshBasicMaterial({ color: 0x14142a, transparent: true, opacity: 0.92 })));

  // fibonacci dot sphere
  const N = mobile ? 1400 : 2600, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = Math.PI * (3 - Math.sqrt(5)) * i;
    pos.set([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R], i * 3);
  }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  spin.add(new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.028, map: dot, alphaTest: 0.4, color: 0x8f90ff, transparent: true, opacity: 0.75 })));

  // 50 "state" points over the continental US
  const states = [];
  for (let i = 0; i < 50; i++) states.push(ll(26 + rand() * 22, -122 + rand() * 52, R * 1.01));
  const sg = new THREE.BufferGeometry().setFromPoints(states);
  spin.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.075, map: dot, alphaTest: 0.4, color: 0xe4f222 })));
  const pulses = states.filter((_, i) => i % 5 === 0).map((p) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(228,242,34,0.9)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.position.copy(p); s.scale.setScalar(0.2); s.userData.ph = rand() * 6; spin.add(s); return s;
  });

  // arcs
  const arcs = [];
  const SEG = 64;
  for (let i = 0; i < (mobile ? 10 : 18); i++) {
    const a = states[Math.floor(rand() * 50)], b = states[Math.floor(rand() * 50)];
    if (a.distanceTo(b) < 0.25) continue;
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * (1.08 + a.distanceTo(b) * 0.35));
    const pts = new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(SEG);
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineBasicMaterial({ color: i % 3 ? 0x9fa0ff : 0xe4f222, transparent: true, opacity: 0.85 });
    const line = new THREE.Line(g, m); line.userData = { off: rand() * 3, spd: 0.25 + rand() * 0.25 };
    spin.add(line); arcs.push(line);
  }
  // equator ring
  const ringPts = []; for (let i = 0; i <= 128; i++) { const t = (i / 128) * Math.PI * 2; ringPts.push(new THREE.Vector3(Math.cos(t) * R * 1.35, 0, Math.sin(t) * R * 1.35)); }
  const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineBasicMaterial({ color: 0x6f70ff, transparent: true, opacity: 0.25 }));
  ring.rotation.z = 0.3; tilt.add(ring);

  const st = { progress: 0, px: 0, py: 0, visible: true, base: THREE.MathUtils.degToRad(96) };
  spin.rotation.y = st.base;
  const t0 = performance.now(); const elapsed = () => (performance.now() - t0) / 1000;

  function layout() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const narrow = w < 900;
    st.x = narrow ? 0.5 : 2.05; st.y = narrow ? -1.2 : -0.05; st.s = narrow ? 0.8 : 0.9;
  }
  layout();

  function frame() {
    if (!st.visible) return;
    const t = reduced ? 0 : elapsed();
    const p = st.progress;
    spin.rotation.y = st.base + Math.sin(t * 0.12) * 0.35 + p * 0.8;
    tilt.rotation.x = 0.62 + st.py * 0.08;
    tilt.rotation.z = st.px * 0.06;
    const x = THREE.MathUtils.lerp(st.x, 0, p), y = st.y + p * 0.6, s = st.s * (1 - p * 0.25);
    tilt.position.set(x, y, -p * 2); tilt.scale.setScalar(s);
    halo.position.set(x, y, -p * 2 - 0.5); halo.scale.setScalar(R * 3.6 * s);
    arcs.forEach((l) => { const k = ((t * l.userData.spd + l.userData.off) % 1.6) / 1.2; const n = Math.floor(THREE.MathUtils.clamp(k, 0, 1) * (SEG + 1)); l.geometry.setDrawRange(0, reduced ? SEG + 1 : n); l.material.opacity = reduced ? 0.6 : 0.85 * (1 - THREE.MathUtils.clamp(k - 1, 0, 0.33) * 3); });
    pulses.forEach((s) => s.scale.setScalar(0.12 + (reduced ? 0.1 : (Math.sin(t * 2 + s.userData.ph) * 0.5 + 0.5) * 0.22)));
    renderer.render(scene, camera);
  }
  return { state: st, frame, resize: layout, renderer };
}

/* ---------------- TEAMS ORBIT ---------------- */
export function createOrbit(canvas, { mobile = false, reduced = false } = {}) {
  const renderer = makeRenderer(canvas, mobile);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 1.8, 11.5); camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x8888ff, 0.6));
  const key = new THREE.PointLight(0xffffff, 40, 30); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(0xe4f222, 20, 20); rim.position.set(-4, -2, -3); scene.add(rim);

  const root = new THREE.Group(); scene.add(root);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), new THREE.MeshStandardMaterial({ color: 0x4f50ff, roughness: 0.25, metalness: 0.4, flatShading: true, emissive: 0x1a1a66 }));
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 1), new THREE.MeshBasicMaterial({ color: 0x9fa0ff, wireframe: true, transparent: true, opacity: 0.25 }));
  root.add(core, wire);
  const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(110,112,255,0.7)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  coreGlow.scale.setScalar(5); root.add(coreGlow);

  const ringG = new THREE.Group(); ringG.rotation.x = 0.32; root.add(ringG);
  const RR = 2.7, pts = [];
  for (let i = 0; i <= 160; i++) { const t = (i / 160) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(t) * RR, 0, Math.sin(t) * RR)); }
  ringG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x8f90ff, transparent: true, opacity: 0.35 })));
  const spinner = new THREE.Group(); ringG.add(spinner);
  const orbs = [], links = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.26, 32, 24), new THREE.MeshStandardMaterial({ color: 0xededf3, roughness: 0.3, metalness: 0.1, emissive: 0x000000 }));
    m.position.set(Math.cos(a) * RR, 0, Math.sin(a) * RR); spinner.add(m); orbs.push(m);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(228,242,34,0.9)'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.setScalar(1.6); m.add(glow); m.userData.glow = glow;
    const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), m.position.clone()]);
    const l = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xe4f222, transparent: true, opacity: 0.08 })); spinner.add(l); links.push(l);
  }
  // dust
  const D = mobile ? 300 : 700, dp = new Float32Array(D * 3);
  for (let i = 0; i < D; i++) { const r = 3 + rand() * 6, a = rand() * Math.PI * 2, y = (rand() - 0.5) * 6; dp.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.03, color: 0x9fa0ff, transparent: true, opacity: 0.6, map: dotTexture(), alphaTest: 0.3 }));
  scene.add(dust);

  const st = { active: 0, visible: false, angle: 0 };
  const t0 = performance.now(); const elapsed = () => (performance.now() - t0) / 1000;
  function layout() {
    const w = canvas.clientWidth || 800, h = canvas.clientHeight || 600;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    root.position.x = w < 700 ? 0 : 1.1; root.scale.setScalar(w < 700 ? 1.25 : 1);
  }
  layout();
  function frame() {
    if (!st.visible) return;
    const t = reduced ? 0 : elapsed();
    // bring active orb to the front (angle where z is max: +PI/2)
    const target = Math.PI / 2 - (st.active / 6) * Math.PI * 2;
    let d = target - st.angle; d = Math.atan2(Math.sin(d), Math.cos(d));
    st.angle += d * (reduced ? 1 : 0.06);
    spinner.rotation.y = -st.angle + (reduced ? 0 : Math.sin(t * 0.3) * 0.04);
    core.rotation.set(t * 0.2, t * 0.3, 0); wire.rotation.set(-t * 0.1, -t * 0.15, 0);
    orbs.forEach((o, i) => {
      const on = i === st.active, k = reduced ? 1 : 0.1;
      const s = o.scale.x + ((on ? 1.45 : 1) - o.scale.x) * k; o.scale.setScalar(s);
      o.material.emissive.setHex(on ? 0x9aa412 : 0x000000);
      o.material.color.setHex(on ? 0xe4f222 : 0xc9c9e6);
      o.userData.glow.material.opacity += ((on ? 0.9 : 0) - o.userData.glow.material.opacity) * k;
      links[i].material.opacity += ((on ? 0.9 : 0.08) - links[i].material.opacity) * k;
    });
    dust.rotation.y = t * 0.02;
    renderer.render(scene, camera);
  }
  return { state: st, frame, resize: layout, renderer };
}
