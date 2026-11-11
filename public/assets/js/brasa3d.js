// Brasa em 3D: o golem de pedra da Warden Labs, montado com Three.js.
// Substitui o Brasa em SVG quando o navegador tem WebGL; se não tiver, o SVG continua no lugar.
import * as THREE from '../vendor/three.module.min.js';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const AMBER = 0xf5b042;

function canWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

// Textura de pedra feita no canvas: manchas, poros e algumas rachaduras
function stoneTexture() {
  const s = 256, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = '#8a969e'; g.fillRect(0, 0, s, s);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 900; i++) {
    const v = 110 + rnd() * 70 | 0;
    g.fillStyle = `rgba(${v},${v + 8},${v + 14},${0.08 + rnd() * 0.12})`;
    const r = 2 + rnd() * 14;
    g.beginPath(); g.arc(rnd() * s, rnd() * s, r, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 1600; i++) {
    g.fillStyle = `rgba(30,36,40,${0.15 + rnd() * 0.25})`;
    g.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 1.5, 1 + rnd() * 1.5);
  }
  g.strokeStyle = 'rgba(28,33,37,.45)'; g.lineWidth = 1.2;
  for (let i = 0; i < 7; i++) {
    let x = rnd() * s, y = rnd() * s;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * 40; y += (rnd() - 0.5) * 40; g.lineTo(x, y); }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Brilho suave (sprite) para olhos e lanterna
function glowTexture() {
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, 'rgba(255,214,140,1)');
  grad.addColorStop(0.25, 'rgba(245,176,66,.55)');
  grad.addColorStop(1, 'rgba(245,176,66,0)');
  g.fillStyle = grad; g.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Sombra no chão
function shadowTexture() {
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, 'rgba(0,0,0,.55)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}

const shared = {};
function materials() {
  if (shared.stone) return shared;
  const tex = stoneTexture();
  shared.stone = new THREE.MeshStandardMaterial({ color: 0x8996a0, map: tex, roughness: 0.92, metalness: 0.02 });
  shared.stoneDark = new THREE.MeshStandardMaterial({ color: 0x55636d, map: tex, roughness: 0.95 });
  shared.stoneLight = new THREE.MeshStandardMaterial({ color: 0x96a4ae, map: tex, roughness: 0.9 });
  shared.carve = new THREE.MeshStandardMaterial({ color: 0x2b343b, roughness: 0.8 });
  shared.visor = new THREE.MeshStandardMaterial({ color: 0x0e1215, roughness: 0.28, metalness: 0.2 });
  shared.eye = new THREE.MeshStandardMaterial({ color: 0xffc566, emissive: AMBER, emissiveIntensity: 3.2, roughness: 0.3 });
  shared.spark = new THREE.MeshBasicMaterial({ color: 0xfff1d0 });
  shared.bronze = new THREE.MeshStandardMaterial({ color: 0x3a3226, roughness: 0.55, metalness: 0.6 });
  shared.glass = new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xffb547, emissiveIntensity: 2.6, roughness: 0.2, transparent: true, opacity: 0.95 });
  shared.glow = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffc06a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  shared.shadow = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
  return shared;
}

const rbox = (w, h, d, r, seg = 4) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, Math.min(w, h, d) / 2 - 0.001));

