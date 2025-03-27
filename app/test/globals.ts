import 'fake-indexeddb/auto'
import jsdom from 'global-jsdom'

jsdom(undefined, {
  url: 'http://localhost',
})

import { join } from 'path'
import { readFileSync } from 'fs'

// These constants are defined by Webpack at build time, but since tests aren't
// built with Webpack we need to make sure these exist at runtime.
const g: any = globalThis
g['__WIN32__'] = process.platform === 'win32'
g['__DARWIN__'] = process.platform === 'darwin'
g['__LINUX__'] = process.platform === 'linux'
g['__APP_VERSION__'] = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf8')
).version
g['__DEV__'] = 'false'
g['__RELEASE_CHANNEL__'] = 'development'
g['__UPDATES_URL__'] = ''
g['__SHA__'] = 'test'

g['log'] = {
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
} as IDesktopLogger

g.ResizeObserver = class ResizeObserver {
  public constructor(cb: any) {
    ;(this as any).cb = cb
  }

  public observe() {
    ;(this as any).cb([{ borderBoxSize: { inlineSize: 0, blockSize: 0 } }])
  }

  public unobserve() {}
}

// structuredClone doesn't exist in JSDOM, see:
// https://github.com/jsdom/jsdom/issues/3363
globalThis.structuredClone ??= (x: any) => JSON.parse(JSON.stringify(x))

// The following types are part of the WebWorker support in Node.js and are a
// common source of hangs in tests due to libraries creating them but not
// properly cleaning them up. See for example
// https://github.com/facebook/react/issues/20756, and
// https://github.com/dexie/Dexie.js/pull/1577.
//
// We've upgraded Dexie already but react-dom is a bigger beast and we don't
// need any of them to run our tests so we just delete them here. In fact,
// this is exactly what the react-16-node-hanging-test-fix patch does, see
// https://www.npmjs.com/package/react-16-node-hanging-test-fix?activeTab=code
delete g['MessageChannel']
delete g['MessagePort']
delete g['BroadcastChannel']
