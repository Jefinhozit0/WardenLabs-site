// Estúdio de animações do Brasa para marketing (vídeos verticais 1080×1920).
// Usa o mesmo modelo 3D do site. Cada quadro é calculado só a partir do tempo,
// então a prévia no navegador e o vídeo exportado saem idênticos.
import * as THREE from '../../../public/assets/vendor/three.module.min.js';
import { buildBrasa, materials } from '../../../public/assets/js/brasa3d.js';

const W = 1080, H = 1920, FPS = 30;
const params = new URLSearchParams(location.search);
const RENDER = params.has('render');

// ---------- utilidades de tempo ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ramp = (t, a, b) => clamp((t - a) / (b - a));
const ease = x => x * x * (3 - 2 * x);
const sobe = (t, a, d = 0.5) => ease(ramp(t, a, a + d));            // 0 → 1 a partir de a
const janela = (t, a, b, d = 0.45) => sobe(t, a, d) * (1 - sobe(t, b - d, d)); // aparece em a, some em b
const pulso = (t, a, d) => Math.sin(Math.PI * ramp(t, a, a + d));   // sobe e desce
const frac = x => x - Math.floor(x);
const rnd = i => frac(Math.sin(i * 127.1 + 311.7) * 43758.5453);

// ---------- textos ----------
const MARCA_W = '<svg class="w" viewBox="0 0 34 24"><path d="M3 5 L9 20 L13.5 10 L17 18 L20.5 10 L25 20 L31 5" fill="none" stroke="#f5b042" stroke-width="4.2" stroke-linejoin="round" stroke-linecap="round"/><path d="M3 5 L9 20 L13.5 10" fill="none" stroke="#ffd98a" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" transform="translate(1.6 -1.4)"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 L10 18 L20 6"/></svg>';

const olho = txt => `<p class="mono item"><i></i>${txt}</p>`;
const encerramento = (a, b, chamada = 'wardenlabs.pages.dev') => ({
  de: a, ate: b, classe: 'marca', html:
    `<div class="item">${MARCA_W}</div>
     <p class="nome item"><b>warden</b><span>labs</span></p>
     <p class="mono item">Sites. Automações. Sistemas.</p>
     <div class="item"><span class="site">${chamada}</span></div>`
});

