import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

function githubPagesFallback(): Plugin {
  let outputDirectory = resolve('dist')
  return {
    name: 'github-pages-spa-fallback',
    configResolved(config: ResolvedConfig) {
      outputDirectory = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(resolve(outputDirectory, 'index.html'), resolve(outputDirectory, '404.html'))
    },
  }
}

export default defineConfig({
  base: '/tech/',
  plugins: [react(), githubPagesFallback()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
})
