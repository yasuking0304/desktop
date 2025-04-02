import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { Repository } from '../../../src/models/repository'
import {
  setupConflictedRepo,
  setupConflictedRepoWithMultipleFiles,
  setupEmptyRepository,
} from '../../helpers/repositories'

import { getFilesWithConflictMarkers } from '../../../src/lib/git/diff-check'

describe('getFilesWithConflictMarkers', () => {
  let repository: Repository

  describe('with one conflicted file', () => {
    beforeEach(async () => {
      repository = await setupConflictedRepo()
    })

    it('finds one conflicted file', async () => {
      assert.deepStrictEqual(
        await getFilesWithConflictMarkers(repository.path),
        new Map([['foo', 3]])
      )
    })
  })

  describe('with one conflicted file', () => {
    beforeEach(async () => {
      repository = await setupConflictedRepoWithMultipleFiles()
    })
    it('finds multiple conflicted files', async () => {
      assert.deepStrictEqual(
        await getFilesWithConflictMarkers(repository.path),
        new Map([
          ['baz', 3],
          ['cat', 3],
          ['foo', 3],
        ])
      )
    })
  })

  describe('with no conflicted files', () => {
    beforeEach(async () => {
      repository = await setupEmptyRepository()
    })

    it('finds no conflicted files', async () => {
      assert((await getFilesWithConflictMarkers(repository.path)).size === 0)
    })
  })
})
