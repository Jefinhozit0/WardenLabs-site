// Gera os vídeos do Brasa (MP4 vertical 1080×1920) a partir de estudio.html.
//
//   npm run videos                 → todos os clipes
//   node gerar.mjs oi lanterna     → só os clipes pedidos
//   node gerar.mjs --fotos=1.5,4   → em vez de vídeo, salva um PNG de cada clipe nesses segundos
//   npm run previa                 → só liga o servidor, para ver no navegador
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../../..');
const saida = path.join(aqui, 'videos');
const args = process.argv.slice(2);
const pedidos = args.filter(a => !a.startsWith('--'));
const fotos = (args.find(a => a.startsWith('--fotos=')) || '').slice(8).split(',').filter(Boolean).map(Number);
const pastaFotos = (args.find(a => a.startsWith('--pasta=')) || '').slice(8) || path.join(saida, 'fotos');
const soPrevia = args.includes('--previa');

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
const servidor = http.createServer((req, res) => {
  const arq = path.normalize(path.join(raiz, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!arq.startsWith(raiz) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(arq).pipe(res);
});
await new Promise(ok => servidor.listen(soPrevia ? 4174 : 0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${servidor.address().port}/marketing/brasa/animacoes/estudio.html`;

if (soPrevia) {
  console.log(`Prévia: ${base}\nCtrl+C para parar.`);
} else {
  const { default: puppeteer } = await import('puppeteer-core');
  const { default: ffmpeg } = await import('ffmpeg-static');
  const chrome = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome',
  ].find(p => p && fs.existsSync(p));
  if (!chrome) throw new Error('Não achei o Chrome. Defina CHROME_PATH com o caminho do navegador.');

  const nav = await puppeteer.launch({
    executablePath: chrome, headless: true,
    args: ['--hide-scrollbars', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--force-device-scale-factor=1'],
  });
  try {
    const pag = await nav.newPage();
    pag.on('pageerror', e => console.error('Erro na página:', e.message));
    await pag.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    await pag.goto(base + '?render', { waitUntil: 'networkidle0' });
    await pag.waitForFunction('window.estudio && window.estudio.pronto');
    await pag.evaluate(() => window.estudio.pronto);
    const { fps, clipes } = await pag.evaluate(() => ({ fps: window.estudio.fps, clipes: window.estudio.clipes }));
    const nomes = pedidos.length ? pedidos : Object.keys(clipes);
    const foto = () => pag.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1920 } });

    for (const nome of nomes) {
      if (!(nome in clipes)) { console.error(`Clipe desconhecido: ${nome} (existem: ${Object.keys(clipes).join(', ')})`); continue; }
      if (fotos.length) {
        fs.mkdirSync(pastaFotos, { recursive: true });
        for (const t of fotos) {
          await pag.evaluate((n, t) => window.estudio.quadro(n, t), nome, t);
          fs.writeFileSync(path.join(pastaFotos, `${nome}-${t.toFixed(1)}s.png`), await foto());
        }
        console.log(`${nome}: ${fotos.length} foto(s)`);
        continue;
      }
      fs.mkdirSync(saida, { recursive: true });
      const destino = path.join(saida, `brasa-${nome}.mp4`);
      const ff = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', destino],
        { stdio: ['pipe', 'inherit', 'inherit'] });
      const fim = new Promise((ok, erro) => ff.on('close', c => c === 0 ? ok() : erro(new Error('ffmpeg saiu com código ' + c))));
      const total = Math.round(clipes[nome] * fps);
      for (let i = 0; i < total; i++) {
        await pag.evaluate((n, t) => window.estudio.quadro(n, t), nome, i / fps);
        if (!ff.stdin.write(await foto())) await new Promise(ok => ff.stdin.once('drain', ok));
        if (i % 30 === 0) process.stdout.write(`\r${nome}: ${Math.round(i / total * 100)}%   `);
      }
      ff.stdin.end();
      await fim;
      console.log(`\r${nome}: pronto → ${path.relative(raiz, destino)} (${(fs.statSync(destino).size / 1e6).toFixed(1)} MB)`);
    }
  } finally {
    await nav.close();
    servidor.close();
  }
}
