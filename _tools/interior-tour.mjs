// 验收：逐殿进入后的殿内视角（中部 / 佛前两个机位）
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
await sleep(1500);

const cmd = (payload) => page.evaluate((p) => {
  window.postMessage({ __channel: 'JINGSHAN_TEMPLE', version: 2, kind: 'cmd', payload: p }, '*');
}, payload);
const state = () => page.evaluate(() => ({
  cut: window.__CUTAWAY_ID__ ?? null,
  inHall: window.__IN_HALL__ ?? null,
  tgt: window.__CAM_TGT__ ?? null,
  zoom: window.__ZOOM_DIST__ ?? null,
  av: window.__AVATAR__ ? [
    +window.__AVATAR__.position.x.toFixed(2),
    +window.__AVATAR__.position.y.toFixed(2),
    +window.__AVATAR__.position.z.toFixed(2)] : null,
  cam: window.__CAM__ ? [
    +window.__CAM__.position.x.toFixed(2),
    +window.__CAM__.position.y.toFixed(2),
    +window.__CAM__.position.z.toFixed(2)] : null,
}));

const halls = process.argv.slice(2).length ? process.argv.slice(2)
  : ['shijia', 'chaoyin', 'guanyin', 'lingxiao', 'tianwang', 'side_2_l', 'side_2_r'];

// 直接按室内注册表定位：中部（进深 55%）与近佛（进深 25%）
const spots = await page.evaluate(() => {
  const R = window.__INTERIOR__;
  const out = {};
  R.boxes.forEach((b) => {
    const cx = (b.inner.x0 + b.inner.x1) / 2;
    const d = b.inner.z1 - b.inner.z0;
    // 朝向由“主尊锚点 − 室内中心”反推：配殿整体旋转 90°，不能用固定 yaw=0
    const sa = R.anchors.find((a) => a.hallId === b.id && a.kind === 'statue');
    const czc = (b.inner.z0 + b.inner.z1) / 2;
    out[b.id] = {
      mid: [cx, b.inner.z0 + d * 0.55],
      front: [cx, b.inner.z0 + d * 0.28],
      yaw: sa ? Math.atan2(sa.x - cx, -(sa.z - czc)) : 0,
      d,
    };
  });
  return out;
});

for (const hall of halls) {
  const s = spots[hall];
  if (!s) { console.log(hall, 'MISSING'); continue; }
  for (const [tag, pos] of [['mid', s.mid], ['front', s.front]]) {
    await cmd({ cmd: 'placeAt', x: pos[0], z: pos[1], yaw: s.yaw });
    await sleep(500);
    // 反复 snap，直到实际机位与目标机位一致（软件渲染帧率极低，单次尝试不可靠）
    for (let k = 0; k < 8; k++) {
      await cmd({ cmd: 'snapCam' });
      await page.evaluate(() => {
        if (window.__AVATAR_UPDATE__) window.__AVATAR_UPDATE__();
        if (window.__RENDER_ONCE__) window.__RENDER_ONCE__();
      });
      await sleep(400);
      const chk = await state();
      if (chk.cam && chk.tgt &&
        Math.hypot(chk.cam[0] - chk.tgt.x, chk.cam[2] - chk.tgt.z) < 0.5) break;
    }
    // 等人物真正落到目标点（软件渲染帧率低，postMessage 派发后再等两拍）
    for (let k = 0; k < 12; k++) {
      await sleep(300);
      const st = await state();
      if (st.av && Math.abs(st.av[2] - pos[1]) < 1.0) break;
    }
    // 软件渲染下 GPU 缓冲滞后，截图前再驱动一帧并多等一拍
    await page.evaluate(() => {
      if (window.__AVATAR_UPDATE__) window.__AVATAR_UPDATE__();
      if (window.__RENDER_ONCE__) window.__RENDER_ONCE__();
    });
    await sleep(900);
    console.log(hall, tag, JSON.stringify(await state()));
    await page.screenshot({ path: path.join(WORK, `tour_${hall}_${tag}.png`) });
  }
}

console.log('JS ERRORS', errors.length ? JSON.stringify(errors.slice(0, 6)) : 'none');
await browser.close();
