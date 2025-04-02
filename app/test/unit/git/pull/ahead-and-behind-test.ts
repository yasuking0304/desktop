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
  describe('ahead and behind of tracking branch', () => {
    let repository: Repository

    beforeEach(async () => {
      const remoteRepository = await createRepository(featureBranch)
      repository = await cloneRepository(remoteRepository)

      // make a commits to both remote and local so histories diverge

      const changesForRemoteRepository = {
        commitMessage: 'Changed a file in the remote repository',
        entries: [
          {
            path: 'README.md',
            contents: '# HELLO WORLD! \n WORDS GO HERE! \nLOL',
          },
        ],
      }

      await makeCommit(remoteRepository, changesForRemoteRepository)

      const changesForLocalRepository = {
        commitMessage: 'Added a new file to the local repository',
        entries: [
          {
            path: 'CONTRIBUTING.md',
            contents: '# HELLO WORLD! \nTHINGS GO HERE\nYES, THINGS',
          },
        ],
      }

      await makeCommit(repository, changesForLocalRepository)
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

      it('is ahead of tracking branch', async () => {
        const range = revSymmetricDifference(featureBranch, remoteBranch)

        const aheadBehind = await getAheadBehind(repository, range)
        assert.deepStrictEqual(aheadBehind, { ahead: 2, behind: 0 })
      })
    })

    describe('with pull.rebase=false set in config', () => {
      let previousTip: Commit
      let newTip: Commit

      beforeEach(async () => {
        await setupLocalConfig(repository, [['pull.rebase', 'false']])

        previousTip = await getTipOrError(repository)

        await pull(repository, remote)

        newTip = await getTipOrError(repository)
      })

      it('creates a merge commit', async () => {
        assert.notEqual(newTip.sha, previousTip.sha)
        assert.equal(newTip.parentSHAs.length, 2)
      })

      it('is ahead of tracking branch', async () => {
        const range = revSymmetricDifference(featureBranch, remoteBranch)

        const aheadBehind = await getAheadBehind(repository, range)
        assert.deepStrictEqual(aheadBehind, { ahead: 2, behind: 0 })
      })
    })

    describe('with pull.rebase=true set in config', () => {
      let previousTip: Commit
      let newTip: Commit

      beforeEach(async () => {
        await setupLocalConfig(repository, [['pull.rebase', 'true']])

        previousTip = await getTipOrError(repository)

        await pull(repository, remote)

        newTip = await getTipOrError(repository)
      })

      it('does not create a merge commit', async () => {
        assert.notEqual(newTip.sha, previousTip.sha)
        assert.equal(newTip.parentSHAs.length, 1)
      })

      it('is ahead of tracking branch', async () => {
        const range = revSymmetricDifference(featureBranch, remoteBranch)

        const aheadBehind = await getAheadBehind(repository, range)
        assert.deepStrictEqual(aheadBehind, { ahead: 1, behind: 0 })
      })
    })

    describe('with pull.rebase=false and pull.ff=only set in config', () => {
      beforeEach(async () => {
        await setupLocalConfig(repository, [
          ['pull.rebase', 'false'],
          ['pull.ff', 'only'],
        ])
      })

      it(`throws an error as the user blocks merge commits on pull`, async () => {
        await assert.rejects(() => pull(repository, remote))
      })
    })
  })
})
