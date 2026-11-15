import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox','--disable-gpu-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader'] })
const p = await b.newPage()
p.on('response', r => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()) })
await p.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle2', timeout: 120000 })
await new Promise(r => setTimeout(r, 2500))
await b.close()
