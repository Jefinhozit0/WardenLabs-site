// Gera o kit de marketing do Brasa: o modelo .glb e as imagens paradas.
// Usa o mesmo modelo 3D do site. Quem chama é o gerar-kit.mjs (npm run kit).
import * as THREE from '../../../public/assets/vendor/three.module.min.js';
import { buildBrasa } from '../../../public/assets/js/brasa3d.js';
import { GLTFExporter } from './GLTFExporter.js';

function cena(fundo) {
  const scene = new THREE.Scene();
  if (fundo != null) scene.background = new THREE.Color(fundo);
  scene.add(new THREE.HemisphereLight(0xa9bccb, 0x141a1f, 1.5));
  const key = new THREE.DirectionalLight(0xdbe7ef, 2.3); key.position.set(-3, 4, 5);
  const rim = new THREE.DirectionalLight(0xffb45a, 1.4); rim.position.set(3, 2.5, -3);
  scene.add(key, rim);
  return scene;
}

// Mesma pose do site, com o olhar pedido (x: -1 esquerda … 1 direita; y: -1 cima … 1 baixo)
function posar(b, x, y) {
  b.root.position.y = 0.06;
  b.body.rotation.y = x * 0.16;
  b.head.rotation.set(y * 0.22, x * 0.5, -x * 0.06);
  b.eyes.rotation.set(y * 0.13, x * 0.2, 0);
  b.lantern.rotation.z = -b.armR.rotation.z * 0.9;
  b.orbit.rotation.z = 0.6;
  b.coreRings[0].rotation.y = 0.5;
  b.coreRings[1].rotation.x = 1.0;
}

function foto({ w, h, fundo = null, olhar = [0, 0], cam = [0, 1.62, 8.6], alvo = [0, 1.5, 0], fov = 28, sombra = true }) {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const scene = cena(fundo);
  const b = buildBrasa();
  posar(b, olhar[0], olhar[1]);
  scene.add(b.root);
  if (sombra) scene.add(b.shadow);
  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 50);
  camera.position.set(...cam);
  camera.lookAt(...alvo);
  let url;
  if (fundo != null) {
    renderer.render(scene, camera);
    url = canvas.toDataURL('image/png');
  } else {
    // Fundo transparente: fotografa no preto e no branco e tira a transparência da diferença.
    // Assim os brilhos (halo dos olhos, do núcleo e do propulsor) saem certos em qualquer fundo.
    const ler = cor => {
      renderer.setClearColor(cor, 1);
      renderer.render(scene, camera);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(canvas, 0, 0);
      return { c, g, d: g.getImageData(0, 0, w, h) };
    };
    const preto = ler(0x000000), branco = ler(0xffffff).d.data;
    const px = preto.d.data;
    for (let i = 0; i < px.length; i += 4) {
      const a = 1 - Math.max(0, Math.max(branco[i] - px[i], branco[i + 1] - px[i + 1], branco[i + 2] - px[i + 2])) / 255;
      if (a <= 0.004) { px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0; continue; }
      px[i] = Math.min(255, px[i] / a); px[i + 1] = Math.min(255, px[i + 1] / a); px[i + 2] = Math.min(255, px[i + 2] / a);
      px[i + 3] = Math.round(a * 255);
    }
    preto.g.putImageData(preto.d, 0, 0);
    url = preto.c.toDataURL('image/png');
  }
  renderer.dispose();
  renderer.forceContextLoss();
  return url;
}

const FOTOS = {
  'brasa-frente': { w: 2000, h: 2200 },
  'brasa-olhando-esquerda': { w: 2000, h: 2200, olhar: [-0.85, 0] },
  'brasa-olhando-direita': { w: 2000, h: 2200, olhar: [0.85, 0] },
  'brasa-olhando-para-cima': { w: 2000, h: 2200, olhar: [0, -0.9] },
  'brasa-frente-fundo-escuro': { w: 2000, h: 2200, fundo: 0x0d1013 },
  'brasa-avatar': { w: 1024, h: 1024, fundo: 0x0d1013, cam: [0, 2.16, 4.6], alvo: [0, 2.14, 0], fov: 24, sombra: false },
};

// Modelo com as partes nomeadas, para posar no Blender ou no PowerPoint
async function glb() {
  const b = buildBrasa();
  posar(b, 0, 0);
  b.root.position.y = 0;
  const nomes = {
    root: 'Brasa', body: 'Corpo', head: 'Cabeca', eyes: 'Olhos', eyeL: 'Olho_esquerdo', eyeR: 'Olho_direito',
    armR: 'Braco_da_luz', armL: 'Braco_esquerdo', lantern: 'Nucleo_de_luz', light: 'Luz_do_nucleo', orbit: 'Arcos_holograficos',
  };
  for (const [k, nome] of Object.entries(nomes)) b[k].name = nome;
  // os brilhos (sprites) são efeito de tela e não existem no formato .glb
  const sprites = [];
  b.root.traverse(o => { if (o.isSprite) sprites.push(o); });
  sprites.forEach(o => o.parent.remove(o));
  const buf = await new GLTFExporter().parseAsync(b.root, { binary: true });
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

window.kit = { nomes: Object.keys(FOTOS), foto: nome => foto(FOTOS[nome]), glb };
