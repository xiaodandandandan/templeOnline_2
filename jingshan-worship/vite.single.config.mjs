import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/** 单文件分发专用：把整个 Vue 宿主打成一个 IIFE（含 vue/router/pinia），
 *  不拆 chunk、不单独输出 CSS 文件引用，便于 pack.mjs 内联进一个 html。 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  /* lib 模式不会像 app 构建那样自动注入这些常量，Vue 内部会走到
   * `process.env.NODE_ENV` 分支 → 单文件里报 "process is not defined" 白屏。 */
  define: {
    'process.env.NODE_ENV': '"production"',
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  },
  build: {
    target: 'es2022',
    outDir: '/tmp/single-dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: false,
    minify: 'esbuild',
    lib: {
      entry: fileURLToPath(new URL('./src/app/main.ts', import.meta.url)),
      formats: ['iife'],
      name: 'TempleApp',
      fileName: () => 'app.js',
    },
    rollupOptions: {
      output: { inlineDynamicImports: true, assetFileNames: 'app.[ext]' },
    },
  },
})