// ---------- clipes ----------
// pose(t) devolve só o que muda em relação ao Brasa parado (ver PADRAO).
const CLIPES = {
  // 1. Acenando: apresenta o Brasa e a promessa da empresa
  oi: {
    dur: 8.4, cam: { largura: 4.5, pes: 0.17, x: 0.22 },
    textos: [
      { de: 0.25, ate: 3.3, html: `${olho('Guardiões do seu próximo passo')}<h1 class="item">Oi, eu sou<br>o <em>Brasa.</em></h1><p class="lead item">De guarda na Warden Labs.</p>` },
      { de: 3.45, ate: 6.1, html: `<h1 class="item">Menos manual.<br>Mais <em>possível.</em></h1><p class="lead item">Sites, automações e sistemas que abrem espaço para o seu negócio crescer.</p>` },
      encerramento(6.25, 99),
    ],
    pose(t) {
      const aceno = janela(t, 0.5, 2.7, 0.4);
      const tchau = janela(t, 6.6, 8.2, 0.35);
      return {
        pulo: pulso(t, 0.25, 0.55) * 0.32 + pulso(t, 6.4, 0.45) * 0.2,
        aceno: Math.max(aceno, tchau),
        feliz: Math.max(janela(t, 0.6, 2.5, 0.15), janela(t, 6.7, 8.1, 0.15)),
        inclina: 0.12 * Math.max(aceno, tchau),
        olharX: -0.25 * aceno + Math.sin(t * 0.9) * 0.12 * janela(t, 3.4, 6.1),
        olharY: -0.75 * janela(t, 3.3, 6.2, 0.5),
        clarao: pulso(t, 0.2, 1.3) * 0.7 + pulso(t, 3.4, 1.1) * 0.9 + pulso(t, 6.2, 1.0) * 0.6,
        brasas: 0.45 + pulso(t, 3.4, 1.6) * 0.5,
      };
    },
  },

  // 2. Acendendo a lanterna: do escuro (tarefa repetida) para a luz
  lanterna: {
    dur: 9.4, cam: { largura: 4.5, pes: 0.17, x: 0.22 },
    textos: [
      { de: 0.4, ate: 3.0, classe: 'apagado', html: `<h1 class="item menor">O seu tempo<br>merece mais do que<br><em>tarefas repetidas.</em></h1>` },
      { de: 3.5, ate: 6.7, html: `${olho('Uma luz para ir além')}<h1 class="item">A gente acende<br><em>o caminho.</em></h1><p class="lead item">Sites, automações e sistemas sob medida para o seu negócio.</p>` },
      encerramento(6.9, 99),
    ],
    pose(t) {
      const aceso = sobe(t, 3.0, 0.5);
      return {
        aceso, ambiente: 0.05 + 0.95 * sobe(t, 3.05, 0.9),
        arcos: sobe(t, 3.2, 1.2), halo: aceso,
        // no escuro ele procura em volta; aceso, olha para a lanterna e depois para a frente
        olharX: Math.sin(t * 2.1) * 0.85 * (1 - sobe(t, 2.5, 0.5)) + 0.7 * janela(t, 2.8, 4.3, 0.4),
        olharY: -0.55 * janela(t, 2.8, 4.3, 0.4) - 0.6 * janela(t, 4.6, 6.7, 0.5),
        bracoLanterna: -0.16 * (1 - sobe(t, 2.6, 0.5)) + 0.1 * pulso(t, 3.0, 0.9),
        pulo: pulso(t, 3.05, 0.45) * 0.16,
        feliz: janela(t, 3.3, 4.4, 0.15) + janela(t, 7.4, 8.6, 0.15),
        clarao: pulso(t, 3.0, 1.5) * 1.6 + pulso(t, 6.9, 1.0) * 0.6,
        brasas: aceso * (0.5 + pulso(t, 3.0, 2.0) * 0.5),
      };
    },
  },

  // 3. Apresentando: os três serviços, um por vez, iluminados pela lanterna
  apresenta: {
    dur: 10.4, cam: { largura: 6.5, pes: 0.1, x: 0.22 },
    textos: [
      {
        de: 0.25, ate: 7.9, html:
          `${olho('O que fazemos')}<h1 class="item menor">Seu negócio é único.<br>A solução <em>também.</em></h1>
           <div class="cartoes">
             <div class="cartao item" data-em="1.7"><span class="n">01</span><div><b>Sentinela</b><span>Sites e landing pages</span></div></div>
             <div class="cartao item" data-em="3.2"><span class="n">02</span><div><b>Guardião</b><span>Automações e integrações</span></div></div>
             <div class="cartao item" data-em="4.7"><span class="n">03</span><div><b>Fortaleza</b><span>Sistemas e portais sob medida</span></div></div>
           </div>`
      },
      encerramento(8.1, 99),
    ],
    pose(t) {
      const mostra = janela(t, 1.4, 7.8, 0.5);
      const batida = pulso(t, 1.7, 0.9) + pulso(t, 3.2, 0.9) + pulso(t, 4.7, 0.9);
      return {
        olharY: -0.95 * mostra,
        olharX: (-0.35 * janela(t, 1.5, 3.1, 0.4) + 0.05 * janela(t, 3.1, 4.6, 0.4) + 0.4 * janela(t, 4.6, 6.2, 0.4)),
        bracoLanterna: 0.06 * mostra + 0.05 * batida,
        pulo: (pulso(t, 1.7, 0.4) + pulso(t, 3.2, 0.4) + pulso(t, 4.7, 0.4)) * 0.1 + pulso(t, 8.2, 0.45) * 0.2,
        clarao: batida * 1.1 + pulso(t, 8.1, 1.0) * 0.6,
        aceno: janela(t, 8.5, 10.1, 0.35), inclina: 0.1 * janela(t, 8.5, 10.1, 0.35),
        feliz: janela(t, 8.6, 10.0, 0.15),
        brasas: 0.4 + batida * 0.5,
      };
    },
  },

  // 4. Comemorando: tudo combinado antes de começar, e a guarda que continua
  comemora: {
    dur: 9.6, cam: { largura: 4.5, pes: 0.17, x: 0.22 },
    textos: [
      {
        de: 0.25, ate: 4.7, html:
          `${olho('Como trabalhamos')}<h1 class="item menor">Tudo combinado<br><em>antes de começar.</em></h1>
           <div class="selos">
             <span class="selo item" data-em="1.3">${CHECK}Escopo</span>
             <span class="selo item" data-em="2.0">${CHECK}Prazo</span>
             <span class="selo item" data-em="2.7">${CHECK}Investimento</span>
           </div>`
      },
      { de: 4.9, ate: 7.1, html: `${olho('Guarda contínua')}<h1 class="item">E a luz<br><em>continua acesa.</em></h1><p class="lead item">A gente segue com você depois da entrega.</p>` },
      encerramento(7.3, 99, 'Vamos conversar?'),
    ],
    pose(t) {
      const pulos = pulso(t, 1.3, 0.5) + pulso(t, 2.0, 0.5) + pulso(t, 2.7, 0.5);
      const festa = janela(t, 1.2, 4.4, 0.3);
      return {
        pulo: pulos * 0.28 + pulso(t, 7.4, 0.45) * 0.2,
        aceno: festa * 0.92, bracoLanterna: 0.16 * festa + 0.2 * janela(t, 4.9, 7.0, 0.5),
        giro: Math.sin(t * 5.2) * 0.2 * festa,
        feliz: Math.max(festa, janela(t, 7.6, 9.2, 0.15)),
        olharY: -0.7 * janela(t, 4.9, 7.0, 0.5), olharX: 0.5 * janela(t, 4.9, 7.0, 0.5),
        clarao: pulos * 1.3 + pulso(t, 4.9, 1.4) * 1.2 + pulso(t, 7.3, 1.0) * 0.6,
        brasas: 0.5 + festa * 0.5 + pulso(t, 4.9, 2) * 0.4,
      };
    },
  },
};

