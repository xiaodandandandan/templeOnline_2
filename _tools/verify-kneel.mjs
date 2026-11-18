// 验收：仪轨已移除、只剩跪拜；Q 版人物定妆照 + 跪拜动作全过程
import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'http://127.0.0.1:4173'
const OUT = 'C:/Users/jadezhang/WorkBuddy/2026-11-14-13-41-28/jingshan-worship'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: 420000,
  args: [
    '--no-sandbox',
    '--disable-gpu-sandbox',
    '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--hide-scrollbars',
  ],
})
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 180))
})
await page.setViewport({ width: 1500, height: 940, deviceScaleFactor: 1 })
await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 120000 })
await page.waitForFunction(() => !!document.querySelector('.status.on'), { timeout: 120000 })
await sleep(1800)

const frame = page.frames().find((f) => f.url().includes('/temple/index.html'))
const runtime = frame
  ? await frame.evaluate(() => ({
      bridge: window.__TEMPLE_BRIDGE_READY__ === true,
      stats: window.__MODEL_STATS__,
      hasHook: typeof window.__AVATAR_UPDATE__ === 'function',
    }))
  : null
console.log('RUNTIME', JSON.stringify(runtime))

const layout = await page.evaluate(() => ({
  nav: [...document.querySelectorAll('.nav a')].map((a) => a.textContent.trim()),
  ritualEntry: document.body.innerText.includes('进入仪轨'),
  ritualWord: document.body.innerText.includes('礼佛仪轨'),
  kneelBtn: document.querySelector('.bottom-right .btn-primary')?.textContent.replace(/\s+/g, ' ').trim() ?? '',
  toolbar: document.querySelectorAll('.toolbar').length,
  footer: document.querySelectorAll('.footer').length,
  hudButtons: [...document.querySelectorAll('.bottom-right button')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()),
}))
console.log('LAYOUT', JSON.stringify(layout))
await page.screenshot({ path: path.join(OUT, 'app-q-avatar.png') })

// 收集桥事件，确认 interaction.kind = kneel
await page.evaluate(() => {
  window.__EVT__ = []
  window.addEventListener('message', (e) => {
    const d = e.data
    if (d && d.__channel === 'JINGSHAN_TEMPLE') window.__EVT__.push(d.payload)
  })
})

// 前进到天王殿前
const up = await page.$('.key.up')
const box = await up.boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down()
await sleep(1600)
await page.mouse.up()
await sleep(500)
const near = await page.$eval('.bottom-right', (el) => el.textContent.replace(/\s+/g, ' ').trim())
console.log('NEAR', JSON.stringify({ near }))

// 按钮路径：验证事件与 toast（立即读取，避免截图耗时让提示过期）
const kneelBtn = await page.$('.bottom-right .btn-primary')
if (kneelBtn) {
  await kneelBtn.click()
  await page.waitForFunction(
    () => (window.__EVT__ || []).some((p) => p.evt === 'interaction'),
    { timeout: 10000 },
  )
  await sleep(220)
  const toasts = await page.evaluate(() =>
    [...document.querySelectorAll('.toast')].map((el) => el.textContent.trim()),
  )
  console.log('KNEEL TOASTS', JSON.stringify(toasts))
}

// 姿态验收：直接下发命令（避开 click 在慢速 WebGL 下的耗时），逐帧读进度
if (frame) {
  await frame.evaluate(() => {
    window.postMessage(
      { __channel: 'JINGSHAN_TEMPLE', version: 2, kind: 'cmd', payload: { cmd: 'interact', hallId: 'tianwang' } },
      '*',
    )
  })
  const trace = []
  let pose = null
  for (let i = 0; i < 60; i++) {
    pose = await frame.evaluate(() => ({
      p: +window.__KNEEL_P__.toFixed(3),
      bodyX: +window.__AVATAR__.children[0].rotation.x.toFixed(3),
      bodyY: +window.__AVATAR__.children[0].position.y.toFixed(3),
      lowerY: +window.__AVATAR__.children[1].position.y.toFixed(3),
    }))
    trace.push(pose.p)
    if (pose.p > 0.34 && pose.p < 0.86) break
    await sleep(45)
  }
  console.log('POSE TRACE', JSON.stringify(trace.slice(0, 14)), 'samples', trace.length)
  console.log('KNEEL POSE', JSON.stringify(pose))
  await page.screenshot({ path: path.join(OUT, 'app-kneel.png') })
  for (let i = 0; i < 60; i++) {
    const p = await frame.evaluate(() => window.__KNEEL_P__)
    if (p >= 0.99) break
    await sleep(70)
  }
  await page.screenshot({ path: path.join(OUT, 'app-kneel-done.png') })
}

const interaction = await page.evaluate(() =>
  (window.__EVT__ || []).filter((p) => p.evt === 'interaction').map((p) => ({ hallId: p.hallId, kind: p.kind })),
)
console.log('INTERACTION', JSON.stringify(interaction))

// 人物定妆照：切到人物正面机位（无 UI 入口的检视命令）
if (frame) {
  await frame.evaluate(() => {
    window.postMessage(
      {
        __channel: 'JINGSHAN_TEMPLE',
        version: 2,
        kind: 'cmd',
        payload: { cmd: 'previewAvatar' },
      },
      '*',
    )
  })
  await sleep(900)
  await page.screenshot({ path: path.join(OUT, 'app-avatar-portrait.png') })
}

// 旧仪轨路由必须回到漫游页
await page.goto(BASE + '/worship/tianwang', { waitUntil: 'networkidle2', timeout: 90000 })
await sleep(600)
const redirect = await page.evaluate(() => ({ path: location.pathname, stage: !!document.querySelector('.stage') }))
console.log('REDIRECT', JSON.stringify(redirect))

await page.goto(BASE + '/about', { waitUntil: 'networkidle2', timeout: 90000 })
await sleep(400)
await page.screenshot({ path: path.join(OUT, 'app-about.png'), fullPage: true })
console.log('ABOUT', JSON.stringify({ title: await page.$eval('.head h1', (el) => el.textContent.trim()) }))
console.log('JS ERRORS', errors.length ? JSON.stringify(errors.slice(0, 8)) : 'none')
await browser.close()
