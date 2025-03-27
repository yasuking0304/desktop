/* eslint-disable no-sync */

/** Module for creating and managing temporary directories and files, using the
 * `temp` Node module
 */
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { TestContext } from 'node:test'

export const createTempDirectory = (t: TestContext) =>
  mkdtemp(join(tmpdir(), 'desktop-test-')).then(path => {
    t.after(() => rm(path, { recursive: true }))
    return path
  })
