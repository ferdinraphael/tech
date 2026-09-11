import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'

// Test-only ordinary directory serving. Missing files return 404, never index.html.
export async function startStaticFileServer(directory) {
  const root = resolve(directory)
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.xml': 'application/xml' }
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost')
      const pathname = decodeURIComponent(url.pathname)
      const file = resolve(root, pathname.slice('/tech/'.length))
      if (!pathname.startsWith('/tech/') || (file !== root && !file.startsWith(root + sep))) {
        response.writeHead(404).end()
        return
      }
      const info = await stat(file)
      if (info.isDirectory() && !pathname.endsWith('/')) {
        response.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end()
        return
      }
      const target = info.isDirectory() ? join(file, 'index.html') : file
      const body = await readFile(target)
      response.writeHead(200, { 'Content-Type': types[extname(target)] ?? 'application/octet-stream' }).end(body)
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500).end()
    }
  })
  await new Promise((resolveListening, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolveListening)
  })
  return {
    url: `http://127.0.0.1:${server.address().port}/tech/`,
    close: () => new Promise((resolveClosed, reject) => {
      server.close((error) => error ? reject(error) : resolveClosed())
      server.closeAllConnections()
    }),
  }
}
