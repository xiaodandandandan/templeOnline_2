// 验收：航拍攻略图标注点已注入 3D 运行时，并在全寺俯瞰时由 Vue 叠加显示
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
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => !!document.querySelector('.status.on'), { timeout: 120000 });
await sleep(2000);

const frame = page.frames().find((f) => f.url().includes('/temple/index.html'));
const plan = frame ? await frame.evaluate(() => {
  const P = window.__SITE_PLAN__ || [];
  return {
    total: P.length,
    guide: P.filter((p) => p.guide).length,
    names: P.map((p) => p.name),
    numbered: P.filter((p) => p.no).map((p) => p.no + ':' + p.name),
  };
}) : null;
console.log('SITE_PLAN', JSON.stringify(plan));

// 滚轮拉远进入全寺俯瞰：中轴殿名 + 航拍导览点同时出现
await page.mouse.move(800, 560);
for (let i = 0; i < 12; i++) { await page.mouse.wheel({ deltaY: 300 }); await sleep(90); }
await sleep(1600);
const overview = await page.evaluate(() => ({
  all: [...document.querySelectorAll('.hall-mark')].map((el) => el.textContent.trim()),
  guides: [...document.querySelectorAll('.hall-mark.guide')].map((el) => el.textContent.trim()),
  zoom: document.querySelector('.zoom-row b')?.textContent.trim(),
}));
console.log('OVERVIEW', JSON.stringify(overview));
await page.screenshot({ path: path.join(OUT, 'app-overview-guide.png') });

console.log('JS ERRORS', errors.length ? JSON.stringify(errors.slice(0, 10)) : 'none');
await browser.close();