const PADRAO = {
  olharX: 0, olharY: 0, pulo: 0, aceno: 0, inclina: 0, giro: 0, bracoLanterna: 0,
  feliz: 0, clarao: 0, aceso: 1, ambiente: 1, arcos: 1, halo: 1, brasas: 0.45,
};

// ---------- cena ----------
const palco = document.getElementById('palco');
const canvas = document.createElement('canvas');
palco.prepend(canvas);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1013);
const camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 80);

const hemi = new THREE.HemisphereLight(0xa9bccb, 0x141a1f, 1.5);
const key = new THREE.DirectionalLight(0xdbe7ef, 2.3); key.position.set(-3, 4, 5);
const rim = new THREE.DirectionalLight(0xffb45a, 1.4); rim.position.set(3, 2.5, -3);
scene.add(hemi, key, rim);

const m = materials();
const b = buildBrasa();
b.lanternGlow.material = m.glow.clone();      // o brilho da lanterna varia sem mexer no dos olhos
scene.add(b.root, b.shadow);

// Arcos da marca atrás do Brasa
const arcos = new THREE.Group();
const matArcos = [];
[[1.75, 0x2c353d, 1], [1.5, 0x3b4750, 1], [1.25, 0xf5b042, 0.7]].forEach(([r, cor, op]) => {
  const mat = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: op, toneMapped: false });
  mat.userData.op = op; matArcos.push(mat);
  const topo = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 8, 96, Math.PI), mat);
  topo.position.y = 1.6; arcos.add(topo);
  for (const x of [-r, r]) {
    const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.0, 8), mat);
    perna.position.set(x, 0.6, 0); arcos.add(perna);
  }
});
arcos.position.set(0.1, 0, -1.4);
scene.add(arcos);

