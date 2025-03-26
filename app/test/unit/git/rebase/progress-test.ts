import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import {
  IStatusResult,
  continueRebase,
  getStatus,
} from '../../../../src/lib/git'
import {
  rebase,
  RebaseResult,
  getRebaseSnapshot,
} from '../../../../src/lib/git'
import { createRepository as createShortRebaseTest } from '../../../helpers/repository-builder-rebase-test'
import { createRepository as createLongRebaseTest } from '../../../helpers/repository-builder-long-rebase-test'
import { getStatusOrThrow } from '../../../helpers/status'
import { GitRebaseSnapshot } from '../../../../src/models/rebase'
import { setupEmptyDirectory } from '../../../helpers/repositories'
import { getBranchOrError } from '../../../helpers/git'
import { IMultiCommitOperationProgress } from '../../../../src/models/progress'
import { isConflictedFile } from '../../../../src/lib/status'
import { ManualConflictResolution } from '../../../../src/models/manual-conflict-resolution'
import { Repository } from '../../../../src/models/repository'

const baseBranchName = 'base-branch'
const featureBranchName = 'this-is-a-feature'

describe('git/rebase', () => {
  describe('skips a normal repository', () => {
    it('returns null for rebase progress', async () => {
      const repository = setupEmptyDirectory()
      const progress = await getRebaseSnapshot(repository)

      assert.equal(progress, null)
    })
  })

  describe('can parse progress', () => {
    let repository: Repository | null
    let result: RebaseResult
    let snapshot: GitRebaseSnapshot | null
    let status: IStatusResult
    let progress = new Array<IMultiCommitOperationProgress>()

    beforeEach(async () => {
      repository = await createShortRebaseTest(
        baseBranchName,
        featureBranchName
      )

      const featureBranch = await getBranchOrError(
        repository,
        featureBranchName
      )

      const baseBranch = await getBranchOrError(repository, baseBranchName)

      progress = new Array<IMultiCommitOperationProgress>()
      result = await rebase(repository, baseBranch, featureBranch, p =>
        progress.push(p)
      )

      snapshot = await getRebaseSnapshot(repository)

      status = await getStatusOrThrow(repository)
    })

    it('returns a value indicating conflicts were encountered', () => {
      assert.equal(result, RebaseResult.ConflictsEncountered)
    })

    it('reported step-by-step progress before encountering conflicts', () => {
      assert.deepStrictEqual(progress, [
        {
          currentCommitSummary: 'Feature Branch!',
          kind: 'multiCommitOperation',
          position: 1,
          totalCommitCount: 1,
          value: 1,
        },
      ])
    })

    it('status detects REBASE_HEAD', () => {
      assert(snapshot !== null)
      const s = snapshot
      assert.equal(s.commits.length, 1)
      assert.equal(s.commits[0].summary, 'Feature Branch!')

      assert.equal(s.progress.position, 1)
      assert.equal(s.progress.totalCommitCount, 1)
      assert.equal(s.progress.currentCommitSummary, 'Feature Branch!')
      assert.equal(s.progress.value, 1)
    })

    it('is a detached HEAD state', () => {
      assert(status.currentBranch === undefined)
    })
  })

  describe('can parse progress for long rebase', () => {
    let repository: Repository | null
    let result: RebaseResult
    let snapshot: GitRebaseSnapshot | null
    let status: IStatusResult
    let progress = new Array<IMultiCommitOperationProgress>()

    beforeEach(async () => {
      repository = await createLongRebaseTest(baseBranchName, featureBranchName)

      const featureBranch = await getBranchOrError(
        repository,
        featureBranchName
      )

      const baseBranch = await getBranchOrError(repository, baseBranchName)

      progress = new Array<IMultiCommitOperationProgress>()
      result = await rebase(repository, baseBranch, featureBranch, p =>
        progress.push(p)
      )

      snapshot = await getRebaseSnapshot(repository)

      status = await getStatusOrThrow(repository)
    })

    it('returns a value indicating conflicts were encountered', () => {
      assert.equal(result, RebaseResult.ConflictsEncountered)
    })

    it('reported step-by-step progress before encountering conflicts', () => {
      assert.deepStrictEqual(progress, [
        {
          currentCommitSummary: 'Feature Branch First Commit!',
          kind: 'multiCommitOperation',
          position: 1,
          totalCommitCount: 10,
          value: 0.1,
        },
      ])
    })

    it('reports progress after resolving conflicts', async () => {
      const strategy = ManualConflictResolution.theirs
      const progressCb = (p: IMultiCommitOperationProgress) => progress.push(p)

      while (result === RebaseResult.ConflictsEncountered) {
        result = await resolveAndContinue(repository!, strategy, progressCb)
      }

      assert.equal(progress.length, 10)
      assert.deepStrictEqual(progress[9], {
        currentCommitSummary: 'Feature Branch Tenth Commit!',
        kind: 'multiCommitOperation',
        position: 10,
        totalCommitCount: 10,
        value: 1,
      })
    })

    it('status detects REBASE_HEAD', () => {
      assert(snapshot !== null)
      const s = snapshot
      assert.equal(s.commits.length, 10)
      assert.equal(s.commits[0].summary, 'Feature Branch First Commit!')

      assert.equal(s.progress.position, 1)
      assert.equal(s.progress.totalCommitCount, 10)
      assert.equal(
        s.progress.currentCommitSummary,
        'Feature Branch First Commit!'
      )
      assert.equal(s.progress.value, 0.1)
    })

    it('is a detached HEAD state', () => {
      assert(status.currentBranch === undefined)
    })
  })
})

async function resolveAndContinue(
  repository: Repository,
  strategy: ManualConflictResolution,
  progressCb: (progress: IMultiCommitOperationProgress) => void
) {
  const status = await getStatus(repository)
  const files = status?.workingDirectory.files ?? []
  const resolutions = new Map<string, ManualConflictResolution>()

  for (const file of files) {
    if (isConflictedFile(file.status)) {
      resolutions.set(file.path, strategy)
    }
  }

  return continueRebase(repository, files, resolutions, progressCb)
}
