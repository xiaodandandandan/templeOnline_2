// 验收：删除工程架构 / 滚轮缩放全寺俯瞰 / 殿宇室内剖视与前后券门贯通
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
    '--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--hide-scrollbars',
  ],
})
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 180)) })
await page.setViewport({ width: 1500, height: 940, deviceScaleFactor: 1 })

await page.evaluateOnNewDocument(() => {
  window.__EVT__ = []
  window.addEventListener('message', (e) => {
    if (e.data && e.data.__channel === 'JINGSHAN_TEMPLE') window.__EVT__.push(e.data.payload.evt)
  })
})
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForFunction(() => !!document.querySelector('.status.on'), { timeout: 120000 })
await sleep(2200)

const frame = page.frames().find((f) => f.url().includes('/temple/index.html'))
const boot = await page.evaluate(() => ({
  aboutLinks: document.querySelectorAll('a[href="/about"]').length,
  aboutText: (document.body.innerText.match(/工程架構/g) || []).length,
  zoomPanel: !!document.querySelector('.top-right'),
  marks: document.querySelectorAll('.hall-mark').length,
  pos: document.querySelector('.pos')?.textContent.trim(),
  events: [...new Set(window.__EVT__ || [])],
}))
const reg = frame ? await frame.evaluate(() => {
  const R = window.__INTERIOR__ || {}
  return {
    boxes: (R.boxes || []).length,
    roofs: Object.keys(R.roofs || {}).length,
    anchors: (R.anchors || []).length,
    kinds: [...new Set((R.anchors || []).map((a) => a.kind))],
    zoom: window.__ZOOM_DIST__,
    cutaway: window.__CUTAWAY_ID__,
    bridge: window.__TEMPLE_BRIDGE_READY__ === true,
  }
}) : null
console.log('BOOT', JSON.stringify(boot))
console.log('REGISTRY', JSON.stringify(reg))
await page.screenshot({ path: path.join(OUT, 'app-zoom-close.png') })

// ---- 滚轮拉远：连续向下滚 → 全寺俯瞰 ----
await page.mouse.move(750, 520)
for (let i = 0; i < 12; i++) {
  await page.mouse.wheel({ deltaY: 300 })
  await sleep(90)
}
await sleep(1800)
const far = {
  ui: await page.$eval('.zoom-row', (el) => el.textContent.replace(/\s+/g, ' ').trim()),
  marks: await page.evaluate(() => document.querySelectorAll('.hall-mark').length),
  dist: frame ? await frame.evaluate(() => window.__ZOOM_DIST__) : null,
  overview: await page.evaluate(() => !!document.querySelector('.hall-mark')),
}
console.log('WHEEL FAR', JSON.stringify(far))
await page.screenshot({ path: path.join(OUT, 'app-zoom-overview.png') })

// ---- 一键回到人物 ----
await page.click('.zoom-btn')
await sleep(1600)
const back = {
  ui: await page.$eval('.zoom-row', (el) => el.textContent.replace(/\s+/g, ' ').trim()),
  dist: frame ? await frame.evaluate(() => window.__ZOOM_DIST__) : null,
}
console.log('ZOOM BACK', JSON.stringify(back))

// ---- 走进天王殿：Shift + W 加速穿过中央券门 ----
if (frame) {
  await frame.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft', bubbles: true }))
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }))
  })
  // 无头软件渲染帧率不稳：按位置轮询而不是固定 sleep
  for (let i = 0; i < 30; i++) {
    await sleep(400)
    if (await frame.evaluate(() => window.__AVATAR__.position.z < -1.0)) break
  }
  await frame.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', bubbles: true }))
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft', bubbles: true }))
  })
  await sleep(700)
  const inside = await frame.evaluate(() => {
    const R = window.__INTERIOR__ || {}
    return {
      z: +window.__AVATAR__.position.z.toFixed(2),
      y: +window.__AVATAR__.position.y.toFixed(2),
      cutaway: window.__CUTAWAY_ID__,
      tianwangRoof: R.roofs ? R.roofs['tianwang'].visible : null,
      otherRoofsVisible: R.roofs
        ? Object.keys(R.roofs).filter((k) => k !== 'tianwang').every((k) => R.roofs[k].visible)
        : null,
    }
  })
  const hud = await page.evaluate(() => ({
    pos: document.querySelector('.pos')?.textContent.trim(),
    insideTag: !!document.querySelector('.pos .inside'),
  }))
  console.log('INSIDE HALL', JSON.stringify({ ...inside, ...hud }))
  await page.screenshot({ path: path.join(OUT, 'app-interior.png') })

  // ---- 继续前进：从后券门穿出，剖视自动复原 ----
  await frame.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft', bubbles: true }))
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }))
  })
  for (let i = 0; i < 25; i++) {
    await sleep(400)
    if (await frame.evaluate(() => window.__AVATAR__.position.z < -12)) break
  }
  await frame.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', bubbles: true }))
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft', bubbles: true }))
  })
  await sleep(500)
  const outside = await frame.evaluate(() => {
    const R = window.__INTERIOR__ || {}
    return {
      z: +window.__AVATAR__.position.z.toFixed(2),
      cutaway: window.__CUTAWAY_ID__,
      tianwangRoof: R.roofs ? R.roofs['tianwang'].visible : null,
    }
  })
  console.log('EXIT HALL', JSON.stringify(outside))
}

// ---- 跪拜交互回归：回到天王殿前再触发 ----
await page.click('.bottom-right .reset')
await sleep(900)
const kneelBtn = await page.$('.bottom-right .btn-primary')
if (kneelBtn) {
  await kneelBtn.click()
  await sleep(400)
  console.log('KNEEL', JSON.stringify({
    toast: await page.$eval('.toast', (el) => el.textContent.trim()).catch(() => ''),
  }))
} else {
  console.log('KNEEL', JSON.stringify({ toast: '', note: 'no nearby hall' }))
}

// ---- 工程架构页已删除，旧地址回落 ----
await page.goto(BASE + '/about', { waitUntil: 'domcontentloaded', timeout: 90000 })
await sleep(400)
console.log('ABOUT REDIRECT', JSON.stringify(await page.evaluate(() => ({
  path: location.pathname,
  stage: !!document.querySelector('.stage'),
  aboutText: (document.body.innerText.match(/工程架構/g) || []).length,
}))))

console.log('JS ERRORS', errors.length ? JSON.stringify(errors.slice(0, 10)) : 'none')
await browser.close()
