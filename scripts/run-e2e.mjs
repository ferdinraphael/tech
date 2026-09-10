import { execFile, fork, spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const writingsPreview = process.argv.includes('--writings-preview')
const previewPort = writingsPreview ? 4174 : 4173
const previewUrl = `http://127.0.0.1:${previewPort}/tech/`
const startupTimeoutMs = 30_000
const buildTimeoutMs = 180_000
// The production suite takes about five minutes locally. Allow variance and,
// in CI, the two retries configured in playwright.config.ts.
const testTimeoutMs = 8 * 60_000 * (process.env.CI ? 3 : 1)
const cleanupTimeoutMs = 10_000

function localBrowserExecutable() {
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_EXECUTABLE_PATH
  }
  if (process.platform !== 'win32') return undefined

  return [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ].find(existsSync)
}

function startNode(args, environment = process.env) {
  return spawn(process.execPath, args, {
    cwd: process.cwd(),
    env: environment,
    stdio: 'inherit',
    windowsHide: true,
  })
}

async function waitForPreview(child) {
  // Only this fork can announce readiness, after Vite has bound its strict port.
  // An HTTP response from an unrelated server cannot make this run ready.
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error('Vite preview startup timed out.')), startupTimeoutMs)
    function finish(error) {
      clearTimeout(timer)
      child.off('message', ready)
      child.off('error', finish)
      child.off('exit', exited)
      if (error) reject(error)
      else resolve()
    }
    function ready(message) {
      if (message?.type === 'preview-ready' && message.port === previewPort) finish()
    }
    function exited(code) {
      finish(new Error(`Vite preview exited before becoming ready (${code}); port ${previewPort} must be available.`))
    }
    child.on('message', ready)
    child.once('error', finish)
    child.once('exit', exited)
  })
  const response = await fetch(previewUrl, { signal: AbortSignal.timeout(5_000) })
  if (!response.ok || child.exitCode !== null || child.signalCode !== null) {
    throw new Error(`This run's Vite preview is not serving ${previewUrl} (${response.status}).`)
  }
}

async function terminateTree(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return

  const exited = once(child, 'exit')
  if (process.platform === 'win32') {
    try {
      await execFileAsync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        timeout: cleanupTimeoutMs,
      })
    } catch {
      child.kill()
    }
  } else {
    child.kill('SIGTERM')
  }

  let timer
  try {
    await Promise.race([
      exited,
      new Promise((resolve) => { timer = setTimeout(resolve, cleanupTimeoutMs) }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

async function waitForChild(child, timeoutMs, label) {
  let timer
  try {
    const exit = once(child, 'exit').then(([code, signal]) => ({ code, signal }))
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`${label} exceeded ${timeoutMs}ms.`)),
        timeoutMs,
      )
    })
    const result = await Promise.race([exit, timeout])
    if (result.code !== 0) {
      throw new Error(`${label} failed with ${result.code ?? `signal ${result.signal}`}.`)
    }
  } finally {
    clearTimeout(timer)
    await terminateTree(child)
  }
}

async function buildWritingsPreview() {
  const directory = await mkdtemp(join(tmpdir(), 'tech-writings-preview-'))
  const child = startNode(
    [
      'node_modules/vite/bin/vite.js',
      'build',
      '--configLoader',
      'runner',
      '--mode',
      'development',
      '--outDir',
      directory,
      '--emptyOutDir',
    ],
    { ...process.env, VITE_INCLUDE_DRAFTS: 'true' },
  )
  try {
    await waitForChild(child, buildTimeoutMs, 'Writings preview build')
    return directory
  } catch (error) {
    await rm(directory, { recursive: true, force: true })
    throw error
  }
}

async function runTests() {
  const args = ['node_modules/@playwright/test/cli.js', 'test']
  if (writingsPreview) args.push('tests/e2e/writings-dev.spec.ts')
  const child = startNode(args, {
    ...process.env,
    WRITINGS_DEV_PREVIEW: writingsPreview ? '1' : '0',
    PLAYWRIGHT_BASE_URL: previewUrl,
    PLAYWRIGHT_EXECUTABLE_PATH: localBrowserExecutable(),
  })
  await waitForChild(child, testTimeoutMs, 'Playwright')
}

if (process.argv[2] === '--serve-preview') {
  const { preview } = await import('vite')
  const port = Number(process.argv[3])
  const server = await preview({
    configLoader: 'runner',
    preview: { host: '127.0.0.1', port, strictPort: true },
    ...(process.argv[4] ? { build: { outDir: process.argv[4] } } : {}),
  })
  server.printUrls()
  process.send({ type: 'preview-ready', port })
} else {
  let preview
  let writingsPreviewDirectory
  try {
    writingsPreviewDirectory = writingsPreview ? await buildWritingsPreview() : undefined
    preview = fork(fileURLToPath(import.meta.url), [
      '--serve-preview', String(previewPort),
      ...(writingsPreviewDirectory ? [writingsPreviewDirectory] : []),
    ], { cwd: process.cwd(), stdio: ['ignore', 'inherit', 'inherit', 'ipc'], windowsHide: true })
    await waitForPreview(preview)
    await runTests()
  } finally {
    await terminateTree(preview)
    if (writingsPreviewDirectory) {
      await rm(writingsPreviewDirectory, { recursive: true, force: true })
    }
  }
}
