import { build } from 'esbuild'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// A single engine instance backs the scene, controls, exporter and GLB loader.
await build({
  stdin: {
    contents: `
      export * as THREE from 'three';
      export { OrbitControls } from 'three/addons/controls/OrbitControls.js';
      export { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
      export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    `,
    resolveDir: root,
    sourcefile: 'three-runtime-entry.js',
  },
  outfile: resolve(root, '../jingshan-temple/vendor/three-runtime.js'),
  bundle: true,
  format: 'iife',
  globalName: 'TempleThree',
  platform: 'browser',
  target: 'es2022',
  footer: { js: 'const { THREE, OrbitControls, GLTFExporter, GLTFLoader } = TempleThree;' },
})
