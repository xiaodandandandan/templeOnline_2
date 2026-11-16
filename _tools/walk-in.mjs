// 验收：人物走进殿内时的实际第三人称画面（相机是否跟入、剖视是否生效）
import puppeteer from 'puppeteer-core';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const WORK = 'C:/Users/jadezhang/WorkBuddy/2026-11-14-13-41-28/jingshan-worship';
const FILE = 'file:///' + WORK + '/public/temple/index.html?embed';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, protocolTimeout: 300000,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader', '--allow-file-access-from-files', '--hide-scrollbars',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(FILE, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction('window.__TEMPLE_BRIDGE_READY__ === true', { timeout: 120000 });
await sleep(2000);

const cmd = (payload) => page.evaluate((p) => {
  window.postMessage({ __channel: 'JINGSHAN_TEMPLE', version: 2, kind: 'cmd', payload: p }, '*');
}, payload);
const state = () => page.evaluate(() => ({
  cut: window.__CUTAWAY_ID__ ?? null,
  zoom: window.__ZOOM_DIST__ ?? null,
  av: window.__AVATAR__ ? {
    x: +window.__AVATAR__.position.x.toFixed(2),
    y: +window.__AVATAR__.position.y.toFixed(2),
    z: +window.__AVATAR__.position.z.toFixed(2),
  } : null,
  cam: window.__CAM__ ? {
    x: +window.__CAM__.position.x.toFixed(2),
    y: +window.__CAM__.position.y.toFixed(2),
    z: +window.__CAM__.position.z.toFixed(2),
  } : null,
}));

const hall = process.argv[2] || 'shijia';
const shots = [];
await cmd({ cmd: 'teleport', hallId: hall });
await sleep(700);
console.log('@door', JSON.stringify(await state()));
shots.push(['a_door', await state()]);
await page.screenshot({ path: path.join(WORK, `walkin_${hall}_0door.png`) });

// 向前走：每秒采样一次，抓进殿前后的相机状态
await cmd({ cmd: 'setMove', forward: 1 });
for (let i = 1; i <= 4; i++) {
  await sleep(1000);
  const st = await state();
  console.log(`@${i}s`, JSON.stringify(st));
  await page.screenshot({ path: path.join(WORK, `walkin_${hall}_${i}s.png`) });
}
await cmd({ cmd: 'setMove', forward: 0 });
await sleep(600);
console.log('@stop', JSON.stringify(await state()));
await page.screenshot({ path: path.join(WORK, `walkin_${hall}_stop.png`) });

console.log('JS ERRORS', errors.length ? JSON.stringify(errors.slice(0, 6)) : 'none');
await browser.close();