// Halo âmbar atrás e brasas subindo da lanterna
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: m.glow.map, color: 0xf5b042, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.2 }));
halo.scale.set(7.5, 7.5, 1); halo.position.set(0.2, 1.9, -2.2);
scene.add(halo);

const N_BRASAS = 34, brasas = [];
for (let i = 0; i < N_BRASAS; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: m.glow.map, color: 0xffc06a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(s); brasas.push(s);
}
const posLanterna = new THREE.Vector3();

function enquadra(cam) {
  const altura = cam.largura * H / W;
  const d = altura / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  const cy = altura * (0.5 - cam.pes);
  camera.position.set(cam.x, cy + 0.5, d);
  camera.lookAt(cam.x, cy, 0);
}

function posa(clip, t) {
  const p = { ...PADRAO, ...clip.pose(t) };

  // Flutua, pula e se estica um pouco no pulo
  const bob = Math.sin(t * 1.25) * 0.06;
  b.root.position.y = 0.06 + bob + p.pulo;
  const estica = clamp(p.pulo * 0.35, 0, 0.12);
  b.root.scale.set(1 - estica * 0.5, 1 + estica, 1 - estica * 0.5);
  const sombra = clamp(1 - bob * 1.6 - p.pulo * 0.9, 0.5, 1.2);
  b.shadow.scale.setScalar(sombra);
  b.shadow.material.opacity = clamp(0.85 - bob * 2 - p.pulo, 0.25, 1) * (0.3 + 0.7 * p.ambiente);

  // Olhar
  b.body.rotation.y = p.olharX * 0.16 + p.giro;
  b.head.rotation.y = p.olharX * 0.5 - 0.25 * p.aceno;
  b.head.rotation.x = p.olharY * 0.22;
  b.head.rotation.z = -p.olharX * 0.06 + p.inclina;
  b.eyes.position.set(p.olharX * 0.07, 0.42 - p.olharY * 0.04, 0.5);

  // Braços e lanterna
  b.armR.rotation.z = -0.32 + Math.sin(t * 1.6) * 0.045 + p.bracoLanterna;
  b.armL.rotation.z = -0.12 + Math.sin(t * 1.25 + 1) * 0.03 - 2.35 * p.aceno + Math.sin(t * 13) * 0.32 * p.aceno;
  b.lantern.rotation.z = -b.armR.rotation.z * 0.9;
  const tremula = 0.82 + 0.1 * Math.sin(t * 11) + 0.08 * Math.sin(t * 23.7 + 1.7);
  b.light.intensity = 9 * tremula * p.aceso * (1 + p.clarao * 1.6);
  m.glass.emissiveIntensity = 2.6 * (0.04 + 0.96 * p.aceso) * (1 + p.clarao * 0.5);
  b.lanternGlow.material.opacity = clamp((0.75 + 0.25 * tremula) * p.aceso + p.clarao * 0.2 * p.aceso);
  b.lanternGlow.scale.setScalar(1.3 * (1 + p.clarao * 0.45));

  // Olhos: piscam sozinhos e fecham num sorriso quando ele está feliz
  const fase = (t + 2.2) % 3.4;
  let pisca = 1;
  if (fase < 0.16) { const q = fase / 0.16; pisca = Math.max(0.1, q < 0.5 ? 1 - q * 1.8 : 0.1 + (q - 0.5) * 1.8); }
  b.eyeL.scale.y = b.eyeR.scale.y = Math.min(pisca, 1 - clamp(p.feliz) * 0.72);

  // Luz ambiente, arcos e halo
  hemi.intensity = 1.5 * p.ambiente; key.intensity = 2.3 * p.ambiente; rim.intensity = 1.4 * p.ambiente;
  matArcos.forEach(mat => { mat.opacity = mat.userData.op * p.arcos; });
  arcos.visible = p.arcos > 0.01;
  halo.material.opacity = (0.16 + p.clarao * 0.1) * p.halo;

  // Brasas sobem a partir da lanterna
  b.root.updateMatrixWorld(true);
  b.lantern.getWorldPosition(posLanterna);
  brasas.forEach((s, i) => {
    const vida = frac(t * (0.22 + rnd(i) * 0.2) + rnd(i + 50));
    const lado = (rnd(i + 9) - 0.5);
    s.position.set(
      posLanterna.x + lado * 0.35 + Math.sin(vida * 6 + i) * 0.12 + lado * vida * 1.1,
      posLanterna.y + 0.25 + vida * (1.4 + rnd(i + 3) * 1.4),
      posLanterna.z + (rnd(i + 20) - 0.5) * 0.6);
    const ativo = rnd(i + 70) < p.brasas ? 1 : 0;
    s.material.opacity = Math.sin(Math.PI * vida) * 0.9 * ativo * p.aceso;
    s.scale.setScalar(0.05 + rnd(i + 30) * 0.09);
  });
}

