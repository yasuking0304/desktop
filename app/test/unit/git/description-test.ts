import { describe, it } from 'node:test'
import assert from 'node:assert'
import * as FSE from 'fs-extra'
import * as Path from 'path'

import { getGitDescription } from '../../../src/lib/git'
import { setupEmptyRepository } from '../../helpers/repositories'

describe('git/description', () => {
  describe('getGitDescription', () => {
    it('returns empty for an initialized repository', async t => {
      const repo = await setupEmptyRepository(t)
      const actual = await getGitDescription(repo.path)
      assert.equal(actual, '')
    })

    it('returns empty when path is missing', async t => {
      const repo = await setupEmptyRepository(t)
      const path = Path.join(repo.path, '.git', 'description')
      await FSE.unlink(path)

      const actual = await getGitDescription(repo.path)
      assert.equal(actual, '')
    })

    it('reads the custom text', async t => {
      const expected = 'this is a repository description'
      const repo = await setupEmptyRepository(t)
      const path = Path.join(repo.path, '.git', 'description')
      await FSE.writeFile(path, expected)

      const actual = await getGitDescription(repo.path)
      assert.equal(actual, expected)
    })
  })
})
