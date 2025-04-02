import { describe, it } from 'node:test'
import assert from 'node:assert'
import * as FSE from 'fs-extra'
import * as Path from 'path'

import { setupEmptyRepository } from '../../helpers/repositories'
import { writeGitAttributes } from '../../../src/ui/add-repository/git-attributes'

describe('git/git-attributes', () => {
  describe('writeGitAttributes', () => {
    it('initializes a .gitattributes file', async t => {
      const repo = await setupEmptyRepository(t)
      await writeGitAttributes(repo.path)
      const expectedPath = Path.join(repo.path, '.gitattributes')
      const contents = await FSE.readFile(expectedPath, 'utf8')
      assert(contents.includes('* text=auto'))
    })
  })
})