// ---------- textos na tela ----------
const camada = document.getElementById('textos');
let atual = null, blocos = [];

function monta(nome) {
  atual = nome;
  camada.innerHTML = '';
  blocos = CLIPES[nome].textos.map(tx => {
    const el = document.createElement('div');
    el.className = 'bloco ' + (tx.classe || '');
    el.innerHTML = tx.html;
    camada.appendChild(el);
    const itens = [...el.querySelectorAll('.item')].map((it, i) => ({
      el: it, em: it.dataset.em ? +it.dataset.em : tx.de + i * 0.16,
    }));
    return { el, tx, itens };
  });
  enquadra(CLIPES[nome].cam);
}

function escreve(t) {
  for (const { el, tx, itens } of blocos) {
    const sai = 1 - sobe(t, tx.ate - 0.4, 0.4);
    const visivel = t >= tx.de - 0.05 && sai > 0.001;
    el.style.visibility = visivel ? 'visible' : 'hidden';
    if (!visivel) continue;
    el.style.opacity = sai.toFixed(3);
    el.style.transform = `translateY(${((1 - sai) * -30).toFixed(1)}px)`;
    for (const it of itens) {
      const k = sobe(t, it.em, 0.55);
      it.el.style.opacity = k.toFixed(3);
      it.el.style.transform = `translateY(${((1 - k) * 44).toFixed(1)}px)`;
    }
  }
}

function quadro(nome, t) {
  if (nome !== atual) monta(nome);
  posa(CLIPES[nome], t);
  escreve(t);
  renderer.render(scene, camera);
}

// ---------- exportação e prévia ----------
window.estudio = {
  fps: FPS,
  clipes: Object.fromEntries(Object.entries(CLIPES).map(([k, c]) => [k, c.dur])),
  pronto: document.fonts.ready.then(() => true),
  quadro,
};

if (RENDER) {
  document.documentElement.classList.add('render');
} else {
  const nome = CLIPES[params.get('clipe')] ? params.get('clipe') : 'oi';
  const menu = document.getElementById('menu');
  for (const k of Object.keys(CLIPES)) {
    const a = document.createElement('a');
    a.href = '?clipe=' + k; a.textContent = k;
    if (k === nome) a.setAttribute('aria-current', 'true');
    menu.appendChild(a);
  }
  const ajusta = () => {
    const s = Math.min(innerWidth / W, innerHeight / H);
    palco.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
  };
  addEventListener('resize', ajusta); ajusta();
  const t0 = performance.now();
  const roda = agora => { quadro(nome, ((agora - t0) / 1000) % CLIPES[nome].dur); requestAnimationFrame(roda); };
  window.estudio.pronto.then(() => requestAnimationFrame(roda));
}
