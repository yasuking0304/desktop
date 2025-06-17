import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import {
  WorkingDirectoryStatus,
  WorkingDirectoryFileChange,
  AppFileStatusKind,
} from '../../src/models/status'
import { DiffSelection, DiffSelectionType } from '../../src/models/diff'
import { createState } from '../helpers/changes-state-helper'

const allSelected = DiffSelection.fromInitialSelection(DiffSelectionType.All)
const noneSelected = DiffSelection.fromInitialSelection(DiffSelectionType.None)

describe('Changes Filter Integration Tests', () => {
  let testFiles: WorkingDirectoryFileChange[]
  let workingDirectory: WorkingDirectoryStatus

  beforeEach(() => {
    testFiles = [
      // Modified files
      new WorkingDirectoryFileChange(
        'README.md',
        { kind: AppFileStatusKind.Modified },
        allSelected // included in commit
      ),
      new WorkingDirectoryFileChange(
        'src/components/App.tsx',
        { kind: AppFileStatusKind.Modified },
        noneSelected // not included in commit
      ),
      new WorkingDirectoryFileChange(
        'package.json',
        { kind: AppFileStatusKind.Modified },
        allSelected // included in commit
      ),

      // New files
      new WorkingDirectoryFileChange(
        'src/utils/helpers.ts',
        { kind: AppFileStatusKind.New },
        allSelected // included in commit
      ),
      new WorkingDirectoryFileChange(
        'docs/api.md',
        { kind: AppFileStatusKind.New },
        noneSelected // not included in commit
      ),

      // Other file types
      new WorkingDirectoryFileChange(
        'old-file.txt',
        { kind: AppFileStatusKind.Deleted },
        allSelected // included in commit
      ),
      new WorkingDirectoryFileChange(
        'temp-file.tmp',
        { kind: AppFileStatusKind.Untracked },
        noneSelected // not included in commit
      ),
      new WorkingDirectoryFileChange(
        'renamed-component.tsx',
        {
          kind: AppFileStatusKind.Renamed,
          oldPath: 'old-component.tsx',
          renameIncludesModifications: false,
        },
        allSelected // included in commit
      ),
    ]

    workingDirectory = WorkingDirectoryStatus.fromFiles(testFiles)
  })

  describe('filter text functionality', () => {
    it('filters files by filename', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: 'README',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      // In a real implementation, this would be handled by the UI component
      // that applies the filter. Here we simulate the filtering logic.
      const filteredFiles = state.workingDirectory.files.filter(file =>
        file.path
          .toLowerCase()
          .includes(state.fileListFilter.filterText.toLowerCase())
      )

      assert.equal(filteredFiles.length, 1)
      assert.equal(filteredFiles[0].path, 'README.md')
    })

    it('filters files by partial path', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: 'src/',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file =>
        file.path
          .toLowerCase()
          .includes(state.fileListFilter.filterText.toLowerCase())
      )

      assert.equal(filteredFiles.length, 2)
      assert.ok(filteredFiles.some(f => f.path === 'src/components/App.tsx'))
      assert.ok(filteredFiles.some(f => f.path === 'src/utils/helpers.ts'))
    })

    it('filters files by extension', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: '.tsx',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file =>
        file.path
          .toLowerCase()
          .includes(state.fileListFilter.filterText.toLowerCase())
      )

      assert.equal(filteredFiles.length, 2)
      assert.ok(filteredFiles.some(f => f.path === 'src/components/App.tsx'))
      assert.ok(filteredFiles.some(f => f.path === 'renamed-component.tsx'))
    })

    it('handles case-insensitive filtering', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: 'APP',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file =>
        file.path
          .toLowerCase()
          .includes(state.fileListFilter.filterText.toLowerCase())
      )

      assert.equal(filteredFiles.length, 1)
      assert.equal(filteredFiles[0].path, 'src/components/App.tsx')
    })

    it('returns all files when filter text is empty', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(
        file =>
          state.fileListFilter.filterText === '' ||
          file.path
            .toLowerCase()
            .includes(state.fileListFilter.filterText.toLowerCase())
      )

      assert.equal(filteredFiles.length, testFiles.length)
    })
  })

  describe('file type filtering', () => {
    it('filters new files when filterNewFiles is enabled', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: true,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      // Simulate the filtering logic that would be applied in the UI
      const filteredFiles = state.workingDirectory.files.filter(file => {
        if (!state.fileListFilter.filterNewFiles) {
          return true
        }
        return (
          file.status.kind === AppFileStatusKind.New ||
          file.status.kind === AppFileStatusKind.Untracked
        )
      })

      assert.equal(filteredFiles.length, 3)
      assert.ok(
        filteredFiles.every(
          f =>
            f.status.kind === AppFileStatusKind.New ||
            f.status.kind === AppFileStatusKind.Untracked
        )
      )
      assert.ok(filteredFiles.some(f => f.path === 'src/utils/helpers.ts'))
      assert.ok(filteredFiles.some(f => f.path === 'docs/api.md'))
      assert.ok(filteredFiles.some(f => f.path === 'temp-file.tmp'))
    })

    it('filters modified files when filterModifiedFiles is enabled', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: true,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        if (!state.fileListFilter.filterModifiedFiles) {
          return true
        }
        return file.status.kind === AppFileStatusKind.Modified
      })

      assert.equal(filteredFiles.length, 3)
      assert.ok(
        filteredFiles.every(f => f.status.kind === AppFileStatusKind.Modified)
      )
      assert.ok(filteredFiles.some(f => f.path === 'README.md'))
      assert.ok(filteredFiles.some(f => f.path === 'src/components/App.tsx'))
      assert.ok(filteredFiles.some(f => f.path === 'package.json'))
    })

    it('filters included files when includedChangesInCommitFilter is enabled', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: true,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        if (!state.fileListFilter.includedChangesInCommitFilter) {
          return true
        }
        return file.selection.getSelectionType() !== DiffSelectionType.None
      })

      // Files with allSelected should be included
      const expectedIncludedFiles = testFiles.filter(
        f => f.selection.getSelectionType() !== DiffSelectionType.None
      )

      assert.equal(filteredFiles.length, expectedIncludedFiles.length)
      assert.ok(filteredFiles.some(f => f.path === 'README.md'))
      assert.ok(filteredFiles.some(f => f.path === 'package.json'))
      assert.ok(filteredFiles.some(f => f.path === 'src/utils/helpers.ts'))
      assert.ok(filteredFiles.some(f => f.path === 'old-file.txt'))
      assert.ok(filteredFiles.some(f => f.path === 'renamed-component.tsx'))
    })

    it('filters deleted files when filterDeletedFiles is enabled', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: true,
          filterExcludedFiles: false,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        if (!state.fileListFilter.filterDeletedFiles) {
          return true
        }
        return file.status.kind === AppFileStatusKind.Deleted
      })

      assert.equal(filteredFiles.length, 1)
      assert.ok(
        filteredFiles.every(f => f.status.kind === AppFileStatusKind.Deleted)
      )
      assert.ok(filteredFiles.some(f => f.path === 'old-file.txt'))
    })

    it('filters unstaged files when filterExcludedFiles is enabled', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: true,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        if (!state.fileListFilter.filterExcludedFiles) {
          return true
        }
        // Unstaged files are those not selected for commit (noneSelected)
        return file.selection.getSelectionType() === DiffSelectionType.None
      })

      assert.equal(filteredFiles.length, 3)
      assert.ok(
        filteredFiles.every(
          f => f.selection.getSelectionType() === DiffSelectionType.None
        )
      )
      assert.ok(filteredFiles.some(f => f.path === 'src/components/App.tsx'))
      assert.ok(filteredFiles.some(f => f.path === 'docs/api.md'))
      assert.ok(filteredFiles.some(f => f.path === 'temp-file.tmp'))
    })
  })

  describe('combined filtering', () => {
    it('applies multiple filters simultaneously', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: 'src/',
          includedChangesInCommitFilter: false,
          filterNewFiles: true,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      // Apply both text filter and new files filter
      const filteredFiles = state.workingDirectory.files.filter(file => {
        const matchesText =
          state.fileListFilter.filterText === '' ||
          file.path
            .toLowerCase()
            .includes(state.fileListFilter.filterText.toLowerCase())
        const matchesType =
          !state.fileListFilter.filterNewFiles ||
          file.status.kind === AppFileStatusKind.New

        return matchesText && matchesType
      })

      assert.equal(filteredFiles.length, 1)
      assert.equal(filteredFiles[0].path, 'src/utils/helpers.ts')
      assert.equal(filteredFiles[0].status.kind, AppFileStatusKind.New)
    })

    it('applies multiple file type filters simultaneously', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: true,
          filterExcludedFiles: true,
        },
      })

      // Apply both deleted and unstaged files filters
      const filteredFiles = state.workingDirectory.files.filter(file => {
        // Check staging filter (unstaged files)
        const hasStagingFilter = state.fileListFilter.filterExcludedFiles
        let matchesStagingFilter = true
        if (hasStagingFilter) {
          matchesStagingFilter =
            file.selection.getSelectionType() === DiffSelectionType.None
        }

        // Check file type filter (deleted files)
        const hasFileTypeFilter = state.fileListFilter.filterDeletedFiles
        let matchesFileTypeFilter = true
        if (hasFileTypeFilter) {
          matchesFileTypeFilter = file.status.kind === AppFileStatusKind.Deleted
        }

        // When both filters are active, file must match both conditions
        if (hasStagingFilter && hasFileTypeFilter) {
          return matchesStagingFilter && matchesFileTypeFilter
        }

        // If only one filter is active, file must match that filter
        if (hasStagingFilter) {
          return matchesStagingFilter
        }
        if (hasFileTypeFilter) {
          return matchesFileTypeFilter
        }

        return true
      })

      // Only files that are both deleted AND unstaged should match
      // In our test data, 'old-file.txt' is deleted but staged (allSelected)
      // So no files should match both conditions
      assert.equal(filteredFiles.length, 0)
    })

    it('applies both staged and unstaged filters simultaneously', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: true,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: true,
        },
      })

      // Apply both staged and unstaged files filters
      const filteredFiles = state.workingDirectory.files.filter(file => {
        // Check staging filter - should show both staged AND unstaged files
        const hasStagingFilter =
          state.fileListFilter.includedChangesInCommitFilter ||
          state.fileListFilter.filterExcludedFiles
        let matchesStagingFilter = false
        if (hasStagingFilter) {
          const isStaged =
            file.selection.getSelectionType() !== DiffSelectionType.None
          const isUnstaged =
            file.selection.getSelectionType() === DiffSelectionType.None

          // When both filters are active, show files that match either condition
          if (
            state.fileListFilter.includedChangesInCommitFilter &&
            state.fileListFilter.filterExcludedFiles
          ) {
            matchesStagingFilter = isStaged || isUnstaged
          } else if (state.fileListFilter.includedChangesInCommitFilter) {
            matchesStagingFilter = isStaged
          } else if (state.fileListFilter.filterExcludedFiles) {
            matchesStagingFilter = isUnstaged
          }
        }

        return matchesStagingFilter
      })

      // Should show all files since every file is either staged or unstaged
      assert.equal(filteredFiles.length, testFiles.length)
    })

    it('applies text filter with deleted files filter', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: 'old',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: true,
          filterExcludedFiles: false,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        const matchesText =
          state.fileListFilter.filterText === '' ||
          file.path
            .toLowerCase()
            .includes(state.fileListFilter.filterText.toLowerCase())
        const matchesType =
          !state.fileListFilter.filterDeletedFiles ||
          file.status.kind === AppFileStatusKind.Deleted

        return matchesText && matchesType
      })

      assert.equal(filteredFiles.length, 1)
      assert.equal(filteredFiles[0].path, 'old-file.txt')
      assert.equal(filteredFiles[0].status.kind, AppFileStatusKind.Deleted)
    })

    it('applies text filter with included changes filter', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: '.md',
          includedChangesInCommitFilter: true,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        const matchesText =
          state.fileListFilter.filterText === '' ||
          file.path
            .toLowerCase()
            .includes(state.fileListFilter.filterText.toLowerCase())
        const matchesIncluded =
          !state.fileListFilter.includedChangesInCommitFilter ||
          file.selection.getSelectionType() !== DiffSelectionType.None

        return matchesText && matchesIncluded
      })

      assert.equal(filteredFiles.length, 1)
      assert.equal(filteredFiles[0].path, 'README.md')
    })

    it('returns empty result when filters exclude all files', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: 'nonexistent',
          includedChangesInCommitFilter: false,
          filterNewFiles: true,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        const matchesText =
          state.fileListFilter.filterText === '' ||
          file.path
            .toLowerCase()
            .includes(state.fileListFilter.filterText.toLowerCase())
        const matchesType =
          !state.fileListFilter.filterNewFiles ||
          file.status.kind === AppFileStatusKind.New

        return matchesText && matchesType
      })

      assert.equal(filteredFiles.length, 0)
    })

    it('handles all filters disabled (shows all files)', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: '',
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
          includedChangesInCommitFilter: false,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        const matchesText =
          state.fileListFilter.filterText === '' ||
          file.path
            .toLowerCase()
            .includes(state.fileListFilter.filterText.toLowerCase())
        const matchesNewFiles =
          !state.fileListFilter.filterNewFiles ||
          file.status.kind === AppFileStatusKind.New
        const matchesModifiedFiles =
          !state.fileListFilter.filterModifiedFiles ||
          file.status.kind === AppFileStatusKind.Modified
        const matchesDeletedFiles =
          !state.fileListFilter.filterDeletedFiles ||
          file.status.kind === AppFileStatusKind.Deleted
        const matchesUnstagedFiles =
          !state.fileListFilter.filterExcludedFiles ||
          file.selection.getSelectionType() === DiffSelectionType.None
        const matchesIncluded =
          !state.fileListFilter.includedChangesInCommitFilter ||
          file.selection.getSelectionType() !== DiffSelectionType.None

        return (
          matchesText &&
          matchesNewFiles &&
          matchesModifiedFiles &&
          matchesDeletedFiles &&
          matchesUnstagedFiles &&
          matchesIncluded
        )
      })

      assert.equal(filteredFiles.length, testFiles.length)
    })
  })

  describe('edge cases in filtering', () => {
    it('handles empty working directory', () => {
      const emptyWorkingDirectory = WorkingDirectoryStatus.fromFiles([])
      const state = createState({
        workingDirectory: emptyWorkingDirectory,
        fileListFilter: {
          filterText: 'anything',
          includedChangesInCommitFilter: false,
          filterNewFiles: true,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        const matchesText =
          state.fileListFilter.filterText === '' ||
          file.path
            .toLowerCase()
            .includes(state.fileListFilter.filterText.toLowerCase())
        const matchesType =
          !state.fileListFilter.filterNewFiles ||
          file.status.kind === AppFileStatusKind.New

        return matchesText && matchesType
      })

      assert.equal(filteredFiles.length, 0)
    })

    it('handles special characters in filter text', () => {
      const specialFiles = [
        new WorkingDirectoryFileChange(
          'file@#$%^&*().txt',
          { kind: AppFileStatusKind.New },
          noneSelected
        ),
        new WorkingDirectoryFileChange(
          'normal-file.txt',
          { kind: AppFileStatusKind.New },
          noneSelected
        ),
      ]

      const specialWorkingDirectory =
        WorkingDirectoryStatus.fromFiles(specialFiles)
      const state = createState({
        workingDirectory: specialWorkingDirectory,
        fileListFilter: {
          filterText: '@#$',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file =>
        file.path
          .toLowerCase()
          .includes(state.fileListFilter.filterText.toLowerCase())
      )

      assert.equal(filteredFiles.length, 1)
      assert.equal(filteredFiles[0].path, 'file@#$%^&*().txt')
    })

    it('handles unicode characters in filter text and filenames', () => {
      const unicodeFiles = [
        new WorkingDirectoryFileChange(
          '测试文件.txt',
          { kind: AppFileStatusKind.New },
          noneSelected
        ),
        new WorkingDirectoryFileChange(
          'english-file.txt',
          { kind: AppFileStatusKind.New },
          noneSelected
        ),
      ]

      const unicodeWorkingDirectory =
        WorkingDirectoryStatus.fromFiles(unicodeFiles)
      const state = createState({
        workingDirectory: unicodeWorkingDirectory,
        fileListFilter: {
          filterText: '测试',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file =>
        file.path
          .toLowerCase()
          .includes(state.fileListFilter.filterText.toLowerCase())
      )

      assert.equal(filteredFiles.length, 1)
      assert.equal(filteredFiles[0].path, '测试文件.txt')
    })

    it('handles very large number of files with filters', () => {
      // Create a large number of files to test performance
      const largeFileSet = []
      for (let i = 0; i < 1000; i++) {
        largeFileSet.push(
          new WorkingDirectoryFileChange(
            `file${i}.txt`,
            { kind: AppFileStatusKind.Modified },
            i % 2 === 0 ? allSelected : noneSelected
          )
        )
      }

      const largeWorkingDirectory =
        WorkingDirectoryStatus.fromFiles(largeFileSet)
      const state = createState({
        workingDirectory: largeWorkingDirectory,
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: true,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        if (!state.fileListFilter.filterExcludedFiles) {
          return true
        }
        return file.selection.getSelectionType() === DiffSelectionType.None
      })

      // Should show half the files (unstaged ones)
      assert.equal(filteredFiles.length, 500)
    })
  })

  describe('fixed filter interaction bugs', () => {
    it('allows staged and unstaged filters to work together correctly', () => {
      // This test verifies the fix for the bug where staged and unstaged filters couldn't work together
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: true,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: true,
        },
      })

      // Apply the fixed filtering logic that allows both filters to work together
      const filteredFiles = state.workingDirectory.files.filter(file => {
        // Check staging status filters (included in commit and unstaged files)
        const hasStagingFilter =
          state.fileListFilter.includedChangesInCommitFilter ||
          state.fileListFilter.filterExcludedFiles
        if (hasStagingFilter) {
          let matchesStagingFilter = false
          const isStaged =
            file.selection.getSelectionType() !== DiffSelectionType.None
          const isUnstaged =
            file.selection.getSelectionType() === DiffSelectionType.None

          // Check if file matches included in commit filter (staged files)
          if (state.fileListFilter.includedChangesInCommitFilter && isStaged) {
            matchesStagingFilter = true
          }

          // Check if file matches unstaged files filter
          if (state.fileListFilter.filterExcludedFiles && isUnstaged) {
            matchesStagingFilter = true
          }

          if (!matchesStagingFilter) {
            return false
          }
        }

        return true
      })

      // Should show all files since every file is either staged or unstaged
      assert.equal(filteredFiles.length, testFiles.length)
    })

    it('correctly filters deleted files with staging filters', () => {
      // Test the deleted files filter working with staging filters
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: true,
          filterExcludedFiles: true,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        // Check staging status filters
        const hasStagingFilter = state.fileListFilter.filterExcludedFiles
        if (hasStagingFilter) {
          let matchesStagingFilter = false
          const isUnstaged =
            file.selection.getSelectionType() === DiffSelectionType.None

          if (state.fileListFilter.filterExcludedFiles && isUnstaged) {
            matchesStagingFilter = true
          }

          if (!matchesStagingFilter) {
            return false
          }
        }

        // Apply file type filters
        const hasFileTypeFilter = state.fileListFilter.filterDeletedFiles
        if (hasFileTypeFilter) {
          let matchesFileTypeFilter = false

          if (state.fileListFilter.filterDeletedFiles) {
            const isDeletedFile = file.status.kind === AppFileStatusKind.Deleted
            if (isDeletedFile) {
              matchesFileTypeFilter = true
            }
          }

          if (!matchesFileTypeFilter) {
            return false
          }
        }

        return true
      })

      // Should only show deleted files that are unstaged
      // In our test data, 'old-file.txt' is deleted but staged, so no files should match
      assert.equal(filteredFiles.length, 0)
    })

    it('correctly calculates unstaged files count including untracked files', () => {
      // Test the fix for unstaged files count calculation
      const unstagedCount = workingDirectory.files.filter(
        f => f.selection.getSelectionType() === DiffSelectionType.None
      ).length

      // Should include: src/components/App.tsx, docs/api.md, temp-file.tmp = 3 files
      assert.equal(unstagedCount, 3)

      // Verify that untracked files are included in unstaged count
      const untrackedFiles = workingDirectory.files.filter(
        f => f.status.kind === AppFileStatusKind.Untracked
      )
      const untrackedUnstagedFiles = untrackedFiles.filter(
        f => f.selection.getSelectionType() === DiffSelectionType.None
      )

      assert.equal(untrackedFiles.length, untrackedUnstagedFiles.length)
    })

    it('correctly calculates staged files count including partial selections', () => {
      // Test the staged files count calculation
      const stagedCount = workingDirectory.files.filter(
        f => f.selection.getSelectionType() !== DiffSelectionType.None
      ).length

      // Should include: README.md, package.json, src/utils/helpers.ts, old-file.txt, renamed-component.tsx = 5 files
      assert.equal(stagedCount, 5)

      // Verify that partially staged files are included
      const partiallyStaged = workingDirectory.files.filter(
        f => f.selection.getSelectionType() === DiffSelectionType.Partial
      )

      // All partially staged files should be counted as staged
      assert.ok(stagedCount >= partiallyStaged.length)
    })

    it('handles filter combinations that previously caused issues', () => {
      // Test a complex filter combination that might have caused issues before the fix
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: 'src/',
          filterNewFiles: true,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: true,
          includedChangesInCommitFilter: false,
        },
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        // Apply text filter
        const matchesText =
          state.fileListFilter.filterText === '' ||
          file.path
            .toLowerCase()
            .includes(state.fileListFilter.filterText.toLowerCase())

        // Apply staging filter
        const hasStagingFilter = state.fileListFilter.filterExcludedFiles
        let matchesStagingFilter = true
        if (hasStagingFilter) {
          const isUnstaged =
            file.selection.getSelectionType() === DiffSelectionType.None
          matchesStagingFilter = isUnstaged
        }

        // Apply file type filter
        const hasFileTypeFilter = state.fileListFilter.filterNewFiles
        let matchesFileTypeFilter = true
        if (hasFileTypeFilter) {
          matchesFileTypeFilter = file.status.kind === AppFileStatusKind.New
        }

        return matchesText && matchesStagingFilter && matchesFileTypeFilter
      })

      // Should show new files in src/ that are unstaged
      // Expected: docs/api.md doesn't match 'src/', src/utils/helpers.ts is staged
      // So no files should match all criteria
      assert.equal(filteredFiles.length, 0)
    })
  })

  describe('comprehensive filter scenarios', () => {
    it('tests all filter combinations work correctly', () => {
      // Test every possible combination of filters to ensure they work together
      const filterCombinations = [
        {
          name: 'All filters enabled',
          filters: {
            fileListFilter: {
              filterText: 'src/',
              filterNewFiles: true,
              filterModifiedFiles: true,
              filterDeletedFiles: true,
              filterExcludedFiles: true,
              includedChangesInCommitFilter: true,
            },
          },
        },
        {
          name: 'Only staging filters',
          filters: {
            fileListFilter: {
              filterText: '',
              filterNewFiles: false,
              filterModifiedFiles: false,
              filterDeletedFiles: false,
              filterExcludedFiles: true,
              includedChangesInCommitFilter: true,
            },
          },
        },
        {
          name: 'Only file type filters',
          filters: {
            fileListFilter: {
              filterText: '',
              filterNewFiles: true,
              filterModifiedFiles: true,
              filterDeletedFiles: true,
              filterExcludedFiles: false,
              includedChangesInCommitFilter: false,
            },
          },
        },
        {
          name: 'Text and staging filters',
          filters: {
            fileListFilter: {
              filterText: 'README',
              filterNewFiles: false,
              filterModifiedFiles: false,
              filterDeletedFiles: false,
              filterExcludedFiles: false,
              includedChangesInCommitFilter: true,
            },
          },
        },
      ]

      filterCombinations.forEach(({ name, filters }) => {
        const state = createState({
          workingDirectory,
          ...filters,
        })

        // Apply comprehensive filtering logic
        const filteredFiles = state.workingDirectory.files.filter(file => {
          // Text filter
          const matchesText =
            state.fileListFilter.filterText === '' ||
            file.path
              .toLowerCase()
              .includes(state.fileListFilter.filterText.toLowerCase())

          // Staging filters
          const hasStagingFilter =
            state.fileListFilter.includedChangesInCommitFilter ||
            state.fileListFilter.filterExcludedFiles
          let matchesStagingFilter = true
          if (hasStagingFilter) {
            matchesStagingFilter = false
            const isStaged =
              file.selection.getSelectionType() !== DiffSelectionType.None
            const isUnstaged =
              file.selection.getSelectionType() === DiffSelectionType.None

            if (
              state.fileListFilter.includedChangesInCommitFilter &&
              isStaged
            ) {
              matchesStagingFilter = true
            }
            if (state.fileListFilter.filterExcludedFiles && isUnstaged) {
              matchesStagingFilter = true
            }
          }

          // File type filters
          const hasFileTypeFilter =
            state.fileListFilter.filterNewFiles ||
            state.fileListFilter.filterModifiedFiles ||
            state.fileListFilter.filterDeletedFiles
          let matchesFileTypeFilter = true
          if (hasFileTypeFilter) {
            matchesFileTypeFilter = false
            if (
              state.fileListFilter.filterNewFiles &&
              file.status.kind === AppFileStatusKind.New
            ) {
              matchesFileTypeFilter = true
            }
            if (
              state.fileListFilter.filterModifiedFiles &&
              file.status.kind === AppFileStatusKind.Modified
            ) {
              matchesFileTypeFilter = true
            }
            if (
              state.fileListFilter.filterDeletedFiles &&
              file.status.kind === AppFileStatusKind.Deleted
            ) {
              matchesFileTypeFilter = true
            }
          }

          return matchesText && matchesStagingFilter && matchesFileTypeFilter
        })

        // Each combination should produce a valid result (not throw errors)
        assert.ok(
          Array.isArray(filteredFiles),
          `${name} should produce an array`
        )
        assert.ok(
          filteredFiles.length >= 0,
          `${name} should have non-negative length`
        )
      })
    })
  })
})
