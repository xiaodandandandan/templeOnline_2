// 验证鼠标拖拽转向方向：右拖 yaw 增大（右转），左拖 yaw 减小（左转）
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

// 收集运行时回传的 avatar 状态，取最新 yaw
await page.evaluate(() => {
  window.__YAW__ = 0
  window.__AVATAR_MSGS__ = 0
  window.addEventListener('message', (e) => {
    const d = e.data
    if (d && d.__channel === 'JINGSHAN_TEMPLE' && d.payload?.evt === 'avatar') {
      window.__YAW__ = d.payload.yaw
      window.__AVATAR_MSGS__ += 1
    }
  })
})
await sleep(400)
const yaw = () => page.evaluate(() => window.__YAW__)
const drag = async (fromX, toX) => {
  const y = 430
  await page.mouse.move(fromX, y)
  await page.mouse.down()
  const steps = 10
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(fromX + ((toX - fromX) * i) / steps, y)
    await sleep(24)
  }
  await page.mouse.up()
  await sleep(600)
  return yaw()
}

const y0 = await yaw()
const yRight = await drag(700, 900) // 右拖 200px
await page.screenshot({ path: path.join(OUT, 'app-drag-right.png') })
const yLeft = await drag(900, 700) // 左拖 200px
const yLeft2 = await drag(700, 520) // 再左拖 180px

console.log('DRAG', JSON.stringify({
  initial: y0,
  afterRightDrag: yRight,
  afterLeftDrag: yLeft,
  afterSecondLeftDrag: yLeft2,
  rightIsRight: yRight > y0 + 0.2,
  leftIsLeft: yLeft < yRight - 0.2 && yLeft2 < yLeft - 0.2,
}))
console.log('JS ERRORS', errors.length ? JSON.stringify(errors.slice(0, 6)) : 'none')
await browser.close()
