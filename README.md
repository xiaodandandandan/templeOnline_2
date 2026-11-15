# 徑山萬壽禪寺 · 線上漫游

第三人稱漫游 + 跪拜交互的線上寺院。宿主是 Vue 3 + TypeScript，3D 场景是单文件 three.js，
通过 `iframe` + `postMessage` 与宿主隔离——Vue 只管业务状态与 UI，three.js 只管渲染、人物与碰撞。

## 目录

```
jingshan-temple/      3D 工程：vendor（三方库）/ src（自研源码）/ 合成脚本 / 产物
jingshan-worship/     Vue 宿主应用
_tools/               Puppeteer 渲染与端到端验收脚本
_baseline/            拆分前的单文件基线，本地留底，不入库
```

## 源码与产物的分工

`jingshan-temple/index.html` 是**构建产物**，不入库：它把 three.js 全部内联进 `<script type="module">`，
所以在 `file://` 下双击即可打开，无需服务器。源码按职责拆开维护：

| 目录 | 内容 | 是否入库 |
|---|---|---|
| `jingshan-temple/vendor/` | three.js r160、OrbitControls、GLTFExporter，原样存放不改 | 是 |
| `jingshan-temple/src/` | `page.template.html` 页面骨架、`scene.js` 基线场景、`extension.js` 建模源码 | 是 |
| `jingshan-temple/index.html` | 上述全部内联合成，约 1.5 MB | 否，`python build.py` 生成 |

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
jingshan-temple/
  vendor/three.module.js ──┐
  vendor/three-*.js        │
  vendor/OrbitControls.js  ├── build.py ──→ index.html（内联单文件，不入库）
  vendor/GLTFExporter.js   │                      │
  src/page.template.html   │                      │
  src/scene.js             │                      │
  src/extension.js ────────┘                      │
                                                  ▼
hall.ts（殿宇包围盒）─┐                    sync-temple.mjs
bridge-runtime.js ────┴─────────────────────────→ public/temple/ → dist/
```

改动建模代码后按顺序执行：

```bash
cd jingshan-temple && python build.py
cd ../jingshan-worship && npm run sync:temple && npm run build
```

`index.html`、`public/temple/` 与 `dist/` 都是生成物，不入库，由上面两条命令重建。
`temple.glb`（约 22 MB）同样不入库，需要时用 `node _tools/render.mjs` 从场景重新导出。

## 3D 工程

- `jingshan-temple/src/extension.js`：建模唯一真源。`AXIS` 中轴五殿（等距 44）、`SONG` 两层楼阁标高、
  `buildInterior()` 室内碰撞/剖视/锚点/蒲团席位、`SITE_PLAN` 导览点、GLB 导出。
- `jingshan-temple/src/scene.js`：基线场景（山门殿、地形、石阶、材质、相机与视角表），build.py 在此之上做参数替换。
- `jingshan-temple/vendor/`：第三方库原样存放，不修改。放在 `vendor/` 下可被 Git 语言统计自动忽略。
- `jingshan-temple/build.py`：对模板与场景做精确替换（标题、匾额、雾、阴影、机位、说明面板），
  注入 `extension.js`，再把 vendor 与源码内联合成单文件产物。
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
