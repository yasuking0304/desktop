import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { Repository } from '../../../src/models/repository'
import { getChangedFiles, getCommits } from '../../../src/lib/git'
import { setupFixtureRepository } from '../../helpers/repositories'
import { AppFileStatusKind } from '../../../src/models/status'
import { setupLocalConfig } from '../../helpers/local-config'

describe('git/log', () => {
  let repository: Repository

  beforeEach(async () => {
    const testRepoPath = await setupFixtureRepository('test-repo-with-tags')
    repository = new Repository(testRepoPath, -1, null, false)
  })

  describe('getCommits', () => {
    it('loads history', async () => {
      const commits = await getCommits(repository, 'HEAD', 100)
      assert.equal(commits.length, 5)

      const firstCommit = commits[commits.length - 1]
      assert.equal(firstCommit.summary, 'first')
      assert.equal(firstCommit.sha, '7cd6640e5b6ca8dbfd0b33d0281ebe702127079c')
      assert.equal(firstCommit.shortSha, '7cd6640')
    })

    it('handles repository with HEAD file on disk', async () => {
      const path = await setupFixtureRepository('repository-with-HEAD-file')
      const repo = new Repository(path, 1, null, false)
      const commits = await getCommits(repo, 'HEAD', 100)
      assert.equal(commits.length, 2)
    })

    it('handles repository with signed commit and log.showSignature set', async () => {
      const path = await setupFixtureRepository('just-doing-some-signing')
      const repository = new Repository(path, 1, null, false)

      // ensure the default config is to try and show signatures
      // this should be overriden by the `getCommits` function as it may not
      // have a valid GPG agent configured
      await setupLocalConfig(repository, [['log.showSignature', 'true']])

      const commits = await getCommits(repository, 'HEAD', 100)

      assert.equal(commits.length, 1)
      assert.equal(commits[0].sha, '415e4987158c49c383ce7114e0ef00ebf4b070c1')
      assert.equal(commits[0].shortSha, '415e498')
    })

    it('parses tags', async () => {
      const commits = await getCommits(repository, 'HEAD', 100)
      assert.equal(commits.length, 5)

      assert.deepStrictEqual(commits[0].tags, ['important'])
      assert.deepStrictEqual(commits[1].tags, ['tentative', 'less-important'])
      assert.equal(commits[2].tags.length, 0)
    })
  })

  describe('getChangedFiles', () => {
    it('loads the files changed in the commit', async () => {
      const changesetData = await getChangedFiles(
        repository,
        '7cd6640e5b6ca8dbfd0b33d0281ebe702127079c'
      )
      assert.equal(changesetData.files.length, 1)
      assert.equal(changesetData.files[0].path, 'README.md')
      assert.equal(changesetData.files[0].status.kind, AppFileStatusKind.New)
    })

    it('detects renames', async () => {
      const testRepoPath = await setupFixtureRepository(
        'rename-history-detection'
      )
      repository = new Repository(testRepoPath, -1, null, false)

      const first = await getChangedFiles(repository, '55bdecb')
      assert.equal(first.files.length, 1)

      assert.equal(first.files[0].path, 'NEWER.md')
      assert.deepStrictEqual(first.files[0].status, {
        kind: AppFileStatusKind.Renamed,
        oldPath: 'NEW.md',
        submoduleStatus: undefined,
        renameIncludesModifications: true,
      })

      const second = await getChangedFiles(repository, 'c898ca8')
      assert.equal(second.files.length, 1)

      assert.equal(second.files[0].path, 'NEW.md')
      assert.deepStrictEqual(second.files[0].status, {
        kind: AppFileStatusKind.Renamed,
        oldPath: 'OLD.md',
        submoduleStatus: undefined,
        renameIncludesModifications: false,
      })
    })

    it('detect copies', async () => {
      const testRepoPath = await setupFixtureRepository(
        'copies-history-detection'
      )
      repository = new Repository(testRepoPath, -1, null, false)

      // ensure the test repository is configured to detect copies
      await setupLocalConfig(repository, [['diff.renames', 'copies']])

      const changesetData = await getChangedFiles(repository, 'a500bf415')
      assert.equal(changesetData.files.length, 2)

      assert.equal(changesetData.files[0].path, 'duplicate-with-edits.md')
      assert.deepStrictEqual(changesetData.files[0].status, {
        kind: AppFileStatusKind.Copied,
        oldPath: 'initial.md',
        renameIncludesModifications: false,
        submoduleStatus: undefined,
      })

      assert.equal(changesetData.files[1].path, 'duplicate.md')
      assert.deepStrictEqual(changesetData.files[1].status, {
        kind: AppFileStatusKind.Copied,
        oldPath: 'initial.md',
        renameIncludesModifications: false,
        submoduleStatus: undefined,
      })
    })

    it('handles commit when HEAD exists on disk', async () => {
      const changesetData = await getChangedFiles(repository, 'HEAD')
      assert.equal(changesetData.files.length, 1)
      assert.equal(changesetData.files[0].path, 'README.md')
      assert.equal(
        changesetData.files[0].status.kind,
        AppFileStatusKind.Modified
      )
    })
  })

  it('detects submodule changes within commits', async () => {
    const repoPath = await setupFixtureRepository('submodule-basic-setup')
    repository = new Repository(repoPath, -1, null, false)

    const changesetData = await getChangedFiles(repository, 'HEAD')
    assert.equal(changesetData.files.length, 2)
    assert.equal(changesetData.files[1].path, 'foo/submodule')
    assert(changesetData.files[1].status.submoduleStatus !== undefined)
  })
})
