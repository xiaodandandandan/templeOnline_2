# 径山万寿禅寺 · 线上漫游

第三人称漫游 + 跪拜交互的线上寺院。宿主是 Vue 3 + TypeScript，3D 场景是单文件 three.js，
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

手机同 WiFi 访问：把 `npm run dev` 换成 `npm run dev -- --host 0.0.0.0`，
手机浏览器打开 `http://<电脑局域网IP>:5173`。

### 移动端适配

- **手势**：场景区单指转向、双指捏合缩放（等同滚轮）；HUD 覆盖层上的双指手势也会转发给 3D 运行时。
- **性能**：移动端把渲染像素比上限降到 1.5（桌面仍为 2），避免高分屏 GPU 填充率过载掉帧。
- **上下文丢失**：手机切后台 / 内存回收导致 WebGL 上下文丢失时，自动切到静态俯瞰兜底图；
  恢复后自动回到 3D。兜底图 `jingshan-temple/preview_top.png` 必须入库，`sync:temple`
  会把它复制为 `public/temple/fallback.png`。
- **视口**：`index.html` 设 `user-scalable=no` + `viewport-fit=cover`，防止误缩放并适配刘海屏。

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
- **Building 建筑对象**（`extension.js` 的 `H1c` 段）：每座殿宇封装为 `Building` 实例，集中注册到
  `window.__BUILDINGS__`（`Map<id, Building>`，`window.__BUILDING__('shijia')` 便捷读取）。实例携带
  `group` / `spec` / `bounds` / `anchors` / `parts`（屋顶·天花·前墙剖视组）等属性，并提供
  `addFeature(key, factory)` / `getFeature(key)` 扩展插槽——后期新增交互、动画、佛像/陈设建模
  直接挂到对应建筑实例即可，无需全局遍历。室内尺寸的放大改各殿 `spec`（`AXIS.halls` / `LINGXIAO` /
  山门殿 `W,H`）与 `hall.ts` 的 `box` 两处，保持视觉几何与碰撞盒单一真源一致。
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
