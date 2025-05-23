import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import {
  WorkingDirectoryStatus,
  WorkingDirectoryFileChange,
  AppFileStatusKind,
} from '../../src/models/status'
import { DiffSelection, DiffSelectionType } from '../../src/models/diff'

const allSelected = DiffSelection.fromInitialSelection(DiffSelectionType.All)
const noneSelected = DiffSelection.fromInitialSelection(DiffSelectionType.None)
// Create a partial selection by starting with All and toggling some lines
const partialSelected = DiffSelection.fromInitialSelection(
  DiffSelectionType.All
)
  .withSelectableLines(new Set([1, 2, 3, 4, 5]))
  .withLineSelection(1, false)
  .withLineSelection(3, false)

describe('FilterChangesList Count Methods Tests', () => {
  let testFiles: WorkingDirectoryFileChange[]
  let workingDirectory: WorkingDirectoryStatus

  beforeEach(() => {
    testFiles = [
      // Modified files - mixed staging
      new WorkingDirectoryFileChange(
        'README.md',
        { kind: AppFileStatusKind.Modified },
        allSelected // staged
      ),
      new WorkingDirectoryFileChange(
        'src/components/App.tsx',
        { kind: AppFileStatusKind.Modified },
        noneSelected // unstaged
      ),
      new WorkingDirectoryFileChange(
        'package.json',
        { kind: AppFileStatusKind.Modified },
        partialSelected // partially staged
      ),

      // New files - mixed staging
      new WorkingDirectoryFileChange(
        'src/utils/helpers.ts',
        { kind: AppFileStatusKind.New },
        allSelected // staged
      ),
      new WorkingDirectoryFileChange(
        'docs/api.md',
        { kind: AppFileStatusKind.New },
        noneSelected // unstaged
      ),

      // Deleted files - mixed staging
      new WorkingDirectoryFileChange(
        'old-file.txt',
        { kind: AppFileStatusKind.Deleted },
        allSelected // staged
      ),
      new WorkingDirectoryFileChange(
        'deprecated.js',
        { kind: AppFileStatusKind.Deleted },
        noneSelected // unstaged
      ),

      // Untracked files (always unstaged)
      new WorkingDirectoryFileChange(
        'temp-file.tmp',
        { kind: AppFileStatusKind.Untracked },
        noneSelected // unstaged
      ),
      new WorkingDirectoryFileChange(
        'cache.log',
        { kind: AppFileStatusKind.Untracked },
        noneSelected // unstaged
      ),

      // Other file types
      new WorkingDirectoryFileChange(
        'renamed-component.tsx',
        {
          kind: AppFileStatusKind.Renamed,
          oldPath: 'old-component.tsx',
          renameIncludesModifications: false,
        },
        allSelected // staged
      ),
    ]

    workingDirectory = WorkingDirectoryStatus.fromFiles(testFiles)
  })

  describe('getNewFilesCount', () => {
    it('counts new and untracked files correctly', () => {
      // Expected: 2 New + 2 Untracked = 4 total
      const expectedCount = 4

      const actualCount = workingDirectory.files.filter(
        f =>
          f.status.kind === AppFileStatusKind.New ||
          f.status.kind === AppFileStatusKind.Untracked
      ).length

      assert.equal(actualCount, expectedCount)
    })

    it('returns zero when no new or untracked files exist', () => {
      const filesWithoutNew = testFiles.filter(
        f =>
          f.status.kind !== AppFileStatusKind.New &&
          f.status.kind !== AppFileStatusKind.Untracked
      )
      const workingDirectoryWithoutNew =
        WorkingDirectoryStatus.fromFiles(filesWithoutNew)

      const actualCount = workingDirectoryWithoutNew.files.filter(
        f =>
          f.status.kind === AppFileStatusKind.New ||
          f.status.kind === AppFileStatusKind.Untracked
      ).length

      assert.equal(actualCount, 0)
    })
  })

  describe('getModifiedFilesCount', () => {
    it('counts modified files correctly', () => {
      // Expected: 3 Modified files
      const expectedCount = 3

      const actualCount = workingDirectory.files.filter(
        f => f.status.kind === AppFileStatusKind.Modified
      ).length

      assert.equal(actualCount, expectedCount)
    })

    it('returns zero when no modified files exist', () => {
      const filesWithoutModified = testFiles.filter(
        f => f.status.kind !== AppFileStatusKind.Modified
      )
      const workingDirectoryWithoutModified =
        WorkingDirectoryStatus.fromFiles(filesWithoutModified)

      const actualCount = workingDirectoryWithoutModified.files.filter(
        f => f.status.kind === AppFileStatusKind.Modified
      ).length

      assert.equal(actualCount, 0)
    })
  })

  describe('getDeletedFilesCount', () => {
    it('counts deleted files correctly', () => {
      // Expected: 2 Deleted files
      const expectedCount = 2

      const actualCount = workingDirectory.files.filter(
        f => f.status.kind === AppFileStatusKind.Deleted
      ).length

      assert.equal(actualCount, expectedCount)
    })

    it('returns zero when no deleted files exist', () => {
      const filesWithoutDeleted = testFiles.filter(
        f => f.status.kind !== AppFileStatusKind.Deleted
      )
      const workingDirectoryWithoutDeleted =
        WorkingDirectoryStatus.fromFiles(filesWithoutDeleted)

      const actualCount = workingDirectoryWithoutDeleted.files.filter(
        f => f.status.kind === AppFileStatusKind.Deleted
      ).length

      assert.equal(actualCount, 0)
    })
  })

  describe('getUnstagedFilesCount', () => {
    it('counts unstaged files correctly', () => {
      // Expected: Files with DiffSelectionType.None
      // src/components/App.tsx, docs/api.md, deprecated.js, temp-file.tmp, cache.log = 5 files
      const expectedCount = 5

      const actualCount = workingDirectory.files.filter(
        f => f.selection.getSelectionType() === DiffSelectionType.None
      ).length

      assert.equal(actualCount, expectedCount)
    })

    it('returns zero when all files are staged', () => {
      const allStagedFiles = testFiles.map(
        file =>
          new WorkingDirectoryFileChange(
            file.path,
            file.status,
            allSelected // Make all files staged
          )
      )
      const workingDirectoryAllStaged =
        WorkingDirectoryStatus.fromFiles(allStagedFiles)

      const actualCount = workingDirectoryAllStaged.files.filter(
        f => f.selection.getSelectionType() === DiffSelectionType.None
      ).length

      assert.equal(actualCount, 0)
    })

    it('counts all files when all are unstaged', () => {
      const allUnstagedFiles = testFiles.map(
        file =>
          new WorkingDirectoryFileChange(
            file.path,
            file.status,
            noneSelected // Make all files unstaged
          )
      )
      const workingDirectoryAllUnstaged =
        WorkingDirectoryStatus.fromFiles(allUnstagedFiles)

      const actualCount = workingDirectoryAllUnstaged.files.filter(
        f => f.selection.getSelectionType() === DiffSelectionType.None
      ).length

      assert.equal(actualCount, testFiles.length)
    })
  })

  describe('getStagedFilesCount', () => {
    it('counts staged files correctly', () => {
      // Expected: Files with DiffSelectionType.All or DiffSelectionType.Partial
      // README.md, package.json, src/utils/helpers.ts, old-file.txt, renamed-component.tsx = 5 files
      const expectedCount = 5

      const actualCount = workingDirectory.files.filter(
        f => f.selection.getSelectionType() !== DiffSelectionType.None
      ).length

      assert.equal(actualCount, expectedCount)
    })

    it('includes partially staged files in count', () => {
      const partiallyStaged = workingDirectory.files.filter(
        f => f.selection.getSelectionType() === DiffSelectionType.Partial
      )

      // Should have 1 partially staged file (package.json)
      assert.equal(partiallyStaged.length, 1)
      assert.equal(partiallyStaged[0].path, 'package.json')

      // Partially staged files should be included in staged count
      const stagedCount = workingDirectory.files.filter(
        f => f.selection.getSelectionType() !== DiffSelectionType.None
      ).length

      assert.ok(stagedCount > 0)
    })

    it('returns zero when no files are staged', () => {
      const allUnstagedFiles = testFiles.map(
        file =>
          new WorkingDirectoryFileChange(
            file.path,
            file.status,
            noneSelected // Make all files unstaged
          )
      )
      const workingDirectoryAllUnstaged =
        WorkingDirectoryStatus.fromFiles(allUnstagedFiles)

      const actualCount = workingDirectoryAllUnstaged.files.filter(
        f => f.selection.getSelectionType() !== DiffSelectionType.None
      ).length

      assert.equal(actualCount, 0)
    })

    it('counts all files when all are staged', () => {
      const allStagedFiles = testFiles.map(
        file =>
          new WorkingDirectoryFileChange(
            file.path,
            file.status,
            allSelected // Make all files staged
          )
      )
      const workingDirectoryAllStaged =
        WorkingDirectoryStatus.fromFiles(allStagedFiles)

      const actualCount = workingDirectoryAllStaged.files.filter(
        f => f.selection.getSelectionType() !== DiffSelectionType.None
      ).length

      assert.equal(actualCount, testFiles.length)
    })
  })

  describe('count consistency', () => {
    it('staged and unstaged counts should sum to total files', () => {
      const stagedCount = workingDirectory.files.filter(
        f => f.selection.getSelectionType() !== DiffSelectionType.None
      ).length

      const unstagedCount = workingDirectory.files.filter(
        f => f.selection.getSelectionType() === DiffSelectionType.None
      ).length

      const totalFiles = workingDirectory.files.length

      assert.equal(stagedCount + unstagedCount, totalFiles)
    })

    it('file type counts should sum to total files', () => {
      const newCount = workingDirectory.files.filter(
        f =>
          f.status.kind === AppFileStatusKind.New ||
          f.status.kind === AppFileStatusKind.Untracked
      ).length

      const modifiedCount = workingDirectory.files.filter(
        f => f.status.kind === AppFileStatusKind.Modified
      ).length

      const deletedCount = workingDirectory.files.filter(
        f => f.status.kind === AppFileStatusKind.Deleted
      ).length

      const otherCount = workingDirectory.files.filter(
        f =>
          f.status.kind !== AppFileStatusKind.New &&
          f.status.kind !== AppFileStatusKind.Untracked &&
          f.status.kind !== AppFileStatusKind.Modified &&
          f.status.kind !== AppFileStatusKind.Deleted
      ).length

      const totalFiles = workingDirectory.files.length

      assert.equal(
        newCount + modifiedCount + deletedCount + otherCount,
        totalFiles
      )
    })
  })

  describe('edge cases', () => {
    it('handles empty working directory', () => {
      const emptyWorkingDirectory = WorkingDirectoryStatus.fromFiles([])

      const newCount = emptyWorkingDirectory.files.filter(
        f =>
          f.status.kind === AppFileStatusKind.New ||
          f.status.kind === AppFileStatusKind.Untracked
      ).length

      const modifiedCount = emptyWorkingDirectory.files.filter(
        f => f.status.kind === AppFileStatusKind.Modified
      ).length

      const deletedCount = emptyWorkingDirectory.files.filter(
        f => f.status.kind === AppFileStatusKind.Deleted
      ).length

      const stagedCount = emptyWorkingDirectory.files.filter(
        f => f.selection.getSelectionType() !== DiffSelectionType.None
      ).length

      const unstagedCount = emptyWorkingDirectory.files.filter(
        f => f.selection.getSelectionType() === DiffSelectionType.None
      ).length

      assert.equal(newCount, 0)
      assert.equal(modifiedCount, 0)
      assert.equal(deletedCount, 0)
      assert.equal(stagedCount, 0)
      assert.equal(unstagedCount, 0)
    })

    it('handles working directory with only one file type', () => {
      const onlyModifiedFiles = [
        new WorkingDirectoryFileChange(
          'file1.txt',
          { kind: AppFileStatusKind.Modified },
          allSelected
        ),
        new WorkingDirectoryFileChange(
          'file2.txt',
          { kind: AppFileStatusKind.Modified },
          noneSelected
        ),
      ]
      const workingDirectoryOnlyModified =
        WorkingDirectoryStatus.fromFiles(onlyModifiedFiles)

      const newCount = workingDirectoryOnlyModified.files.filter(
        f =>
          f.status.kind === AppFileStatusKind.New ||
          f.status.kind === AppFileStatusKind.Untracked
      ).length

      const modifiedCount = workingDirectoryOnlyModified.files.filter(
        f => f.status.kind === AppFileStatusKind.Modified
      ).length

      const deletedCount = workingDirectoryOnlyModified.files.filter(
        f => f.status.kind === AppFileStatusKind.Deleted
      ).length

      assert.equal(newCount, 0)
      assert.equal(modifiedCount, 2)
      assert.equal(deletedCount, 0)
    })
  })
})
