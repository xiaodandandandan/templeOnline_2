# 徑山萬壽禪寺 · 線上漫游

第三人稱漫游 + 跪拜交互的線上寺院。宿主是 Vue 3 + TypeScript，3D 场景是单文件 three.js，
通过 `iframe` + `postMessage` 与宿主隔离——Vue 只管业务状态与 UI，three.js 只管渲染、人物与碰撞。

## 目录

```
_baseline/            原始单文件 three.js 场景（合成的基线，勿改）
jingshan-temple/      3D 工程：建模源码 + 合成脚本 + 场景产物 / GLB / 预览图
jingshan-worship/     Vue 宿主应用
_tools/               Puppeteer 渲染与端到端验收脚本
```

## 本地运行

需要 Node.js ≥ 20；仅重建 3D 场景时需要 Python 3.9+。

```bash
cd jingshan-worship
npm install
npm run dev            # 自动 sync:temple 后启动 Vite
```

生产构建：

```bash
cd jingshan-worship
npm run build          # sync:temple + vue-tsc --noEmit + vite build
npm run preview
```

## 构建链

```
_baseline/*.html ─┐
extension.js ─────┴─ build.py ─→ jingshan-temple/index.html
                                  │
hall.ts（殿宇包围盒）─┐           │
bridge-runtime.js ────┴─ sync-temple.mjs ─→ public/temple/index.html ─→ dist/temple/
```

改动建模代码后按顺序执行：

```bash
cd jingshan-temple && python build.py
cd ../jingshan-worship && npm run sync:temple && npm run build
```

`public/temple/` 与 `dist/` 是生成物，不入库，由上面两条命令重建。
`temple.glb`（约 22 MB）同样不入库，需要时用 `node _tools/render.mjs` 从场景重新导出。

## 3D 工程

- `jingshan-temple/extension.js`：建模唯一真源。`AXIS` 中轴五殿（等距 44）、`SONG` 两层楼阁标高、
  `buildInterior()` 室内碰撞/剖视/锚点/蒲团席位、`SITE_PLAN` 导览点、GLB 导出。
- `jingshan-temple/build.py`：在基线上做精确替换（标题、匾额、雾、阴影、机位、说明面板），
  再把 `extension.js` 注入 `__TEMPLE_READY__` 之前，合成单文件场景。
- `jingshan-worship/scripts/bridge-runtime.js`：iframe 内的运行时——方块人物、第三人称相机、
  移动/拖拽/滚轮、踏地与碰撞、入殿剖视、蒲团吸附跪拜、导览点投影。

## 校验

```bash
cd jingshan-worship
npm run typecheck && npm run lint && npm test
node ../_tools/check-scene.mjs        # 场景加载与几何注册
node ../_tools/verify-avatar.mjs      # 漫游 / 跪拜 / 缩放
```

本机无独显时 Puppeteer 需加 `--enable-unsafe-swiftshader`；页面等待用 `domcontentloaded`，
`networkidle2` 在单文件场景下会超时。
