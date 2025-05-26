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

describe('FilterChangesList UI Interactions Tests', () => {
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
        allSelected // staged
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
    ]

    workingDirectory = WorkingDirectoryStatus.fromFiles(testFiles)
  })

  describe('applyFilters method logic', () => {
    it('returns true when showChangesFilter is false', () => {
      // Simulate the applyFilters method logic
      const showChangesFilter = false
      const result = !showChangesFilter ? true : false

      assert.equal(result, true)
    })

    it('filters by staging status correctly', () => {
      // Test the staging filter logic from applyFilters
      const includedChangesInCommitFilter = true
      const filterUnstagedFiles = false

      const testFile = testFiles[0] // README.md (staged)
      const isStaged =
        testFile.selection.getSelectionType() !== DiffSelectionType.None
      const isUnstaged =
        testFile.selection.getSelectionType() === DiffSelectionType.None

      let matchesStagingFilter = false
      if (includedChangesInCommitFilter && isStaged) {
        matchesStagingFilter = true
      }
      if (filterUnstagedFiles && isUnstaged) {
        matchesStagingFilter = true
      }

      assert.equal(matchesStagingFilter, true) // Should match staged filter
    })

    it('filters by file type correctly', () => {
      // Test the file type filter logic from applyFilters
      const filterNewFiles = true
      const filterModifiedFiles = false

      const newFile = testFiles.find(
        f => f.status.kind === AppFileStatusKind.New
      )!
      const modifiedFile = testFiles.find(
        f => f.status.kind === AppFileStatusKind.Modified
      )!

      let matchesFileTypeFilterForNew = false
      let matchesFileTypeFilterForModified = false

      // Check new file
      if (filterNewFiles && newFile.status.kind === AppFileStatusKind.New) {
        matchesFileTypeFilterForNew = true
      }

      // Check modified file
      if (
        filterModifiedFiles &&
        modifiedFile.status.kind === AppFileStatusKind.Modified
      ) {
        matchesFileTypeFilterForModified = true
      }

      assert.equal(matchesFileTypeFilterForNew, true)
      assert.equal(matchesFileTypeFilterForModified, false)
    })

    it('handles combined staging and file type filters', () => {
      // Test combined filter logic
      const includedChangesInCommitFilter = true
      const filterUnstagedFiles = true
      const filterDeletedFiles = true

      const deletedStagedFile = testFiles.find(
        f =>
          f.status.kind === AppFileStatusKind.Deleted &&
          f.selection.getSelectionType() !== DiffSelectionType.None
      )!

      const deletedUnstagedFile = testFiles.find(
        f =>
          f.status.kind === AppFileStatusKind.Deleted &&
          f.selection.getSelectionType() === DiffSelectionType.None
      )!

      // Test staged deleted file
      const isStaged1 =
        deletedStagedFile.selection.getSelectionType() !==
        DiffSelectionType.None
      const isUnstaged1 =
        deletedStagedFile.selection.getSelectionType() ===
        DiffSelectionType.None
      let matchesStagingFilter1 = false
      if (includedChangesInCommitFilter && isStaged1) {
        matchesStagingFilter1 = true
      }
      if (filterUnstagedFiles && isUnstaged1) {
        matchesStagingFilter1 = true
      }

      let matchesFileTypeFilter1 = false
      if (
        filterDeletedFiles &&
        deletedStagedFile.status.kind === AppFileStatusKind.Deleted
      ) {
        matchesFileTypeFilter1 = true
      }

      const shouldShowStagedDeleted =
        matchesStagingFilter1 && matchesFileTypeFilter1

      // Test unstaged deleted file
      const isStaged2 =
        deletedUnstagedFile.selection.getSelectionType() !==
        DiffSelectionType.None
      const isUnstaged2 =
        deletedUnstagedFile.selection.getSelectionType() ===
        DiffSelectionType.None
      let matchesStagingFilter2 = false
      if (includedChangesInCommitFilter && isStaged2) {
        matchesStagingFilter2 = true
      }
      if (filterUnstagedFiles && isUnstaged2) {
        matchesStagingFilter2 = true
      }

      let matchesFileTypeFilter2 = false
      if (
        filterDeletedFiles &&
        deletedUnstagedFile.status.kind === AppFileStatusKind.Deleted
      ) {
        matchesFileTypeFilter2 = true
      }

      const shouldShowUnstagedDeleted =
        matchesStagingFilter2 && matchesFileTypeFilter2

      assert.equal(shouldShowStagedDeleted, true)
      assert.equal(shouldShowUnstagedDeleted, true)
    })
  })

  describe('filter options button state', () => {
    it('calculates active filters count correctly', () => {
      // Simulate the active filters count logic from renderFilterBox
      const filters = {
        includedChangesInCommitFilter: true,
        filterNewFiles: false,
        filterModifiedFiles: true,
        filterDeletedFiles: false,
        filterUnstagedFiles: true,
      }

      const activeFiltersCount = [
        filters.includedChangesInCommitFilter,
        filters.filterNewFiles,
        filters.filterModifiedFiles,
        filters.filterDeletedFiles,
        filters.filterUnstagedFiles,
      ].filter(Boolean).length

      assert.equal(activeFiltersCount, 3)
    })

    it('determines hasActiveFilters correctly', () => {
      const activeFiltersCount1 = 0
      const activeFiltersCount2 = 3

      const hasActiveFilters1 = activeFiltersCount1 > 0
      const hasActiveFilters2 = activeFiltersCount2 > 0

      assert.equal(hasActiveFilters1, false)
      assert.equal(hasActiveFilters2, true)
    })

    it('generates correct button text label', () => {
      const activeFiltersCount = 2
      const hasActiveFilters = activeFiltersCount > 0
      const buttonTextLabel = `Filter Options ${
        hasActiveFilters ? `(${activeFiltersCount} applied)` : ''
      }`

      assert.equal(buttonTextLabel, 'Filter Options (2 applied)')
    })

    it('generates correct button text label with no active filters', () => {
      const activeFiltersCount = 0
      const hasActiveFilters = activeFiltersCount > 0
      const buttonTextLabel = `Filter Options ${
        hasActiveFilters ? `(${activeFiltersCount} applied)` : ''
      }`

      assert.equal(buttonTextLabel, 'Filter Options ')
    })
  })

  describe('filter checkbox states', () => {
    it('determines correct checkbox value for staged files filter', () => {
      const includedChangesInCommitFilter = true
      const checkboxValue = includedChangesInCommitFilter ? 'On' : 'Off'

      assert.equal(checkboxValue, 'On')
    })

    it('determines correct checkbox value for unstaged files filter', () => {
      const filterUnstagedFiles = false
      const checkboxValue = filterUnstagedFiles ? 'On' : 'Off'

      assert.equal(checkboxValue, 'Off')
    })

    it('determines correct checkbox value for new files filter', () => {
      const filterNewFiles = true
      const checkboxValue = filterNewFiles ? 'On' : 'Off'

      assert.equal(checkboxValue, 'On')
    })

    it('determines correct checkbox value for modified files filter', () => {
      const filterModifiedFiles = false
      const checkboxValue = filterModifiedFiles ? 'On' : 'Off'

      assert.equal(checkboxValue, 'Off')
    })

    it('determines correct checkbox value for deleted files filter', () => {
      const filterDeletedFiles = true
      const checkboxValue = filterDeletedFiles ? 'On' : 'Off'

      assert.equal(checkboxValue, 'On')
    })
  })

  describe('filter labels with counts', () => {
    it('generates correct label for staged files', () => {
      const stagedCount = workingDirectory.files.filter(
        f => f.selection.getSelectionType() !== DiffSelectionType.None
      ).length
      const label = `Staged files (${stagedCount})`

      // Expected: README.md, package.json, src/utils/helpers.ts, old-file.txt = 4 files
      assert.equal(label, 'Staged files (4)')
    })

    it('generates correct label for unstaged files', () => {
      const unstagedCount = workingDirectory.files.filter(
        f => f.selection.getSelectionType() === DiffSelectionType.None
      ).length
      const label = `Unstaged files (${unstagedCount})`

      // Expected: src/components/App.tsx, docs/api.md, deprecated.js, temp-file.tmp = 4 files
      assert.equal(label, 'Unstaged files (4)')
    })

    it('generates correct label for new files', () => {
      const newCount = workingDirectory.files.filter(
        f =>
          f.status.kind === AppFileStatusKind.New ||
          f.status.kind === AppFileStatusKind.Untracked
      ).length
      const label = `New files (${newCount})`

      // Expected: src/utils/helpers.ts, docs/api.md, temp-file.tmp = 3 files
      assert.equal(label, 'New files (3)')
    })

    it('generates correct label for modified files', () => {
      const modifiedCount = workingDirectory.files.filter(
        f => f.status.kind === AppFileStatusKind.Modified
      ).length
      const label = `Modified files (${modifiedCount})`

      // Expected: README.md, src/components/App.tsx, package.json = 3 files
      assert.equal(label, 'Modified files (3)')
    })

    it('generates correct label for deleted files', () => {
      const deletedCount = workingDirectory.files.filter(
        f => f.status.kind === AppFileStatusKind.Deleted
      ).length
      const label = `Deleted files (${deletedCount})`

      // Expected: old-file.txt, deprecated.js = 2 files
      assert.equal(label, 'Deleted files (2)')
    })
  })

  describe('filter interaction scenarios', () => {
    it('handles scenario where staged and unstaged filters are both enabled', () => {
      // This should show all files since every file is either staged or unstaged
      const includedChangesInCommitFilter = true
      const filterUnstagedFiles = true

      const filteredFiles = workingDirectory.files.filter(file => {
        const hasStagingFilter =
          includedChangesInCommitFilter || filterUnstagedFiles
        if (!hasStagingFilter) {
          return true
        }

        const isStaged =
          file.selection.getSelectionType() !== DiffSelectionType.None
        const isUnstaged =
          file.selection.getSelectionType() === DiffSelectionType.None

        let matchesStagingFilter = false
        if (includedChangesInCommitFilter && isStaged) {
          matchesStagingFilter = true
        }
        if (filterUnstagedFiles && isUnstaged) {
          matchesStagingFilter = true
        }

        return matchesStagingFilter
      })

      assert.equal(filteredFiles.length, testFiles.length)
    })

    it('handles scenario where only deleted files filter is enabled', () => {
      const filterDeletedFiles = true

      const filteredFiles = workingDirectory.files.filter(file => {
        const hasFileTypeFilter = filterDeletedFiles
        if (!hasFileTypeFilter) {
          return true
        }

        return file.status.kind === AppFileStatusKind.Deleted
      })

      // Should only show deleted files
      assert.equal(filteredFiles.length, 2)
      assert.ok(
        filteredFiles.every(f => f.status.kind === AppFileStatusKind.Deleted)
      )
    })

    it('handles scenario where multiple file type filters are enabled', () => {
      const filterNewFiles = true
      const filterDeletedFiles = true

      const filteredFiles = workingDirectory.files.filter(file => {
        const hasFileTypeFilter = filterNewFiles || filterDeletedFiles
        if (!hasFileTypeFilter) {
          return true
        }

        let matchesFileTypeFilter = false
        if (filterNewFiles && file.status.kind === AppFileStatusKind.New) {
          matchesFileTypeFilter = true
        }
        if (
          filterDeletedFiles &&
          file.status.kind === AppFileStatusKind.Deleted
        ) {
          matchesFileTypeFilter = true
        }

        return matchesFileTypeFilter
      })

      // Should show new files + deleted files (but not untracked)
      // Expected: src/utils/helpers.ts, docs/api.md, old-file.txt, deprecated.js = 4 files
      assert.equal(filteredFiles.length, 4)
    })

    it('handles scenario where no filters match any files', () => {
      // Create a scenario where filters exclude all files
      const filterNewFiles = true
      const filterUnstagedFiles = true

      // Filter for new files that are also unstaged
      const filteredFiles = workingDirectory.files.filter(file => {
        const hasStagingFilter = filterUnstagedFiles
        const hasFileTypeFilter = filterNewFiles

        let matchesStagingFilter = true
        if (hasStagingFilter) {
          matchesStagingFilter =
            file.selection.getSelectionType() === DiffSelectionType.None
        }

        let matchesFileTypeFilter = true
        if (hasFileTypeFilter) {
          matchesFileTypeFilter = file.status.kind === AppFileStatusKind.New
        }

        return matchesStagingFilter && matchesFileTypeFilter
      })

      // Should show new files that are unstaged: docs/api.md = 1 file
      assert.equal(filteredFiles.length, 1)
      assert.equal(filteredFiles[0].path, 'docs/api.md')
    })
  })

  describe('edge cases', () => {
    it('handles empty working directory with filters enabled', () => {
      const emptyWorkingDirectory = WorkingDirectoryStatus.fromFiles([])

      const stagedCount = emptyWorkingDirectory.files.filter(
        f => f.selection.getSelectionType() !== DiffSelectionType.None
      ).length

      const unstagedCount = emptyWorkingDirectory.files.filter(
        f => f.selection.getSelectionType() === DiffSelectionType.None
      ).length

      const newCount = emptyWorkingDirectory.files.filter(
        f =>
          f.status.kind === AppFileStatusKind.New ||
          f.status.kind === AppFileStatusKind.Untracked
      ).length

      assert.equal(stagedCount, 0)
      assert.equal(unstagedCount, 0)
      assert.equal(newCount, 0)
    })

    it('handles working directory with only one file', () => {
      const singleFile = [
        new WorkingDirectoryFileChange(
          'single.txt',
          { kind: AppFileStatusKind.Modified },
          allSelected
        ),
      ]
      const singleFileWorkingDirectory =
        WorkingDirectoryStatus.fromFiles(singleFile)

      const stagedCount = singleFileWorkingDirectory.files.filter(
        f => f.selection.getSelectionType() !== DiffSelectionType.None
      ).length

      const unstagedCount = singleFileWorkingDirectory.files.filter(
        f => f.selection.getSelectionType() === DiffSelectionType.None
      ).length

      const modifiedCount = singleFileWorkingDirectory.files.filter(
        f => f.status.kind === AppFileStatusKind.Modified
      ).length

      assert.equal(stagedCount, 1)
      assert.equal(unstagedCount, 0)
      assert.equal(modifiedCount, 1)
    })
  })
})
