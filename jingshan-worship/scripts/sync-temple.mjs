/**
 * 把既有单文件 three.js 场景同步为 3D 运行时。
 * 单一真源：../jingshan-temple/index.html（场景）+ src/domain/hall.ts（殿宇几何）
 * 产物：public/temple/{index.html, temple.glb, fallback.png}
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const SCENE = resolve(ROOT, '../jingshan-temple')
const OUT = resolve(ROOT, 'public/temple')

const fail = (msg) => {
  console.error('[sync:temple] ' + msg)
  process.exit(1)
}

/* 1. 从领域模型提取殿宇包围盒，避免运行时手写第二份坐标 */
const hallSource = readFileSync(resolve(ROOT, 'src/domain/hall.ts'), 'utf8')
const halls = []
const entry = /id:\s*'([a-z]+)',[\s\S]*?box:\s*\{([^}]*)\}/g
for (const m of hallSource.matchAll(entry)) {
  const box = {}
  for (const kv of m[2].split(',')) {
    const [k, v] = kv.split(':').map((s) => s && s.trim())
    if (k && v !== undefined && v !== '') box[k] = Number(v)
  }
  if (['x', 'z', 'baseY', 'width', 'depth', 'height'].some((k) => !Number.isFinite(box[k]))) {
    fail(`殿宇 ${m[1]} 的包围盒解析失败`)
  }
  halls.push({ id: m[1], ...box })
}
if (halls.length !== 7) fail(`殿宇数量应为 7（5 中轴 + 2 台上配殿），实际 ${halls.length}`)

/* 2. 读取场景与桥接运行时模板 */
const scenePath = resolve(SCENE, 'index.html')
if (!existsSync(scenePath)) {
  // 分发包里已带生成好的运行时，允许脱离原始 3D 工程独立启动
  if (existsSync(resolve(OUT, 'index.html'))) {
    console.log('[sync:temple] 源場景缺失，沿用已生成的 public/temple/index.html')
    process.exit(0)
  }
  fail(`未找到场景文件 ${scenePath}`)
}
let html = readFileSync(scenePath, 'utf8')
const runtime = readFileSync(resolve(HERE, 'bridge-runtime.js'), 'utf8').replace(
  '/*__HALLS__*/ []',
  JSON.stringify(halls),
)

/* 3. 去掉资料库注入脚本（本地无此路径，避免 404 噪声） */
html = html.replace(/<script[^>]*src="\/page\/page_comm\/inject\.js"[^>]*><\/script>\s*/g, '')

/* 4. 注入桥接到 bootstrap() 内部：必须紧随 __TEMPLE_READY__ 之后 */
const anchor = "window.__TEMPLE_READY__ = true;"
const count = html.split(anchor).length - 1
if (count !== 1) fail(`注入锚点不唯一（${count} 处）`)
html = html.replace(anchor, anchor + '\n/* ---- 3D 运行时桥（自动生成，勿手改） ---- */\n' + runtime)

/* 5. 写出运行时与静态资产 */
mkdirSync(OUT, { recursive: true })
writeFileSync(resolve(OUT, 'index.html'), html, 'utf8')
for (const [src, dest] of [
  ['temple.glb', 'temple.glb'],
  ['preview_top.png', 'fallback.png'],
]) {
  const p = resolve(SCENE, src)
  if (existsSync(p)) copyFileSync(p, resolve(OUT, dest))
}

console.log(
  `[sync:temple] OK → public/temple/index.html (${(html.length / 1024 / 1024).toFixed(2)} MB), ` +
    `halls=${halls.length}, glb=${existsSync(resolve(SCENE, 'temple.glb'))}`,
)
