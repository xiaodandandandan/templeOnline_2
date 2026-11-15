// 第三人称人物漫游端到端验证：布局、HUD、移动、靠近殿宇、礼拜交互
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

await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForFunction(() => !!document.querySelector('.status.on'), { timeout: 120000 })
await sleep(2200)

const frame = page.frames().find((f) => f.url().includes('/temple/index.html'))
const runtime = frame
  ? await frame.evaluate(() => ({
      bridge: window.__TEMPLE_BRIDGE_READY__ === true,
      stats: window.__MODEL_STATS__,
      plaque: document.title,
      hasHook: typeof window.__AVATAR_UPDATE__ === 'function',
    }))
  : null

const layout = await page.evaluate(() => ({
  hallNav: document.querySelectorAll('.nav-panel').length,
  toolbar: document.querySelectorAll('.toolbar').length,
  footer: document.querySelectorAll('.footer').length,
  hud: document.querySelectorAll('.bottom-left .pad').length,
  marks: document.querySelectorAll('.hall-mark').length,
  pos: document.querySelector('.pos')?.textContent.trim(),
  near: document.querySelector('.bottom-right strong')?.textContent.trim() ?? '',
}))
console.log('LAYOUT', JSON.stringify(layout))
console.log('RUNTIME', JSON.stringify(runtime))
await page.screenshot({ path: path.join(OUT, 'app-avatar.png') })

// 按住「前进」1.6 秒 → 人物应沿中轴向天王殿移动
const up = await page.$('.key.up')
const box = await up.boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down()
await sleep(1600)
await page.mouse.up()
await sleep(500)
const posAfter = await page.$eval('.pos', (el) => el.textContent.trim())
const nearAfter = await page.$eval('.bottom-right', (el) => el.textContent.replace(/\s+/g, ' ').trim())
console.log('MOVE', JSON.stringify({ before: layout.pos, after: posAfter, near: nearAfter }))
await page.screenshot({ path: path.join(OUT, 'app-avatar-moved.png') })

// 靠近殿宇 → 礼拜 → toast
await page.evaluate(() => {
  window.__EVT__ = []
  window.addEventListener('message', (e) => {
    if (e.data && e.data.__channel === 'JINGSHAN_TEMPLE') {
      window.__EVT__.push(e.data.payload.evt)
    }
  })
})
const bowBtn = await page.$('.bottom-right .btn-primary')
if (bowBtn) {
  await bowBtn.click()
  await sleep(900)
  const debug = await page.evaluate(() => ({
    toasts: [...document.querySelectorAll('.toast')].map((el) => el.textContent.trim()),
    hasInteraction: (window.__EVT__ || []).includes('interaction'),
    marks: document.querySelectorAll('.hall-mark').length,
  }))
  console.log('INTERACT', JSON.stringify({
    toast: debug.toasts.find((t) => t.includes('已於')) || '',
    hasInteraction: debug.hasInteraction,
    marks: debug.marks,
  }))
  await sleep(350)
  await page.screenshot({ path: path.join(OUT, 'app-avatar-bow.png') })
} else {
  console.log('INTERACT', 'no nearby hall button')
}

// 键盘 WASD（直接向 iframe 派发，验证运行时键盘通道）
if (frame) {
  const zBefore = await page.$eval('.pos', (el) => el.textContent.trim())
  await frame.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }))
  })
  await sleep(1000)
  await frame.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', bubbles: true }))
  })
  await sleep(300)
  const zAfter = await page.$eval('.pos', (el) => el.textContent.trim())
  console.log('KEYBOARD', JSON.stringify({ zBefore, zAfter }))
}

// 回到山门 / 其余页面
await page.click('.bottom-right .reset')
await sleep(900)
const resetPos = await page.$eval('.pos', (el) => el.textContent.trim())
console.log('RESET', JSON.stringify({ resetPos }))
// 六步仪轨已移除：旧路由必须重定向回漫游页
await page.goto(BASE + '/worship/tianwang', { waitUntil: 'domcontentloaded', timeout: 90000 })
await sleep(500)
console.log('REDIRECT', JSON.stringify(await page.evaluate(() => ({ path: location.pathname, stage: !!document.querySelector('.stage') }))))
await page.goto(BASE + '/about', { waitUntil: 'domcontentloaded', timeout: 90000 })
await sleep(300)
await page.screenshot({ path: path.join(OUT, 'app-about.png'), fullPage: true })

console.log('JS ERRORS', errors.length ? JSON.stringify(errors.slice(0, 10)) : 'none')
await browser.close()
