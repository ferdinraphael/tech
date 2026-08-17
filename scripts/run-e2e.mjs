import { execFile, spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const notesPreview = process.argv.includes('--notes-preview')
const previewUrl = notesPreview
  ? 'http://127.0.0.1:4174/tech/'
  : 'http://127.0.0.1:4173/tech/'
const startupTimeoutMs = 30_000
const testTimeoutMs = 180_000
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

async function buildNotesPreview() {
  const directory = await mkdtemp(join(tmpdir(), 'tech-notes-preview-'))
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
    await waitForChild(child, testTimeoutMs, 'Notes preview build')
    return directory
  } catch (error) {
    await rm(directory, { recursive: true, force: true })
    throw error
  }
}

async function runTests() {
  const args = ['node_modules/@playwright/test/cli.js', 'test']
  if (notesPreview) args.push('tests/e2e/notes-dev.spec.ts')
  const child = startNode(args, {
    ...process.env,
    NOTES_DEV_PREVIEW: notesPreview ? '1' : '0',
    PLAYWRIGHT_BASE_URL: previewUrl,
    PLAYWRIGHT_EXECUTABLE_PATH: localBrowserExecutable(),
  })
  await waitForChild(child, testTimeoutMs, 'Playwright')
}

let preview
let notesPreviewDirectory
try {
  notesPreviewDirectory = notesPreview ? await buildNotesPreview() : undefined
  preview = startNode(
    [
      'node_modules/vite/bin/vite.js',
      'preview',
      '--configLoader',
      'runner',
      '--host',
      '127.0.0.1',
      ...(notesPreview
        ? ['--port', '4174', '--strictPort', '--outDir', notesPreviewDirectory]
        : []),
    ],
  )
  await waitForPreview(preview)
  await runTests()
} finally {
  await terminateTree(preview)
  if (notesPreviewDirectory) {
    await rm(notesPreviewDirectory, { recursive: true, force: true })
  }
}
