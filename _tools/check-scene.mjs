import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FILE = 'file:///C:/Users/jadezhang/WorkBuddy/2026-11-14-13-41-28/jingshan-temple/index.html?static&view=top&clean';
const b = await puppeteer.launch({
  executablePath: CHROME, headless: true, protocolTimeout: 300000,
  args: ['--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader', '--allow-file-access-from-files', '--hide-scrollbars'],
});
const p = await b.newPage();
const errs = [];
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 220)); });
await p.setViewport({ width: 1000, height: 1000 });
await p.goto(FILE, { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction('window.__TEMPLE_READY__ === true', { timeout: 120000 }).catch(() => {});
await new Promise(r => setTimeout(r, 1500));
const info = await p.evaluate(() => {
  const R = window.__INTERIOR__;
  return {
    ready: window.__TEMPLE_READY__ === true,
    stats: window.__MODEL_STATS__,
    boxes: R ? R.boxes.length : 0,
    roofs: R ? Object.keys(R.roofs).length : 0,
    anchors: R ? R.anchors.length : 0,
    sampleBox: R ? R.boxes[0] : null,
    anchorKinds: R ? [...new Set(R.anchors.map(a => a.kind))] : [],
    tianwangRoofVisible: R ? R.roofs['tianwang'].visible : null,
  };
});
console.log('SCENE', JSON.stringify(info));
console.log('JS ERRORS', errs.length ? JSON.stringify(errs.slice(0, 8)) : 'none');
await b.close();
