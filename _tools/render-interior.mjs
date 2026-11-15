// 渲染扩容后的法堂内部（剖视）截图：参考韩国线上山寺 SANSA 的殿内视角
import puppeteer from 'puppeteer-core';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const WORK = 'C:/Users/jadezhang/WorkBuddy/2026-11-14-13-41-28/jingshan-temple';
const FILE = 'file:///' + WORK + '/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, protocolTimeout: 300000,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader', '--allow-file-access-from-files', '--hide-scrollbars'],
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('ERR_FILE_NOT_FOUND')) {
    errors.push('console: ' + m.text().slice(0, 200));
  }
});

const all = [
  { name: 'interior_hall',   view: 'hall',    cut: 'shijia',   w: 1440, h: 900 },
  { name: 'interior_shrine', view: 'shrine',  cut: 'shijia',   w: 1440, h: 900 },
  { name: 'interior_tianwang', view: 'hall_tw', cut: 'tianwang', w: 1440, h: 900 },
];
const only = process.argv[2];
const shots = only ? all.filter((s) => s.name.includes(only)) : all;

for (const s of shots) {
  await page.setViewport({ width: s.w, height: s.h, deviceScaleFactor: 1 });
  await page.goto(FILE + '?static&view=' + s.view + '&clean', { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction('window.__TEMPLE_READY__ === true', { timeout: 90000 });
  await sleep(1800);
  const info = await page.evaluate((cut) => {
    const R = window.__INTERIOR__;
    R.roofs[cut].visible = false;               // 剖视：隐藏该殿屋顶 / 天花 / 前墙
    return {
      seats: R.seats,
      anchors: R.anchors.length,
      cushion: R.anchors.filter((a) => a.kind === 'cushion').length,
      kinds: [...new Set(R.anchors.map((a) => a.kind))],
      stats: window.__MODEL_STATS__,
    };
  }, s.cut);
  await sleep(600);
  const out = path.join(WORK, s.name + '.png');
  await page.screenshot({ path: out });
  console.log('SHOT', s.name, out);
  if (s === shots[0]) console.log('INTERIOR', JSON.stringify(info));
}

console.log('JS ERRORS', errors.length ? JSON.stringify(errors.slice(0, 8)) : 'none');
await browser.close();
