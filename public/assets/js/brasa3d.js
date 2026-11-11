// Brasa em 3D: o robô guardião da Warden Labs, montado com Three.js.
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
  if (shared.shell) return shared;
  // casco de titânio acetinado, com verniz para pegar o reflexo das luzes
  shared.shell = new THREE.MeshPhysicalMaterial({ color: 0xa7b3bd, roughness: 0.34, metalness: 0.18, clearcoat: 0.8, clearcoatRoughness: 0.18 });
  shared.shellDark = new THREE.MeshPhysicalMaterial({ color: 0x3a4650, roughness: 0.4, metalness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  shared.joint = new THREE.MeshStandardMaterial({ color: 0x1b2228, roughness: 0.45, metalness: 0.4 });
  shared.visor = new THREE.MeshPhysicalMaterial({ color: 0x07090b, roughness: 0.12, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 });
  shared.eye = new THREE.MeshStandardMaterial({ color: 0xffc566, emissive: AMBER, emissiveIntensity: 3.4, roughness: 0.3 });
  shared.led = new THREE.MeshStandardMaterial({ color: 0xffc566, emissive: AMBER, emissiveIntensity: 2.4, roughness: 0.3 });
  shared.metal = new THREE.MeshStandardMaterial({ color: 0x2c3238, roughness: 0.35, metalness: 0.75 });
  shared.glass = new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xffb547, emissiveIntensity: 2.6, roughness: 0.2, transparent: true, opacity: 0.95 });
  shared.glow = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffc06a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  shared.tipGlow = shared.glow.clone();
  shared.holo = new THREE.MeshBasicMaterial({ color: 0xffc566, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  shared.core = new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffb547, emissiveIntensity: 4, roughness: 0.2 });
  shared.metalLight = new THREE.MeshStandardMaterial({ color: 0xc9d2d8, roughness: 0.25, metalness: 0.85 });
  shared.shadow = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
  return shared;
}

const rbox = (w, h, d, r, seg = 6) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, Math.min(w, h, d) / 2 - 0.001));

// Tronco liso, largo nos ombros e afunilando até o propulsor
function torsoGeometry() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.001, 0.0, 0), new THREE.Vector3(0.2, 0.03, 0), new THREE.Vector3(0.42, 0.22, 0),
    new THREE.Vector3(0.62, 0.62, 0), new THREE.Vector3(0.7, 0.98, 0), new THREE.Vector3(0.62, 1.16, 0),
    new THREE.Vector3(0.36, 1.25, 0), new THREE.Vector3(0.001, 1.27, 0)
  ]);
  const pts = curve.getPoints(48).map(v => new THREE.Vector2(Math.max(0.001, v.x), v.y));
  return new THREE.LatheGeometry(pts, 64);
}

