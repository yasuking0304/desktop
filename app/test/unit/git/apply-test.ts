import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { exec } from 'dugite'
import {
  setupTwoCommitRepo,
  setupFixtureRepository,
} from '../../helpers/repositories'
import { Repository } from '../../../src/models/repository'
import {
  checkPatch,
  getWorkingDirectoryDiff,
  discardChangesFromSelection,
} from '../../../src/lib/git'
import {
  cloneLocalRepository,
  makeCommit,
} from '../../helpers/repository-scaffolding'
import {
  WorkingDirectoryFileChange,
  AppFileStatusKind,
} from '../../../src/models/status'
import {
  DiffSelection,
  DiffSelectionType,
  ITextDiff,
} from '../../../src/models/diff'
import { findInteractiveDiffRange } from '../../../src/ui/diff/diff-explorer'
import * as FSE from 'fs-extra'
import * as Path from 'path'
import { structuredPatch } from 'diff'

describe('git/apply', () => {
  describe('checkPatch()', () => {
    describe('on related repository without conflicts', () => {
      let repository: Repository
      let patch: string
      beforeEach(async () => {
        const originalRepo = await setupTwoCommitRepo()
        repository = await cloneLocalRepository(originalRepo)
        await makeCommit(originalRepo, {
          entries: [{ path: 'just-okay-file', contents: 'okay' }],
        })
        const result = await exec(
          ['format-patch', '--stdout', 'HEAD~'],
          originalRepo.path
        )
        patch = result.stdout
      })
      it('returns true', async () => {
        assert.equal(await checkPatch(repository, patch), true)
      })
    })
    describe('on a related repo with conflicts', () => {
      let repository: Repository
      let patch: string
      beforeEach(async () => {
        const originalRepo = await setupTwoCommitRepo()
        const result = await exec(
          ['format-patch', '--stdout', 'HEAD~'],
          originalRepo.path
        )
        patch = result.stdout
        repository = await cloneLocalRepository(originalRepo)
        await makeCommit(repository, {
          entries: [{ path: 'good-file', contents: 'okay' }],
        })
      })
      it('returns false', async () => {
        assert.equal(await checkPatch(repository, patch), false)
      })
    })
  })

  describe('discardChangesFromSelection()', () => {
    let repository: Repository
    let testRepoPath: string

    async function getDiff(filePath: string) {
      const file = new WorkingDirectoryFileChange(
        filePath,
        { kind: AppFileStatusKind.Modified },
        DiffSelection.fromInitialSelection(DiffSelectionType.None)
      )
      return (await getWorkingDirectoryDiff(repository, file)) as ITextDiff
    }

    beforeEach(async () => {
      testRepoPath = await setupFixtureRepository('repo-with-changes')
      repository = new Repository(testRepoPath, -1, null, false)
    })

    it('does not change the file when an empty selection is passed', async () => {
      const filePath = 'modified-file.md'
      const previousDiff = await getDiff(filePath)

      await discardChangesFromSelection(
        repository,
        filePath,
        previousDiff,
        DiffSelection.fromInitialSelection(DiffSelectionType.None)
      )

      const diff = await getDiff(filePath)

      assert.equal(diff.text, previousDiff.text)
    })

    it('discards all file changes when a full selection is passed', async () => {
      const filePath = 'modified-file.md'
      await discardChangesFromSelection(
        repository,
        filePath,
        await getDiff(filePath),
        DiffSelection.fromInitialSelection(DiffSelectionType.All)
      )

      const diff = await getDiff(filePath)

      // Check that the file has no local changes.
      assert.equal(diff.text, '')
      assert(diff.hunks.length === 0)
    })

    it('re-adds a single removed line', async () => {
      const filePath = 'modified-file.md'
      const selection = DiffSelection.fromInitialSelection(
        DiffSelectionType.None
      ).withLineSelection(4, true)

      const previousContents = await FSE.readFile(
        Path.join(repository.path, filePath),
        'utf8'
      )

      await discardChangesFromSelection(
        repository,
        filePath,
        await getDiff(filePath),
        selection
      )

      const fileContents = await FSE.readFile(
        Path.join(repository.path, filePath),
        'utf8'
      )

      assert.equal(
        getDifference(previousContents, fileContents),
        `@@ -7,0 +7,1 @@
+Aliquam leo ipsum, laoreet sed libero at, mollis pulvinar arcu. Nullam porttitor`
      )
    })

    it('re-adds a removed hunk', async () => {
      const filePath = 'modified-file.md'
      const diff = await getDiff(filePath)
      const hunkRange = findInteractiveDiffRange(diff.hunks, 4)
      const selection = DiffSelection.fromInitialSelection(
        DiffSelectionType.None
      ).withRangeSelection(
        hunkRange!.from,
        hunkRange!.to - hunkRange!.from + 1,
        true
      )

      const previousContents = await FSE.readFile(
        Path.join(repository.path, filePath),
        'utf8'
      )

      await discardChangesFromSelection(repository, filePath, diff, selection)

      const fileContents = await FSE.readFile(
        Path.join(repository.path, filePath),
        'utf8'
      )

      assert.equal(
        getDifference(previousContents, fileContents),
        `@@ -7,0 +7,4 @@
+Aliquam leo ipsum, laoreet sed libero at, mollis pulvinar arcu. Nullam porttitor
+nisl eget hendrerit vestibulum. Curabitur ornare id neque ac tristique. Cras in
+eleifend mi.
+`
      )
    })

    it('removes an added line', async () => {
      const filePath = 'modified-file.md'
      const selection = DiffSelection.fromInitialSelection(
        DiffSelectionType.None
      ).withLineSelection(16, true)

      const previousContents = await FSE.readFile(
        Path.join(repository.path, filePath),
        'utf8'
      )

      await discardChangesFromSelection(
        repository,
        filePath,
        await getDiff(filePath),
        selection
      )

      const fileContents = await FSE.readFile(
        Path.join(repository.path, filePath),
        'utf8'
      )

      assert.equal(
        getDifference(previousContents, fileContents),
        `@@ -21,1 +21,0 @@
-nisl eget hendrerit vestibulum. Curabitur ornare id neque ac tristique. Cras in`
      )
    })

    it('removes an added hunk', async () => {
      const filePath = 'modified-file.md'
      const diff = await getDiff(filePath)
      const hunkRange = findInteractiveDiffRange(diff.hunks, 16)
      const selection = DiffSelection.fromInitialSelection(
        DiffSelectionType.None
      ).withRangeSelection(
        hunkRange!.from,
        hunkRange!.to - hunkRange!.from + 1,
        true
      )

      const previousContents = await FSE.readFile(
        Path.join(repository.path, filePath),
        'utf8'
      )

      await discardChangesFromSelection(
        repository,
        filePath,
        await getDiff(filePath),
        selection
      )

      const fileContents = await FSE.readFile(
        Path.join(repository.path, filePath),
        'utf8'
      )

      assert.equal(
        getDifference(previousContents, fileContents),
        `@@ -20,4 +20,0 @@
-Aliquam leo ipsum, laoreet sed libero at, mollis pulvinar arcu. Nullam porttitor
-nisl eget hendrerit vestibulum. Curabitur ornare id neque ac tristique. Cras in
-eleifend mi.
-`
      )
    })
  })
})

/**
 * Returns a diff-style string with the line differences between two strings.
 */
function getDifference(before: string, after: string) {
  return structuredPatch(
    'before',
    'after',
    before.replace(/\r\n/g, '\n'),
    after.replace(/\r\n/g, '\n'),
    undefined,
    undefined,
    { context: 0 }
  )
    .hunks.flatMap(hunk => [
      `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`,
      ...hunk.lines,
    ])
    .join('\n')
}
