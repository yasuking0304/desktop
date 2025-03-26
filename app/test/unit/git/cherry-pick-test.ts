import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { exec } from 'dugite'
import * as FSE from 'fs-extra'
import * as Path from 'path'
import {
  getCommit,
  getCommits,
  getCommitsInRange,
  merge,
  MergeResult,
  revRangeInclusive,
} from '../../../src/lib/git'
import {
  abortCherryPick,
  cherryPick,
  CherryPickResult,
  continueCherryPick,
  getCherryPickSnapshot,
} from '../../../src/lib/git/cherry-pick'
import { isConflictedFile } from '../../../src/lib/status'
import { Branch } from '../../../src/models/branch'
import { ManualConflictResolution } from '../../../src/models/manual-conflict-resolution'
import { IMultiCommitOperationProgress } from '../../../src/models/progress'
import { Repository } from '../../../src/models/repository'
import { AppFileStatusKind } from '../../../src/models/status'
import { getBranchOrError } from '../../helpers/git'
import { createRepository } from '../../helpers/repository-builder-cherry-pick-test'
import {
  createBranch,
  makeCommit,
  switchTo,
} from '../../helpers/repository-scaffolding'
import { getStatusOrThrow } from '../../helpers/status'

const featureBranchName = 'this-is-a-feature'
const targetBranchName = 'target-branch'