function buildBrasa() {
  const m = materials();
  const root = new THREE.Group();          // flutua
  const body = new THREE.Group();          // gira de leve com o olhar
  root.add(body);

  // Pernas
  for (const x of [-0.31, 0.31]) {
    const leg = new THREE.Mesh(rbox(0.44, 0.42, 0.52, 0.12), m.stoneDark);
    leg.position.set(x, 0.21, 0);
    body.add(leg);
  }

  // Tronco
  const torso = new THREE.Mesh(rbox(1.36, 1.1, 0.96, 0.24), m.stone);
  torso.position.y = 0.97;
  body.add(torso);
  const belt = new THREE.Mesh(rbox(1.38, 0.08, 0.98, 0.03), m.stoneDark);
  belt.position.y = 0.72;
  body.add(belt);

  // Arco entalhado no peito (o símbolo da Warden)
  const arch = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 10, 32, Math.PI), m.carve);
  outer.position.y = 0.16;
  arch.add(outer);
  for (const x of [-0.24, 0.24]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 10), m.carve);
    leg.position.set(x, -0.05, 0);
    arch.add(leg);
  }
  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 10, 28, Math.PI), m.carve);
  inner.position.y = 0.06;
  arch.add(inner);
  for (const x of [-0.12, 0.12]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 10), m.carve);
    leg.position.set(x, -0.06, 0);
    arch.add(leg);
  }
  arch.position.set(0, 0.86, 0.49);
  body.add(arch);

  // Braço esquerdo, solto ao lado do corpo
  const armL = new THREE.Group();
  armL.position.set(-0.8, 1.32, 0);
  const upperL = new THREE.Mesh(rbox(0.34, 0.74, 0.38, 0.13), m.stoneDark);
  upperL.position.y = -0.34;
  armL.add(upperL);
  const fistL = new THREE.Mesh(rbox(0.38, 0.3, 0.42, 0.12), m.stone);
  fistL.position.y = -0.76;
  armL.add(fistL);
  armL.rotation.z = -0.12;
  body.add(armL);

  // Braço direito erguido, segurando a lanterna
  const armR = new THREE.Group();
  armR.position.set(0.78, 1.36, 0);
  const upperR = new THREE.Mesh(rbox(0.34, 0.78, 0.38, 0.13), m.stoneDark);
  upperR.position.y = 0.36;
  armR.add(upperR);
  const fistR = new THREE.Mesh(rbox(0.4, 0.3, 0.42, 0.12), m.stone);
  fistR.position.y = 0.82;
  armR.add(fistR);
  armR.rotation.z = -0.32;
  body.add(armR);

  // Lanterna
  const lantern = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.022, 8, 24, Math.PI), m.bronze);
  handle.position.y = 0.36;
  lantern.add(handle);
  const cap = new THREE.Mesh(rbox(0.38, 0.1, 0.38, 0.04), m.bronze);
  cap.position.y = 0.3;
  lantern.add(cap);
  const glass = new THREE.Mesh(rbox(0.28, 0.4, 0.28, 0.06), m.glass);
  glass.position.y = 0.06;
  lantern.add(glass);
  for (const [x, z] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.42, 0.035), m.bronze);
    bar.position.set(x, 0.06, z);
    lantern.add(bar);
  }
  const base = new THREE.Mesh(rbox(0.38, 0.09, 0.38, 0.04), m.bronze);
  base.position.y = -0.18;
  lantern.add(base);
  const lanternGlow = new THREE.Sprite(m.glow);
  lanternGlow.scale.set(1.3, 1.3, 1);
  lanternGlow.position.y = 0.06;
  lantern.add(lanternGlow);
  const light = new THREE.PointLight(0xffb347, 9, 7, 1.6);
  light.position.y = 0.06;
  lantern.add(light);
  lantern.position.set(0.02, 1.2, 0.05);
  armR.add(lantern);

  // Cabeça (gira para olhar o mouse)
  const head = new THREE.Group();
  head.position.y = 1.52;
  const skull = new THREE.Mesh(rbox(0.94, 0.82, 0.86, 0.24), m.stoneLight);
  skull.position.y = 0.42;
  head.add(skull);
  const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.18, 20), m.stoneDark);
  nub.position.y = 0.9;
  head.add(nub);
  const nubTop = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), m.stoneDark);
  nubTop.position.y = 0.99;
  head.add(nubTop);
  const visor = new THREE.Mesh(rbox(0.74, 0.3, 0.12, 0.055), m.visor);
  visor.position.set(0, 0.42, 0.4);
  head.add(visor);

  const eyes = new THREE.Group();
  eyes.position.set(0, 0.42, 0.5);
  const eyeL = new THREE.Group(), eyeR = new THREE.Group();
  for (const [g, x] of [[eyeL, -0.15], [eyeR, 0.15]]) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), m.eye);
    g.add(ball);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), m.spark);
    spark.position.set(0.025, 0.025, 0.065);
    g.add(spark);
    const glow = new THREE.Sprite(m.glow);
    glow.scale.set(0.42, 0.42, 1);
    glow.material = m.glow;
    g.add(glow);
    g.position.x = x;
    eyes.add(g);
  }
  head.add(eyes);
  body.add(head);

  // Sombra no chão
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.8), m.shadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;

  return { root, body, head, eyes, eyeL, eyeR, armR, armL, lantern, light, lanternGlow, shadow };
}

