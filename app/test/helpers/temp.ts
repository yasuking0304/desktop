import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { TestContext } from 'node:test'
import { sleep } from '../../src/lib/promise'
import { isErrnoException } from '../../src/lib/errno-exception'

// Reimplementation of retry logic in rimraf:
// https://github.com/isaacs/rimraf/blob/8733d4c30078a1ae5f18bb6affe83c1eea0259b4/src/retry-busy.ts#L10
const clean = async (path: string) => {
  for (let i = 1; i <= 6; i++) {
    await rm(path, { recursive: true }).catch((e: unknown) =>
      isErrnoException(e) && ['EMFILE', 'ENFILE', 'EBUSY'].includes(e.code)
        ? sleep(Math.ceil(Math.pow(i, 1.2)))
        : Promise.reject(e)
    )
  }
}

export const createTempDirectory = (t: TestContext) =>
  mkdtemp(join(tmpdir(), 'desktop-test-')).then(path => {
    t.after(() => clean(path))
    return path
  })
