// 用真实时间渲染截图 + 导出通用 GLB（不依赖 --virtual-time-budget）
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const WORK = 'C:/Users/jadezhang/WorkBuddy/2026-11-14-13-41-28/jingshan-temple';
const FILE = 'file:///' + WORK + '/index.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: 420000,
  args: [
    '--no-sandbox', '--disable-gpu-sandbox',
    '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--allow-file-access-from-files', '--hide-scrollbars'
  ]
});

const shots = [
  { name: 'top',   w: 900,  h: 1400, q: 'static&view=top&clean' },
  { name: 'axis',  w: 1440, h: 900,  q: 'static&view=axis' },
  { name: 'pond',  w: 1440, h: 900,  q: 'static&view=pond' },
  { name: 'site',  w: 1440, h: 900,  q: 'static&view=site&clean' },
  { name: 'gate',  w: 1440, h: 900,  q: 'static&view=gate&clean' },
  { name: 'front', w: 1440, h: 900,  q: 'static&view=front&clean' },
  { name: 'court', w: 1440, h: 900,  q: 'static&view=court' },
  { name: 'court_top', w: 1200, h: 900, q: 'static&view=courtTop&clean' },
  { name: 'cloister', w: 1440, h: 900,  q: 'static&view=cloister&clean' }
];

const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });

for (const s of shots) {
  await page.setViewport({ width: s.w, height: s.h, deviceScaleFactor: 1 });
  await page.goto(FILE + '?' + s.q, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction('window.__TEMPLE_READY__ === true', { timeout: 90000 });
  await sleep(1800);
  const out = path.join(WORK, 'preview_' + s.name + '.png');
  await page.screenshot({ path: out });
  const stats = await page.evaluate(() => window.__MODEL_STATS__);
  console.log('SHOT', s.name, out, JSON.stringify(stats));
}

// 导出 GLB
console.log('EXPORT START');
const b64 = await page.evaluate(async () => {
  const u8 = await window.__EXPORT_GLB__();
  let bin = '';
  const CH = 0x4000;
  for (let i = 0; i < u8.length; i += CH) {
    bin += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
  }
  return btoa(bin);
});
const buf = Buffer.from(b64, 'base64');
const glbPath = path.join(WORK, 'temple.glb');
fs.writeFileSync(glbPath, buf);
console.log('EXPORT DONE', glbPath, buf.length, 'bytes');

// GLB 头校验
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
console.log('GLB CHECK', JSON.stringify({
  generator: json.asset && json.asset.generator,
  nodes: (json.nodes || []).length,
  meshes: (json.meshes || []).length,
  materials: (json.materials || []).length,
  images: (json.images || []).length,
  extensionsRequired: json.extensionsRequired || [],
  magic: buf.subarray(0, 4).toString()
}));

console.log('JS ERRORS', errors.length ? JSON.stringify(errors.slice(0, 8)) : 'none');
await browser.close();