function create(host) {
  const canvas = document.createElement('canvas');
  canvas.className = 'brasa-3d-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Brasa, o guardião de pedra da Warden Labs, segurando uma lanterna acesa');
  host.appendChild(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (e) { canvas.remove(); return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 1.75, 8.2);
  camera.lookAt(0, 1.42, 0);

  scene.add(new THREE.HemisphereLight(0xa9bccb, 0x141a1f, 1.5));
  const key = new THREE.DirectionalLight(0xdbe7ef, 2.3);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb45a, 1.4);
  rim.position.set(3, 2.5, -3);
  scene.add(rim);

  const b = buildBrasa();
  scene.add(b.root);
  scene.add(b.shadow);
  b.root.position.y = 0.05;

  // Estado do olhar
  const look = { x: 0, y: 0, tx: 0, ty: 0, lastMove: 0 };
  let blinkAt = 2 + Math.random() * 3, blinkT = -1;
  let visible = true, raf = 0, last = performance.now(), t0 = last, shown = false;
  // Easter egg: o site.js avisa com 'brasa:poke' quando passam o cursor várias vezes por cima
  let pokeT = -1;
  const POKE = 2.6;

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (reduce || !visible) renderer.render(scene, camera);
  }

  function frame(now) {
    raf = 0;
    // o horário do quadro pode vir um pouco antes do último registrado: nunca deixar negativo
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    const t = (now - t0) / 1000;

    // Sem mouse por um tempo: olha em volta sozinho
    if (now - look.lastMove > 3500) {
      look.tx = Math.sin(t * 0.55) * 0.7;
      look.ty = Math.sin(t * 0.37 + 1.3) * 0.35;
    }
    const k = Math.min(1, 1 - Math.pow(0.0015, dt));
    look.x += (look.tx - look.x) * k;
    look.y += (look.ty - look.y) * k;

    // Flutua e respira
    const bobY = Math.sin(t * 1.25) * 0.06;
    b.root.position.y = 0.06 + bobY;
    b.shadow.scale.setScalar(1 - bobY * 1.6);
    b.shadow.material.opacity = 0.85 - bobY * 2;

    // Corpo, cabeça e olhos acompanham o olhar
    b.body.rotation.y = look.x * 0.16;
    b.head.rotation.y = look.x * 0.5;
    b.head.rotation.x = look.y * 0.22;
    b.head.rotation.z = -look.x * 0.06;
    b.eyes.position.x = look.x * 0.07;
    b.eyes.position.y = 0.42 - look.y * 0.04;
    b.eyes.position.z = 0.5;

    // Braço da lanterna balança e o fogo tremula
    b.armR.rotation.z = -0.32 + Math.sin(t * 1.6) * 0.045;
    b.armL.rotation.z = -0.12 + Math.sin(t * 1.25 + 1) * 0.03;
    b.lantern.rotation.z = -b.armR.rotation.z * 0.9;
    const flick = 0.82 + 0.1 * Math.sin(t * 11) + 0.08 * Math.sin(t * 23.7 + 1.7);
    b.light.intensity = 9 * flick;
    b.lanternGlow.material.opacity = 0.75 + 0.25 * flick;

    // Reação ao easter egg: chacoalha a cabeça, dá um pulinho, fecha os olhos sorrindo e acena
    if (pokeT >= 0) {
      pokeT += dt;
      const p = pokeT;
      const ramp = (a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
      const ease = x => x * x * (3 - 2 * x);
      // chacoalhada de "ei, para com isso"
      if (p < 0.9) b.head.rotation.y += Math.sin(p * 22) * 0.38 * (1 - p / 0.9);
      // pulinho
      if (p < 0.55) {
        const h = Math.sin(Math.PI * p / 0.55);
        b.root.position.y += h * 0.32;
        b.shadow.scale.setScalar(1 - h * 0.35);
      }
      // aceno com o braço livre
      const up = ease(ramp(0.45, 0.85)) * (1 - ease(ramp(2.15, POKE)));
      b.armL.rotation.z += -2.35 * up + Math.sin(p * 13) * 0.32 * up;
      b.head.rotation.z += 0.12 * up;
      b.head.rotation.y += -0.25 * up;
      // olhos fechados de sorriso no meio da reação
      const happy = ramp(0.5, 0.65) * (1 - ramp(2.0, 2.2));
      b.eyeL.scale.y = b.eyeR.scale.y = 1 - happy * 0.72;
      // a lanterna acende mais forte
      const flare = Math.sin(Math.PI * ramp(0, 1.4));
      b.light.intensity *= 1 + flare * 1.6;
      b.lanternGlow.material.opacity = Math.min(1, b.lanternGlow.material.opacity + flare * 0.3);
      if (p >= POKE) { pokeT = -1; b.eyeL.scale.y = b.eyeR.scale.y = 1; }
    }

    // Pisca de vez em quando
    if (pokeT < 0 && blinkT < 0 && t > blinkAt) blinkT = 0;
    if (blinkT >= 0) {
      blinkT += dt;
      const p = blinkT / 0.16;
      const s = p < 0.5 ? 1 - p * 1.8 : Math.min(1, 0.1 + (p - 0.5) * 1.8);
      b.eyeL.scale.y = b.eyeR.scale.y = Math.max(0.1, s);
      if (p >= 1) { blinkT = -1; b.eyeL.scale.y = b.eyeR.scale.y = 1; blinkAt = t + 3 + Math.random() * 4; }
    }

    renderer.render(scene, camera);
    // só esconde o Brasa em SVG depois que o 3D já desenhou
    if (!shown) { shown = true; host.closest('[data-follow]')?.classList.add('has-3d'); }
    if (visible && !reduce) raf = requestAnimationFrame(frame);
  }

  function start() { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  host.closest('[data-follow]')?.addEventListener('brasa:poke', () => {
    if (reduce) return;
    pokeT = 0; blinkT = -1;
    look.tx = 0; look.ty = -0.15; look.lastMove = performance.now();
    start();
  });

  new ResizeObserver(resize).observe(host);
  resize();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { visible = es[0].isIntersecting; visible ? start() : stop(); }, { rootMargin: '100px' }).observe(host);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (visible) start(); });

  // desenha o primeiro quadro na hora, sem esperar o próximo requestAnimationFrame
  if (reduce) look.lastMove = Infinity;
  frame(performance.now());

  return {
    host,
    pointer(cx, cy) {
      const r = host.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const mx = r.left + r.width / 2, my = r.top + r.height * 0.4;
      look.tx = Math.max(-1, Math.min(1, (cx - mx) / (window.innerWidth / 2)));
      look.ty = Math.max(-1, Math.min(1, (cy - my) / (window.innerHeight / 2)));
      look.lastMove = performance.now();
    }
  };
}

const fallback = host => host.closest('[data-follow]')?.classList.add('no-3d');
if (canWebGL()) {
  const instances = [];
  document.querySelectorAll('[data-brasa3d]').forEach(host => {
    let inst = null;
    try { inst = create(host); } catch (e) { inst = null; }
    if (inst) instances.push(inst); else fallback(host);
  });
  if (instances.length && !reduce) {
    window.addEventListener('pointermove', e => instances.forEach(i => i.pointer(e.clientX, e.clientY)), { passive: true });
  }
} else {
  document.querySelectorAll('[data-brasa3d]').forEach(fallback);
}

// Usado também para exportar o modelo e as imagens de marketing
export { buildBrasa, materials };
