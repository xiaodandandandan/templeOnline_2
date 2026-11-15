// 验收：参考韩国山寺扩容后的殿内席位 / 锚点 / 蒲团吸附跪拜 / 全寺俯瞰
import puppeteer from 'puppeteer-core';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://127.0.0.1:4173';
const OUT = 'C:/Users/jadezhang/WorkBuddy/2026-11-14-13-41-28/jingshan-worship';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, protocolTimeout: 420000,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--hide-scrollbars'],
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 180)); });
await page.setViewport({ width: 1500, height: 940, deviceScaleFactor: 1 });
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => !!document.querySelector('.status.on'), { timeout: 120000 });
await sleep(2200);

const frame = page.frames().find((f) => f.url().includes('/temple/index.html'));
const reg = frame ? await frame.evaluate(() => {
  const R = window.__INTERIOR__ || {};
  const A = R.anchors || [];
  return {
    seats: R.seats,
    totalSeats: Object.values(R.seats || {}).reduce((s, n) => s + n, 0),
    anchors: A.length,
    cushion: A.filter((a) => a.kind === 'cushion').length,
    yawed: A.filter((a) => a.kind === 'cushion' && typeof a.yaw === 'number').length,
    kinds: [...new Set(A.map((a) => a.kind))],
    boxes: (R.boxes || []).length,
    stats: window.__MODEL_STATS__,
  };
}) : null;
console.log('REGISTRY', JSON.stringify(reg));

// 走进天王殿（Shift + W 加速穿过中央券门）
if (frame) {
  await frame.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }));
  });
  // 无头软件渲染帧率不稳：按位置轮询直到确实进入殿内
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    if (await frame.evaluate(() => window.__AVATAR__.position.z < -1.0)) break;
  }
  await frame.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft', bubbles: true }));
  });
  await sleep(700);
  const inside = await frame.evaluate(() => ({
    z: +window.__AVATAR__.position.z.toFixed(2),
    cutaway: window.__CUTAWAY_ID__,
    kneelP: window.__KNEEL_P__,
  }));
  const hud = await page.evaluate(() => ({
    insideTag: document.querySelector('.pos .inside')?.textContent.replace(/\s+/g, ' ').trim(),
    hint: document.querySelector('.hint')?.textContent.trim(),
  }));
  console.log('INSIDE', JSON.stringify({ ...inside, ...hud }));
  await page.screenshot({ path: path.join(OUT, 'app-interior-expanded.png') });

  // 殿内按 E：吸附最近蒲团并面朝主尊后跪拜
  await frame.evaluate(() =>
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true })));
  await sleep(500);
  const seat = await frame.evaluate(() => ({
    seat: window.__SEAT__ || null,
    x: +window.__AVATAR__.position.x.toFixed(2),
    z: +window.__AVATAR__.position.z.toFixed(2),
    yaw: +window.__AVATAR__.rotation.y.toFixed(2),
    kneelP: +window.__KNEEL_P__.toFixed(2),
  }));
  const toast = await page.$eval('.toast', (el) => el.textContent.trim()).catch(() => '');
  console.log('SEAT', JSON.stringify({ ...seat, toast }));
  await page.screenshot({ path: path.join(OUT, 'app-kneel-seat.png') });
}

// 滚轮拉远：全寺俯瞰仍可见全部殿名
await page.mouse.move(750, 520);
for (let i = 0; i < 12; i++) { await page.mouse.wheel({ deltaY: 300 }); await sleep(90); }
await sleep(1500);
console.log('OVERVIEW', JSON.stringify({
  marks: await page.evaluate(() => document.querySelectorAll('.hall-mark').length),
  dist: frame ? await frame.evaluate(() => window.__ZOOM_DIST__) : null,
}));

console.log('JS ERRORS', errors.length ? JSON.stringify(errors.slice(0, 10)) : 'none');
await browser.close();
