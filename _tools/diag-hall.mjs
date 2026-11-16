// 诊断：把相机放在殿中心、超广角分别朝四个方向，看殿内到底缺什么
import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const WORK = 'C:/Users/jadezhang/WorkBuddy/2026-11-14-13-41-28/jingshan-worship';
const FILE = 'file:///' + WORK + '/public/temple/index.html?embed';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hall = process.argv[2] || 'tianwang';

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, protocolTimeout: 300000,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--allow-file-access-from-files', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
await page.goto(FILE, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction('window.__TEMPLE_BRIDGE_READY__ === true', { timeout: 120000 });
await sleep(1200);

const info = await page.evaluate((id) => {
  const R = window.__INTERIOR__;
  const b = R.boxes.find((x) => x.id === id);
  return { inner: b.inner, ceilY: b.ceilY, floorY: b.floorY, iw: b.innerW, idp: b.innerD };
}, hall);
console.log(JSON.stringify(info));

const cmd = (payload) => page.evaluate((pl) => {
  window.postMessage({ __channel: 'JINGSHAN_TEMPLE', version: 2, kind: 'cmd', payload: pl }, '*');
}, payload);

const dirs = [['altar', 0], ['door', Math.PI], ['sideL', Math.PI / 2], ['sideR', -Math.PI / 2]];
for (const [tag, yaw] of dirs) {
  await cmd({ cmd: 'placeAt', x: (info.inner.x0 + info.inner.x1) / 2, z: (info.inner.z0 + info.inner.z1) / 2 + 0.6, yaw });
  await sleep(400);
  await cmd({ cmd: 'snapCam' });
  await sleep(500);
  await page.evaluate(() => {
    window.__AVATAR_UPDATE__ && window.__AVATAR_UPDATE__();
    window.__RENDER_ONCE__ && window.__RENDER_ONCE__();
  });
  await sleep(700);
  await page.screenshot({ path: `${WORK}/diag_${hall}_${tag}.png` });
  console.log('shot', tag, JSON.stringify(await page.evaluate(() => window.__CAM_TGT__)));
}
await browser.close();