function buildBrasa() {
  const m = materials();
  const root = new THREE.Group();          // flutua
  const body = new THREE.Group();          // gira de leve com o olhar
  root.add(body);

  // Tronco liso
  const torso = new THREE.Mesh(torsoGeometry(), m.shell);
  torso.scale.set(1, 1, 0.84);
  torso.position.y = 0.34;
  body.add(torso);
  // linhas de luz no casco: cintura e ombros
  for (const [y, r] of [[0.66, 0.5], [1.5, 0.5]]) {
    const seam = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 8, 72), m.led);
    seam.rotation.x = Math.PI / 2; seam.scale.set(1, 0.84, 1);
    seam.position.y = y;
    body.add(seam);
  }

  // Propulsor embaixo: é ele que faz o Brasa flutuar
  const thruster = new THREE.Group();
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.12, 40), m.metal);
  thruster.add(nozzle);
  for (const [y, r] of [[-0.06, 0.135], [-0.16, 0.1]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.014, 10, 40), m.led);
    ring.rotation.x = Math.PI / 2; ring.position.y = y;
    thruster.add(ring);
  }
  const flame = new THREE.Sprite(m.glow);
  flame.scale.set(0.5, 0.72, 1);
  flame.position.y = -0.22;
  thruster.add(flame);
  thruster.position.y = 0.33;
  body.add(thruster);

  // O arco da Warden desenhado em luz direto no peito
  const arch = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 10, 40, Math.PI), m.led);
  outer.position.y = 0.08;
  arch.add(outer);
  for (const x of [-0.17, 0.17]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 10), m.led);
    leg.position.set(x, -0.03, 0);
    arch.add(leg);
  }
  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.016, 10, 32, Math.PI), m.led);
  inner.position.y = 0.02;
  arch.add(inner);
  for (const x of [-0.08, 0.08]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.1, 10), m.led);
    leg.position.set(x, -0.03, 0);
    arch.add(leg);
  }
  arch.position.set(0, 1.05, 0.625);
  arch.rotation.x = -0.1;
  body.add(arch);

  // Arcos holográficos girando em volta do corpo
  const orbit = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const seg = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.008, 6, 64, 1.25), m.holo);
    seg.rotation.z = i * (Math.PI * 2 / 3);
    orbit.add(seg);
  }
  const orbitTilt = new THREE.Group();
  orbitTilt.rotation.set(Math.PI / 2 - 0.22, 0, 0.12);
  orbitTilt.position.y = 1.0;
  orbitTilt.add(orbit);
  body.add(orbitTilt);

  // Braços: cápsulas soltas, flutuando ao lado do corpo
  function arm(len, up) {
    const g = new THREE.Group();
    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, len, 10, 24), m.shell);
    limb.position.y = (up ? 1 : -1) * (len / 2 + 0.1);
    g.add(limb);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.01, 8, 32), m.led);
    band.rotation.x = Math.PI / 2;
    band.position.y = (up ? 1 : -1) * (len * 0.62 + 0.1);
    g.add(band);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.15, 28, 18), m.shellDark);
    hand.scale.set(1, 0.9, 1);
    hand.position.y = (up ? 1 : -1) * (len + 0.2);
    g.add(hand);
    return g;
  }
  const armL = arm(0.5, false);
  armL.position.set(-0.84, 1.3, 0);
  armL.rotation.z = -0.12;
  body.add(armL);
  const armR = arm(0.56, true);
  armR.position.set(0.84, 1.32, 0);
  armR.rotation.z = -0.32;
  body.add(armR);

  // Lanterna: um núcleo de luz preso em anéis que giram, flutuando sobre a mão
  const lantern = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 20), m.core);
  core.position.y = 0.08;
  lantern.add(core);
  const coreRings = [];
  for (const [r, rx, ry] of [[0.25, 0, 0], [0.29, Math.PI / 2, 0.5]]) {
    const holder = new THREE.Group();
    holder.position.y = 0.08;
    holder.rotation.set(rx, ry, 0);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.014, 10, 48), m.metalLight);
    holder.add(ring);
    lantern.add(holder);
    coreRings.push(holder);
  }
  const lanternGlow = new THREE.Sprite(m.glow);
  lanternGlow.scale.set(1.5, 1.5, 1);
  lanternGlow.position.y = 0.08;
  lantern.add(lanternGlow);
  const light = new THREE.PointLight(0xffb347, 9, 7, 1.6);
  light.position.y = 0.08;
  lantern.add(light);
  lantern.position.set(0.02, 1.1, 0.05);
  armR.add(lantern);

  // Pescoço: um anel de luz no vão entre o corpo e a cabeça
  const neck = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.016, 10, 48), m.led);
  neck.rotation.x = Math.PI / 2;
  neck.position.y = 1.66;
  body.add(neck);
  const neckGlow = new THREE.Sprite(m.glow.clone());
  neckGlow.scale.set(0.7, 0.3, 1);
  neckGlow.position.y = 1.66;
  body.add(neckGlow);

  // Cabeça (gira para olhar o mouse): flutua solta, com visor envolvendo a frente
  const head = new THREE.Group();
  head.position.y = 1.72;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.5, 64, 40), m.shell);
  skull.scale.set(1.08, 0.8, 0.92);
  skull.position.y = 0.4;
  head.add(skull);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.5, 64, 32, Math.PI / 2 - 1.05, 2.1, Math.PI / 2 - 0.42, 0.84), m.visor);
  visor.scale.set(1.1, 0.83, 0.95);
  visor.position.y = 0.4;
  head.add(visor);
  // contorno de luz em volta do visor
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.008, 6, 96, 2.1), m.led);
  rim.rotation.set(Math.PI / 2, 0, Math.PI / 2 - 1.05 + Math.PI);
  rim.scale.set(1.105, 0.955, 1);
  for (const dy of [-0.175, 0.175]) {
    const r = rim.clone(); r.position.y = 0.4 + dy; r.scale.set(1.105 * Math.cos(dy * 2.4), 0.955 * Math.cos(dy * 2.4), 1);
    head.add(r);
  }
  // antena fina com a ponta acesa
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.026, 0.3, 16), m.metal);
  mast.position.set(0.18, 0.9, -0.04);
  mast.rotation.z = -0.22;
  head.add(mast);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 24, 16), m.eye);
  tip.position.set(0.215, 1.05, -0.04);
  head.add(tip);
  const tipGlow = new THREE.Sprite(m.tipGlow);
  tipGlow.scale.set(0.3, 0.3, 1);
  tipGlow.position.copy(tip.position);
  head.add(tipGlow);

  // Olhos de LED: pílulas deitadas dentro do visor
  const eyes = new THREE.Group();
  eyes.position.set(0, 0.4, 0.48);
  const eyeL = new THREE.Group(), eyeR = new THREE.Group();
  for (const [g, x] of [[eyeL, -0.17], [eyeR, 0.17]]) {
    const led = new THREE.Mesh(rbox(0.17, 0.12, 0.03, 0.055), m.eye);
    g.add(led);
    const glow = new THREE.Sprite(m.glow);
    glow.scale.set(0.42, 0.36, 1);
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

  return { root, body, head, eyes, eyeL, eyeR, armR, armL, lantern, light, lanternGlow, shadow, flame, tipGlow, orbit, coreRings, neckGlow };
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
    b.eyes.position.y = 0.4 - look.y * 0.04;
    b.eyes.position.z = 0.48;

    // Braço da lanterna balança e o fogo tremula
    b.armR.rotation.z = -0.32 + Math.sin(t * 1.6) * 0.045;
    b.armL.rotation.z = -0.12 + Math.sin(t * 1.25 + 1) * 0.03;
    b.lantern.rotation.z = -b.armR.rotation.z * 0.9;
    const flick = 0.82 + 0.1 * Math.sin(t * 11) + 0.08 * Math.sin(t * 23.7 + 1.7);
    b.light.intensity = 9 * flick;
    b.lanternGlow.material.opacity = 0.75 + 0.25 * flick;
    // propulsor pulsando no ritmo da flutuação e antena piscando devagar
    const thrust = 0.85 + Math.sin(t * 1.25 + Math.PI) * 0.12 + Math.sin(t * 17) * 0.04;
    b.flame.scale.set(0.5 * thrust, 0.72 * thrust, 1);
    b.tipGlow.material.opacity = 0.7 + 0.3 * Math.sin(t * 2.2);
    // arcos holográficos e anéis da lanterna girando; a cabeça flutua um pouco fora de fase
    b.orbit.rotation.z = t * 0.35;
    b.coreRings[0].rotation.y = t * 1.1;
    b.coreRings[1].rotation.x = 0.4 + t * 0.8;
    b.head.position.y = 1.72 + Math.sin(t * 1.25 - 0.9) * 0.025;
    b.neckGlow.material.opacity = 0.6 + 0.4 * thrust;

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
