import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import type { Plugin, ResolvedConfig } from 'vite'
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const loadBuildModule = createRequire(import.meta.url)

function githubPagesEntryShells(): Plugin {
  let outputDirectory = resolve('dist')
  let root = resolve('.')
  return {
    name: 'github-pages-entry-shells',
    apply: 'build',
    configResolved(config: ResolvedConfig) {
      root = config.root
      outputDirectory = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      // Load with Node 24 only during builds. Vite's config runner is already
      // closed here, and dev/preview startup should not load the HTML parser.
      const { generateRouteShells } = loadBuildModule('./scripts/route-shells.mjs') as typeof import('./scripts/route-shells.mjs')
      generateRouteShells(root, outputDirectory)
    },
  }
}

export default defineConfig({
  base: '/tech/',
  plugins: [react(), githubPagesEntryShells()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
})