describe('git/cherry-pick', () => {
  let repository: Repository
  let featureBranch: Branch
  let targetBranch: Branch
  let result: CherryPickResult | null

  beforeEach(async () => {
    // This will create a repository with a feature branch with one commit to
    // cherry pick and will check out the target branch.
    repository = await createRepository(featureBranchName, targetBranchName)

    // branch with tip as commit to cherry pick
    featureBranch = await getBranchOrError(repository, featureBranchName)

    // branch with to cherry pick to
    targetBranch = await getBranchOrError(repository, targetBranchName)

    // set result to null for each test
    result = null
  })

  it('successfully cherry-picked one commit without conflicts', async () => {
    const featureTip = await getCommitOneLine(repository, featureBranch.tip.sha)
    result = await cherryPick(repository, [featureTip])
    const cherryPickedCommit = await getCommit(
      repository,
      featureBranch.tip.sha
    )

    const commits = await getCommits(repository, targetBranch.ref, 3)
    assert(cherryPickedCommit !== null)

    assert.equal(commits.length, 2)
    assert.equal(commits[0].summary, cherryPickedCommit.summary)
    assert.equal(result, CherryPickResult.CompletedWithoutError)
  })

  it('successfully cherry-picked a commit with empty message', async () => {
    // add a commit with no message
    await switchTo(repository, featureBranchName)
    const filePath = Path.join(repository.path, 'EMPTY_MESSAGE.md')
    await FSE.writeFile(filePath, '# HELLO WORLD! \nTHINGS GO HERE\n')
    await exec(['add', filePath], repository.path)
    await exec(['commit', '--allow-empty-message', '-m', ''], repository.path)

    featureBranch = await getBranchOrError(repository, featureBranchName)
    await switchTo(repository, targetBranchName)

    // confirm feature branch tip has an empty message
    const emptyMessageCommit = await getCommit(
      repository,
      featureBranch.tip.sha
    )
    assert.equal(emptyMessageCommit?.summary, '')

    const featureTip = await getCommitOneLine(repository, featureBranch.tip.sha)
    result = await cherryPick(repository, [featureTip])

    const commits = await getCommits(repository, targetBranch.ref, 5)
    assert.equal(commits.length, 2)
    assert.equal(commits[0]!.summary, '')
    assert.equal(result, CherryPickResult.CompletedWithoutError)
  })

  it('successfully cherry-picks a redundant commit', async () => {
    let featureTip = await getCommitOneLine(repository, featureBranch.tip.sha)
    result = await cherryPick(repository, [featureTip])

    const commits = await getCommits(repository, targetBranch.ref, 5)
    assert.equal(commits.length, 2)
    assert.equal(result, CherryPickResult.CompletedWithoutError)

    featureTip = await getCommitOneLine(repository, featureBranch.tip.sha)
    result = await cherryPick(repository, [featureTip])

    const commitsAfterRedundant = await getCommits(
      repository,
      targetBranch.ref,
      5
    )
    assert.equal(commitsAfterRedundant.length, 3)
    assert.equal(result, CherryPickResult.CompletedWithoutError)
  })

  it('successfully cherry-picks an empty commit', async () => {
    // add empty commit to feature branch
    await switchTo(repository, featureBranchName)
    await exec(
      ['commit', '--allow-empty', '-m', 'Empty Commit'],
      repository.path
    )

    featureBranch = await getBranchOrError(repository, featureBranchName)
    await switchTo(repository, targetBranchName)

    const featureTip = await getCommitOneLine(repository, featureBranch.tip.sha)
    result = await cherryPick(repository, [featureTip])

    const commits = await getCommits(repository, targetBranch.ref, 5)
    assert.equal(commits.length, 2)
    assert.equal(result, CherryPickResult.CompletedWithoutError)
  })

  it('successfully cherry-picks an empty commit inside a range', async () => {
    const firstCommitSha = featureBranch.tip.sha

    // add empty commit to feature branch
    await switchTo(repository, featureBranchName)
    await exec(
      ['commit', '--allow-empty', '-m', 'Empty Commit'],
      repository.path
    )

    // add another commit so empty commit will be inside a range
    const featureBranchCommitTwo = {
      commitMessage: 'Cherry-picked Feature! Number Two',
      entries: [
        {
          path: 'THING_TWO.md',
          contents: '# HELLO WORLD! \nTHINGS GO HERE\n',
        },
      ],
    }
    await makeCommit(repository, featureBranchCommitTwo)

    featureBranch = await getBranchOrError(repository, featureBranchName)
    await switchTo(repository, targetBranchName)

    // cherry picking 3 (on added in setup, empty, featureBranchCommitTwo)
    const commitRange = revRangeInclusive(firstCommitSha, featureBranch.tip.sha)
    const commitsInRange = await getCommitsInRange(repository, commitRange)
    assert(commitsInRange !== null)
    result = await cherryPick(repository, commitsInRange)

    const commits = await getCommits(repository, targetBranch.ref, 5)
    assert.equal(commits.length, 4) // original commit + 4 cherry picked
    assert.equal(result, CherryPickResult.CompletedWithoutError)
  })

  it('successfully cherry-picked multiple commits without conflicts', async () => {
    // keep reference to the first commit in cherry pick range
    const firstCommitSha = featureBranch.tip.sha

    await addThreeMoreCommitsOntoFeatureBranch(repository)
    featureBranch = await getBranchOrError(repository, featureBranchName)
    await switchTo(repository, targetBranchName)

    const commitRange = revRangeInclusive(firstCommitSha, featureBranch.tip.sha)
    const commitsInRange = await getCommitsInRange(repository, commitRange)
    assert(commitsInRange !== null)

    result = await cherryPick(repository, commitsInRange)

    const commits = await getCommits(repository, targetBranch.ref, 5)
    assert.equal(commits.length, 5)
    assert.equal(commits[1].summary, 'Cherry-picked Feature! Number Three')
    assert.equal(commits[2].summary, 'Cherry-picked Feature! Number Two')
  })

  it('fails to cherry-pick array of no commits', async () => {
    result = await cherryPick(repository, [])
    assert.equal(result, CherryPickResult.UnableToStart)
  })

  it('fails to cherry-pick when working tree is not clean', async () => {
    await FSE.writeFile(
      Path.join(repository.path, 'THING.md'),
      '# HELLO WORLD! \nTHINGS GO HERE\nFEATURE BRANCH UNDERWAY\n'
    )

    // This error should not occur in the wild due to the nature of Desktop's UI
    // starting on source branch and having to checkout the target branch.
    // During target branch checkout, it will fail before we even get to cherry
    // picking. Thus, this scenario from a UI's perspective is already handled.
    // No need to add dugite errors to handle it.
    result = null
    try {
      const featureTip = await getCommitOneLine(
        repository,
        featureBranch.tip.sha
      )
      result = await cherryPick(repository, [featureTip])
    } catch (error) {
      assert(
        error
          .toString()
          .includes(
            'The following untracked working tree files would be overwritten by merge'
          )
      )
    }
    assert.equal(result, null)
  })

  it('successfully cherry-picks a merge commit', async () => {
    //create new branch off of default to merge into feature branch
    await switchTo(repository, 'main')
    const mergeBranchName = 'branch-to-merge'
    await createBranch(repository, mergeBranchName, 'HEAD')
    await switchTo(repository, mergeBranchName)
    const mergeCommit = {
      commitMessage: 'Commit To Merge',
      entries: [
        {
          path: 'merging.md',
          contents: '# HELLO WORLD! \nMERGED THINGS GO HERE\n',
        },
      ],
    }
    await makeCommit(repository, mergeCommit)
    const mergeBranch = await getBranchOrError(repository, mergeBranchName)
    await switchTo(repository, featureBranchName)
    assert.equal(await merge(repository, mergeBranch.ref), MergeResult.Success)

    // top commit is a merge commit
    const commits = await getCommits(repository, featureBranch.ref, 7)
    assert(commits[0].summary.includes('Merge'))

    featureBranch = await getBranchOrError(repository, featureBranchName)
    await switchTo(repository, targetBranchName)

    const featureTip = await getCommitOneLine(repository, featureBranch.tip.sha)
    result = await cherryPick(repository, [featureTip])
    assert.equal(result, CherryPickResult.CompletedWithoutError)
  })

  it('successfully cherry-picks a merge commit after a conflict', async () => {
    const firstSha = featureBranch.tip.sha

    // In the 'git/cherry-pick' `beforeEach`, we call `createRepository` which
    // adds a commit to the feature branch with a file called THING.md. In
    // order to make a conflict, we will add the same file to the target
    // branch.
    const conflictingCommit = {
      commitMessage: 'Conflicting Commit!',
      entries: [
        {
          path: 'THING.md',
          contents: '# HELLO WORLD! \n CREATING CONFLICT! FUN TIMES!\n',
        },
      ],
    }
    await makeCommit(repository, conflictingCommit)

    //create new branch off of default to merge into feature branch
    await switchTo(repository, 'main')
    const mergeBranchName = 'branch-to-merge'
    await createBranch(repository, mergeBranchName, 'HEAD')
    await switchTo(repository, mergeBranchName)
    const mergeCommit = {
      commitMessage: 'Commit To Merge',
      entries: [
        {
          path: 'merging.md',
          contents: '# HELLO WORLD! \nMERGED THINGS GO HERE\n',
        },
      ],
    }
    await makeCommit(repository, mergeCommit)
    const mergeBranch = await getBranchOrError(repository, mergeBranchName)
    await switchTo(repository, featureBranchName)
    assert.equal(await merge(repository, mergeBranch.ref), MergeResult.Success)

    // top commit is a merge commit
    const commits = await getCommits(repository, featureBranch.ref, 7)
    assert(commits[0].summary.includes('Merge'))

    featureBranch = await getBranchOrError(repository, featureBranchName)
    await switchTo(repository, targetBranchName)

    const commitRange = revRangeInclusive(firstSha, featureBranch.tip.sha)
    const commitsInRange = await getCommitsInRange(repository, commitRange)
    assert(commitsInRange !== null)
    result = await cherryPick(repository, commitsInRange)
    assert.equal(result, CherryPickResult.ConflictsEncountered)

    // resolve conflicts by writing files to disk
    await FSE.writeFile(
      Path.join(repository.path, 'THING.md'),
      '# HELLO WORLD! \nTHINGS GO HERE\nFEATURE BRANCH UNDERWAY\n'
    )

    const statusAfterCherryPick = await getStatusOrThrow(repository)
    const { files } = statusAfterCherryPick.workingDirectory

    result = await continueCherryPick(repository, files)

    assert.equal(result, CherryPickResult.CompletedWithoutError)
  })

  describe('cherry-picking with conflicts', () => {
    beforeEach(async () => {
      // In the 'git/cherry-pick' `beforeEach`, we call `createRepository` which
      // adds a commit to the feature branch with a file called THING.md. In
      // order to make a conflict, we will add the same file to the target
      // branch.
      const conflictingCommit = {
        commitMessage: 'Conflicting Commit!',
        entries: [
          {
            path: 'THING.md',
            contents: '# HELLO WORLD! \n CREATING CONFLICT! FUN TIMES!\n',
          },
        ],
      }
      await makeCommit(repository, conflictingCommit)
    })

    it('successfully detects cherry-pick with conflicts', async () => {
      const featureTip = await getCommitOneLine(
        repository,
        featureBranch.tip.sha
      )
      result = await cherryPick(repository, [featureTip])
      assert.equal(result, CherryPickResult.ConflictsEncountered)

      const status = await getStatusOrThrow(repository)
      const conflictedFiles = status.workingDirectory.files.filter(
        f => f.status.kind === AppFileStatusKind.Conflicted
      )
      assert.equal(conflictedFiles.length, 1)
    })

    it('successfully continues cherry-picking with conflicts after resolving them by overwriting', async () => {
      const featureTip = await getCommitOneLine(
        repository,
        featureBranch.tip.sha
      )
      result = await cherryPick(repository, [featureTip])
      assert.equal(result, CherryPickResult.ConflictsEncountered)

      const statusAfterCherryPick = await getStatusOrThrow(repository)
      const { files } = statusAfterCherryPick.workingDirectory

      // git diff --check warns if conflict markers exist and will exit with
      // non-zero status if conflicts found
      const diffCheckBefore = await exec(['diff', '--check'], repository.path)
      assert(diffCheckBefore.exitCode > 0)

      // resolve conflicts by writing files to disk
      await FSE.writeFile(
        Path.join(repository.path, 'THING.md'),
        '# HELLO WORLD! \nTHINGS GO HERE\nFEATURE BRANCH UNDERWAY\n'
      )

      // diff --check to verify no conflicts exist (exitCode should be 0)
      const diffCheckAfter = await exec(['diff', '--check'], repository.path)
      assert.equal(diffCheckAfter.exitCode, 0)

      result = await continueCherryPick(repository, files)

      assert.equal(result, CherryPickResult.CompletedWithoutError)
    })

    it('successfully continues cherry-picking with conflicts after resolving them manually', async () => {
      const featureTip = await getCommitOneLine(
        repository,
        featureBranch.tip.sha
      )
      result = await cherryPick(repository, [featureTip])
      assert.equal(result, CherryPickResult.ConflictsEncountered)

      const statusAfterCherryPick = await getStatusOrThrow(repository)
      const { files } = statusAfterCherryPick.workingDirectory

      // git diff --check warns if conflict markers exist and will exit with
      // non-zero status if conflicts found
      const diffCheckBefore = await exec(['diff', '--check'], repository.path)
      assert(diffCheckBefore.exitCode > 0)

      const manualResolutions = new Map<string, ManualConflictResolution>()

      for (const file of files) {
        if (isConflictedFile(file.status)) {
          manualResolutions.set(file.path, ManualConflictResolution.theirs)
        }
      }

      result = await continueCherryPick(repository, files, manualResolutions)

      assert.equal(result, CherryPickResult.CompletedWithoutError)
    })

    it('successfully continues cherry-picking with conflicts after resolving them manually and no changes to commit', async () => {
      const featureTip = await getCommitOneLine(
        repository,
        featureBranch.tip.sha
      )
      result = await cherryPick(repository, [featureTip])
      assert.equal(result, CherryPickResult.ConflictsEncountered)

      const statusAfterCherryPick = await getStatusOrThrow(repository)
      const { files } = statusAfterCherryPick.workingDirectory

      // git diff --check warns if conflict markers exist and will exit with
      // non-zero status if conflicts found
      const diffCheckBefore = await exec(['diff', '--check'], repository.path)
      assert(diffCheckBefore.exitCode > 0)

      const manualResolutions = new Map<string, ManualConflictResolution>()

      for (const file of files) {
        if (isConflictedFile(file.status)) {
          manualResolutions.set(file.path, ManualConflictResolution.ours)
        }
      }

      result = await continueCherryPick(repository, files, manualResolutions)

      assert.equal(result, CherryPickResult.CompletedWithoutError)
    })

    it('successfully detects cherry-picking with outstanding files not staged', async () => {
      const featureTip = await getCommitOneLine(
        repository,
        featureBranch.tip.sha
      )
      result = await cherryPick(repository, [featureTip])
      assert.equal(result, CherryPickResult.ConflictsEncountered)

      result = await continueCherryPick(repository, [])
      assert.equal(result, CherryPickResult.OutstandingFilesNotStaged)

      const status = await getStatusOrThrow(repository)
      const conflictedFiles = status.workingDirectory.files.filter(
        f => f.status.kind === AppFileStatusKind.Conflicted
      )
      assert.equal(conflictedFiles.length, 1)
    })

    it('successfully continues cherry-picking with additional changes to untracked files', async () => {
      const featureTip = await getCommitOneLine(
        repository,
        featureBranch.tip.sha
      )
      result = await cherryPick(repository, [featureTip])
      assert.equal(result, CherryPickResult.ConflictsEncountered)

      // resolve conflicts by writing files to disk
      await FSE.writeFile(
        Path.join(repository.path, 'THING.md'),
        '# HELLO WORLD! \nTHINGS GO HERE\nFEATURE BRANCH UNDERWAY\n'
      )

      // changes to untracked file
      await FSE.writeFile(
        Path.join(repository.path, 'UNTRACKED_FILE.md'),
        '# HELLO WORLD! \nUNTRACKED FILE STUFF IN HERE\n'
      )

      const statusAfterCherryPick = await getStatusOrThrow(repository)
      const { files } = statusAfterCherryPick.workingDirectory

      // THING.MD and UNTRACKED_FILE.md should be in working directory
      assert.equal(files.length, 2)

      result = await continueCherryPick(repository, files)
      assert.equal(result, CherryPickResult.CompletedWithoutError)

      // Only UNTRACKED_FILE.md should be in working directory
      // THING.md committed with cherry pick
      const status = await getStatusOrThrow(repository)
      assert.equal(status.workingDirectory.files[0].path, 'UNTRACKED_FILE.md')
    })

    it('successfully aborts cherry-pick after conflict', async () => {
      const featureTip = await getCommitOneLine(
        repository,
        featureBranch.tip.sha
      )
      result = await cherryPick(repository, [featureTip])
      assert.equal(result, CherryPickResult.ConflictsEncountered)

      // files from cherry pick exist in conflicted state
      const statusAfterConflict = await getStatusOrThrow(repository)
      assert.equal(statusAfterConflict.workingDirectory.files.length, 1)

      await abortCherryPick(repository)

      // file from cherry pick removed after abort
      const statusAfterAbort = await getStatusOrThrow(repository)
      assert.equal(statusAfterAbort.workingDirectory.files.length, 0)
    })
  })

  describe('cherry-picking progress', () => {
    let progress = new Array<IMultiCommitOperationProgress>()
    beforeEach(() => {
      progress = []
    })

    it('successfully parses progress for a single commit', async () => {
      const featureTip = await getCommitOneLine(
        repository,
        featureBranch.tip.sha
      )
      result = await cherryPick(repository, [featureTip], p => progress.push(p))

      // commit summary set up in before each is "Cherry-picked Feature"
      assert.deepStrictEqual(progress, [
        {
          currentCommitSummary: featureTip.summary,
          kind: 'multiCommitOperation',
          position: 1,
          totalCommitCount: 1,
          value: 1,
        },
      ])
    })

    it('successfully parses progress for multiple commits', async () => {
      const firstCommitSha = featureBranch.tip.sha

      await addThreeMoreCommitsOntoFeatureBranch(repository)
      featureBranch = await getBranchOrError(repository, featureBranchName)
      await switchTo(repository, targetBranchName)

      const commitRange = revRangeInclusive(
        firstCommitSha,
        featureBranch.tip.sha
      )
      const commitsInRange = await getCommitsInRange(repository, commitRange)
      assert(commitsInRange !== null)
      result = await cherryPick(repository, commitsInRange, p =>
        progress.push(p)
      )

      assert.equal(result, CherryPickResult.CompletedWithoutError)
      assert.equal(progress.length, 4)
    })

    it('successfully parses progress for multiple commits including a conflict', async () => {
      const firstCommitSha = featureBranch.tip.sha

      await addThreeMoreCommitsOntoFeatureBranch(repository)
      featureBranch = await getBranchOrError(repository, featureBranchName)
      await switchTo(repository, targetBranchName)

      // Add a commit to the target branch to conflict with the third commit on
      // the target branch.
      const targetBranchConflictingCommitTwo = {
        commitMessage: 'Conflicting with 2nd commit on feature branch',
        entries: [
          {
            path: 'THING_THREE.md',
            contents: '# Conflict with feature branch here',
          },
        ],
      }
      await makeCommit(repository, targetBranchConflictingCommitTwo)

      const commitRange = revRangeInclusive(
        firstCommitSha,
        featureBranch.tip.sha
      )
      const commitsInRange = await getCommitsInRange(repository, commitRange)
      assert(commitsInRange !== null)
      result = await cherryPick(repository, commitsInRange, p =>
        progress.push(p)
      )
      assert.equal(result, CherryPickResult.ConflictsEncountered)
      // First commit and second cherry picked and rest are waiting on conflict
      // resolution.
      assert.equal(progress.length, 2)

      // snapshot prepares the progress for the commit after what has
      // already happened.
      const snapshot = await getCherryPickSnapshot(repository)
      assert.equal(snapshot?.progress.position, progress[1].position + 1)

      // resolve conflicts and continue
      const statusAfterConflictedCherryPick = await getStatusOrThrow(repository)
      const { files } = statusAfterConflictedCherryPick.workingDirectory
      await FSE.writeFile(
        Path.join(repository.path, 'THING_THREE.md'),
        '# Resolve conflicts!'
      )
      result = await continueCherryPick(repository, files, new Map(), p =>
        progress.push(p)
      )
      assert.equal(result, CherryPickResult.CompletedWithoutError)
      // After 3rd commit resolved, 3rd and 4th were cherry picked
      assert.equal(progress.length, 4)
      assert.equal(progress[0].currentCommitSummary, 'Cherry-picked Feature!')
      assert.equal(
        progress[1].currentCommitSummary,
        'Cherry-picked Feature! Number Two'
      )
      assert.equal(
        progress[2].currentCommitSummary,
        'Cherry-picked Feature! Number Three'
      )
      assert.equal(
        progress[3].currentCommitSummary,
        'Cherry-picked Feature! Number Four'
      )
    })
  })
})

