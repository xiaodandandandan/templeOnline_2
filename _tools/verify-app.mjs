// 端到端验证：Vue 宿主 ↔ 3D iframe 桥接、仪式状态机、祈愿提交、各页面渲染
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

// 1. 导览页 + 桥接 ready
await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 120000 })
await page.waitForFunction(() => !!document.querySelector('.status.on'), { timeout: 120000 })
await sleep(2500)

const runtimeFrame = page.frames().find((f) => f.url().includes('/temple/index.html'))
const bridgeReady = runtimeFrame
  ? await runtimeFrame.evaluate(() => window.__TEMPLE_BRIDGE_READY__ === true)
  : false
const runtimeStats = runtimeFrame
  ? await runtimeFrame.evaluate(() => window.__MODEL_STATS__)
  : null
const anchorCount = await page.$$eval('.anchor', (els) => els.length)
const statusText = await page.$eval('.status', (el) => el.textContent.trim())
console.log('GUIDE', JSON.stringify({ bridgeReady, runtimeStats, anchorCount, statusText }))
await page.screenshot({ path: path.join(OUT, 'app-guide.png') })

// 2. 点殿名 → 聚焦 → 右侧卡片联动
if (anchorCount > 0) {
  const before = await page.$eval('.hall-card h2', (el) => el.textContent.trim())
  const firstAnchor = (await page.$$('.anchor'))[0]
  await firstAnchor.click()
  await sleep(1600)
  const after = await page.$eval('.hall-card h2', (el) => el.textContent.trim())
  console.log('PICK', JSON.stringify({ before, after, changed: before !== after }))
  await page.screenshot({ path: path.join(OUT, 'app-picked.png') })
}

// 3. 仪式状态机：开始 → 完成一步 → 礼成 → 保存记录
await page.goto(BASE + '/worship/shijia', { waitUntil: 'networkidle2', timeout: 90000 })
await page.waitForSelector('.idle .btn')
await page.click('.idle .btn')
await page.click('.controls .btn-primary')
await sleep(300)
const step2 = await page.$eval('.step-head h2', (el) => el.textContent.trim())
const progress = await page.$eval('.box-head b', (el) => el.textContent.trim())
console.log('RITUAL', JSON.stringify({ step2, progress }))
await page.screenshot({ path: path.join(OUT, 'app-worship.png') })

for (let i = 0; i < 6; i++) {
  const btn = await page.$('.controls .btn-primary')
  if (!btn) break
  await btn.click()
  await sleep(120)
}
const doneEl = await page.$('.done')
if (doneEl) {
  await page.click('.record .btn-primary')
  await sleep(900)
  const saved = await page.$eval('.record .btn-primary', (el) => el.textContent.trim())
  console.log('RECORD', JSON.stringify({ saved }))
  await page.screenshot({ path: path.join(OUT, 'app-done.png') })
}

// 4. 祈愿墙：提交一条（审核态）
await page.goto(BASE + '/wish', { waitUntil: 'networkidle2', timeout: 90000 })
await page.waitForSelector('.form textarea')
const cardsBefore = await page.$$eval('.list .card', (els) => els.length)
await page.type('.form textarea', '愿架构清晰，构件归位。')
await page.click('.form .btn-primary')
await sleep(900)
const cardsAfter = await page.$$eval('.list .card', (els) => els.length)
const pendingCount = await page.$$eval('.list .card.pending', (els) => els.length)
console.log('WISH', JSON.stringify({ cardsBefore, cardsAfter, pendingCount }))
await page.screenshot({ path: path.join(OUT, 'app-wish.png') })

// 5. 记录页 / 架构页
await page.goto(BASE + '/merit', { waitUntil: 'networkidle2', timeout: 90000 })
await sleep(500)
const rows = await page.$$eval('.tr', (els) => els.length)
console.log('MERIT', JSON.stringify({ rows }))
await page.goto(BASE + '/about', { waitUntil: 'networkidle2', timeout: 90000 })
await sleep(300)
await page.screenshot({ path: path.join(OUT, 'app-about.png'), fullPage: true })

console.log('JS ERRORS', errors.length ? JSON.stringify(errors.slice(0, 10)) : 'none')
await browser.close()
