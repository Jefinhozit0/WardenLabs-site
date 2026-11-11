// Gera de novo o kit do Brasa (brasa.glb e as 6 imagens) na pasta marketing/brasa.
//
//   npm run kit                    → tudo
//   node gerar-kit.mjs --pasta=X   → salva em outra pasta
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '../../..');
const args = process.argv.slice(2);
const saida = (args.find(a => a.startsWith('--pasta=')) || '').slice(8) || path.resolve(aqui, '..');

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const servidor = http.createServer((req, res) => {
  const arq = path.normalize(path.join(raiz, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!arq.startsWith(raiz) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(arq).pipe(res);
});
await new Promise(ok => servidor.listen(0, '127.0.0.1', ok));

const { default: puppeteer } = await import('puppeteer-core');
const chrome = [process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome',
].find(p => p && fs.existsSync(p));
if (!chrome) throw new Error('Não achei o Chrome. Defina CHROME_PATH com o caminho do navegador.');

const nav = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
try {
  const pag = await nav.newPage();
  pag.on('pageerror', e => console.error('Erro na página:', e.message));
  await pag.goto(`http://127.0.0.1:${servidor.address().port}/marketing/brasa/animacoes/kit.html`, { waitUntil: 'networkidle0' });
  await pag.waitForFunction('window.kit');
  fs.mkdirSync(saida, { recursive: true });
  for (const nome of await pag.evaluate(() => window.kit.nomes)) {
    const url = await pag.evaluate(n => window.kit.foto(n), nome);
    fs.writeFileSync(path.join(saida, nome + '.png'), Buffer.from(url.split(',')[1], 'base64'));
    console.log(nome + '.png');
  }
  fs.writeFileSync(path.join(saida, 'brasa.glb'), Buffer.from(await pag.evaluate(() => window.kit.glb()), 'base64'));
  console.log('brasa.glb');
} finally {
  await nav.close();
  servidor.close();
}