async function getCommitOneLine(repository: Repository, commitSha: string) {
  const commit = await getCommit(repository, commitSha)
  assert(commit !== null)
  return { sha: commit.sha, summary: commit.summary }
}

async function addThreeMoreCommitsOntoFeatureBranch(repository: Repository) {
  await switchTo(repository, featureBranchName)

  const featureBranchCommitTwo = {
    commitMessage: 'Cherry-picked Feature! Number Two',
    entries: [
      {
        path: 'THING_TWO.md',
        contents: '# HELLO WORLD! \nTHINGS GO HERE\n',
      },
    ],
  }
  await makeCommit(repository, featureBranchCommitTwo)

  const featureBranchCommitThree = {
    commitMessage: 'Cherry-picked Feature! Number Three',
    entries: [
      {
        path: 'THING_THREE.md',
        contents: '# HELLO WORLD! \nTHINGS GO HERE\n',
      },
    ],
  }
  await makeCommit(repository, featureBranchCommitThree)

  const featureBranchCommitFour = {
    commitMessage: 'Cherry-picked Feature! Number Four',
    entries: [
      {
        path: 'THING_FOUR.md',
        contents: '# HELLO WORLD! \nTHINGS GO HERE\n',
      },
    ],
  }
  await makeCommit(repository, featureBranchCommitFour)
}
