import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import {
  fetch,
  pull,
  getAheadBehind,
  revSymmetricDifference,
} from '../../../../src/lib/git'
import { Commit } from '../../../../src/models/commit'
import { Repository } from '../../../../src/models/repository'
import { createRepository } from '../../../helpers/repository-builder-pull-test'
import {
  cloneRepository,
  makeCommit,
} from '../../../helpers/repository-scaffolding'
import { getTipOrError, getRefOrError } from '../../../helpers/git'
import { setupLocalConfig } from '../../../helpers/local-config'
import { IRemote } from '../../../../src/models/remote'

const featureBranch = 'this-is-a-feature'
const remote: IRemote = { name: 'origin', url: 'file://' }
const remoteBranch = `${remote.name}/${featureBranch}`

describe('git/pull', () => {
  describe('only behind tracking branch', () => {
    let repository: Repository

    beforeEach(async () => {
      const remoteRepository = await createRepository(featureBranch)
      repository = await cloneRepository(remoteRepository)

      // make commits to remote is ahead of local repository

      const firstCommit = {
        commitMessage: 'Changed a file in the remote repository',
        entries: [
          {
            path: 'README.md',
            contents: '# HELLO WORLD! \n WORDS GO HERE! \nLOL',
          },
        ],
      }

      const secondCommit = {
        commitMessage: 'Added a new file to the remote repository',
        entries: [
          {
            path: 'CONTRIBUTING.md',
            contents: '# HELLO WORLD! \nTHINGS GO HERE\nYES, THINGS',
          },
        ],
      }

      await makeCommit(remoteRepository, firstCommit)
      await makeCommit(remoteRepository, secondCommit)

      await fetch(repository, remote)
    })

    describe('with pull.rebase=false and pull.ff=false set in config', () => {
      let previousTip: Commit
      let newTip: Commit

      beforeEach(async () => {
        await setupLocalConfig(repository, [
          ['pull.rebase', 'false'],
          ['pull.ff', 'false'],
        ])

        previousTip = await getTipOrError(repository)

        await pull(repository, remote)

        newTip = await getTipOrError(repository)
      })

      it('creates a merge commit', async () => {
        assert.notEqual(newTip.sha, previousTip.sha)
        assert.equal(newTip.parentSHAs.length, 2)
      })

      it('is different from remote branch', async () => {
        const remoteCommit = await getRefOrError(repository, remoteBranch)
        assert.notEqual(remoteCommit.sha, newTip.sha)
      })

      it('is now ahead of tracking branch', async () => {
        const range = revSymmetricDifference(featureBranch, remoteBranch)

        const aheadBehind = await getAheadBehind(repository, range)
        assert.deepStrictEqual(aheadBehind, { ahead: 1, behind: 0 })
      })
    })

    describe('with pull.ff=only set in config', () => {
      let previousTip: Commit
      let newTip: Commit

      beforeEach(async () => {
        await setupLocalConfig(repository, [['pull.ff', 'only']])

        previousTip = await getTipOrError(repository)

        await pull(repository, remote)

        newTip = await getTipOrError(repository)
      })

      it('does not create a merge commit', async () => {
        const newTip = await getTipOrError(repository)

        assert.notEqual(newTip.sha, previousTip.sha)
        assert.equal(newTip.parentSHAs.length, 1)
      })

      it('is same as remote branch', async () => {
        const remoteCommit = await getRefOrError(repository, remoteBranch)
        assert.equal(remoteCommit.sha, newTip.sha)
      })

      it('is not behind tracking branch', async () => {
        const range = revSymmetricDifference(featureBranch, remoteBranch)

        const aheadBehind = await getAheadBehind(repository, range)
        assert.deepStrictEqual(aheadBehind, { ahead: 0, behind: 0 })
      })
    })
  })
})
