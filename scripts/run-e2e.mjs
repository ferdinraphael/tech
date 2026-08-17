import { execFile, spawn } from 'node:child_process'
import { once } from 'node:events'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const previewUrl = 'http://127.0.0.1:4173/tech/'
const startupTimeoutMs = 30_000
const testTimeoutMs = 180_000
const cleanupTimeoutMs = 10_000

function startNode(args) {
  return spawn(process.execPath, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
  })
}

async function waitForPreview(child) {
  const deadline = Date.now() + startupTimeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Vite preview exited before becoming ready (${child.exitCode}).`)
    }
    try {
      const response = await fetch(previewUrl, { signal: AbortSignal.timeout(2_000) })
      if (response.ok) return
    } catch {
      // The preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Vite preview was not ready within ${startupTimeoutMs}ms.`)
}

async function terminateTree(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return

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

  await Promise.race([
    once(child, 'exit'),
    new Promise((resolve) => setTimeout(resolve, cleanupTimeoutMs)),
  ])
}

async function runTests() {
  const child = startNode(['node_modules/@playwright/test/cli.js', 'test'])
  let timer
  try {
    const exit = once(child, 'exit').then(([code, signal]) => ({ code, signal }))
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`Playwright exceeded ${testTimeoutMs}ms.`)),
        testTimeoutMs,
      )
    })
    const result = await Promise.race([exit, timeout])
    if (result.code !== 0) {
      throw new Error(
        `Playwright failed with ${result.code ?? `signal ${result.signal}`}.`,
      )
    }
  } finally {
    clearTimeout(timer)
    await terminateTree(child)
  }
}

const preview = startNode([
  'node_modules/vite/bin/vite.js',
  'preview',
  '--configLoader',
  'runner',
  '--host',
  '127.0.0.1',
])

try {
  await waitForPreview(preview)
  await runTests()
} finally {
  await terminateTree(preview)
}
