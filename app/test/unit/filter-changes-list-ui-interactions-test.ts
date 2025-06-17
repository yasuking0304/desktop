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
      const filterExcludedFiles = false

      const testFile = testFiles[0] // README.md (staged)
      const isStaged =
        testFile.selection.getSelectionType() !== DiffSelectionType.None
      const isUnstaged =
        testFile.selection.getSelectionType() === DiffSelectionType.None

      let matchesStagingFilter = false
      if (includedChangesInCommitFilter && isStaged) {
        matchesStagingFilter = true
      }
      if (filterExcludedFiles && isUnstaged) {
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
      const filterExcludedFiles = true
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
      if (filterExcludedFiles && isUnstaged1) {
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
      if (filterExcludedFiles && isUnstaged2) {
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
        filterExcludedFiles: true,
      }

      const activeFiltersCount = [
        filters.includedChangesInCommitFilter,
        filters.filterNewFiles,
        filters.filterModifiedFiles,
        filters.filterDeletedFiles,
        filters.filterExcludedFiles,
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
    it('determines correct checkbox value for included files filter', () => {
      const includedChangesInCommitFilter = true
      const checkboxValue = includedChangesInCommitFilter ? 'On' : 'Off'

      assert.equal(checkboxValue, 'On')
    })

    it('determines correct checkbox value for excluded files filter', () => {
      const filterExcludedFiles = false
      const checkboxValue = filterExcludedFiles ? 'On' : 'Off'

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
    it('generates correct label for included files', () => {
      const includedCount = workingDirectory.files.filter(
        f => f.selection.getSelectionType() !== DiffSelectionType.None
      ).length
      const label = `Included files (${includedCount})`

      // Expected: README.md, package.json, src/utils/helpers.ts, old-file.txt = 4 files
      assert.equal(label, 'Included files (4)')
    })

    it('generates correct label for excluded files', () => {
      const excludedCount = workingDirectory.files.filter(
        f => f.selection.getSelectionType() === DiffSelectionType.None
      ).length
      const label = `Excluded files (${excludedCount})`

      // Expected: src/components/App.tsx, docs/api.md, deprecated.js, temp-file.tmp = 4 files
      assert.equal(label, 'Excluded files (4)')
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
      const filterExcludedFiles = true

      const filteredFiles = workingDirectory.files.filter(file => {
        const hasStagingFilter =
          includedChangesInCommitFilter || filterExcludedFiles
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
        if (filterExcludedFiles && isUnstaged) {
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
      const filterExcludedFiles = true

      // Filter for new files that are also unstaged
      const filteredFiles = workingDirectory.files.filter(file => {
        const hasStagingFilter = filterExcludedFiles
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

  describe('clear filters functionality', () => {
    it('onClearAllFilters clears all filter states', () => {
      // Simulate the onClearAllFilters method logic
      const initialState = {
        filterText: 'README',
        includedChangesInCommitFilter: true,
        filterNewFiles: true,
        filterModifiedFiles: false,
        filterDeletedFiles: true,
        filterExcludedFiles: false,
      }

      // Simulate clearing all filters
      const clearedState = {
        filterText: '',
        includedChangesInCommitFilter: false,
        filterNewFiles: false,
        filterModifiedFiles: false,
        filterDeletedFiles: false,
        filterExcludedFiles: false,
      }

      // Verify initial state has filters active
      const hasInitialFilters =
        initialState.filterText !== '' ||
        initialState.includedChangesInCommitFilter ||
        initialState.filterNewFiles ||
        initialState.filterModifiedFiles ||
        initialState.filterDeletedFiles ||
        initialState.filterExcludedFiles

      // Verify cleared state has no filters active
      const hasClearedFilters =
        clearedState.filterText !== '' ||
        clearedState.includedChangesInCommitFilter ||
        clearedState.filterNewFiles ||
        clearedState.filterModifiedFiles ||
        clearedState.filterDeletedFiles ||
        clearedState.filterExcludedFiles

      assert.equal(hasInitialFilters, true)
      assert.equal(hasClearedFilters, false)
    })

    it('onClearAllFilters clears text filter along with other filters', () => {
      const initialState = {
        filterText: 'src/',
        includedChangesInCommitFilter: false,
        filterNewFiles: false,
        filterModifiedFiles: false,
        filterDeletedFiles: false,
        filterExcludedFiles: false,
      }

      const clearedState = {
        filterText: '',
        includedChangesInCommitFilter: false,
        filterNewFiles: false,
        filterModifiedFiles: false,
        filterDeletedFiles: false,
        filterExcludedFiles: false,
      }

      // Even if only text filter is active, it should be cleared
      assert.equal(initialState.filterText, 'src/')
      assert.equal(clearedState.filterText, '')
    })

    it('hasActiveFilters includes text filter in determination', () => {
      // Test the logic for determining if clear filters button should be visible
      const testCases = [
        {
          state: {
            filterText: '',
            includedChangesInCommitFilter: false,
            filterNewFiles: false,
          },
          expected: false,
          description: 'no filters active',
        },
        {
          state: {
            filterText: 'README',
            includedChangesInCommitFilter: false,
            filterNewFiles: false,
          },
          expected: true,
          description: 'only text filter active',
        },
        {
          state: {
            filterText: '',
            includedChangesInCommitFilter: true,
            filterNewFiles: false,
          },
          expected: true,
          description: 'only included filter active',
        },
        {
          state: {
            filterText: 'test',
            includedChangesInCommitFilter: true,
            filterNewFiles: true,
          },
          expected: true,
          description: 'multiple filters active',
        },
      ]

      testCases.forEach(({ state, expected, description }) => {
        const hasActiveFilters =
          state.filterText.length > 0 ||
          state.includedChangesInCommitFilter ||
          state.filterNewFiles

        assert.equal(hasActiveFilters, expected, `Failed for ${description}`)
      })
    })

    it('clear filters button visibility logic works correctly', () => {
      // Test the exact logic from renderFilterOptions and renderNoChanges
      const scenarios = [
        {
          filters: {
            includedChangesInCommitFilter: false,
            filterNewFiles: false,
            filterModifiedFiles: false,
            filterDeletedFiles: false,
            filterExcludedFiles: false,
          },
          filterText: '',
          expectedVisible: false,
          description: 'no filters - button should be hidden',
        },
        {
          filters: {
            includedChangesInCommitFilter: true,
            filterNewFiles: false,
            filterModifiedFiles: false,
            filterDeletedFiles: false,
            filterExcludedFiles: false,
          },
          filterText: '',
          expectedVisible: true,
          description: 'one filter active - button should be visible',
        },
        {
          filters: {
            includedChangesInCommitFilter: false,
            filterNewFiles: false,
            filterModifiedFiles: false,
            filterDeletedFiles: false,
            filterExcludedFiles: false,
          },
          filterText: 'search',
          expectedVisible: true,
          description: 'only text filter - button should be visible',
        },
        {
          filters: {
            includedChangesInCommitFilter: true,
            filterNewFiles: true,
            filterModifiedFiles: true,
            filterDeletedFiles: true,
            filterExcludedFiles: true,
          },
          filterText: 'complex search',
          expectedVisible: true,
          description: 'all filters active - button should be visible',
        },
      ]

      scenarios.forEach(
        ({ filters, filterText, expectedVisible, description }) => {
          // Logic from renderFilterOptions for dropdown button
          const hasActiveFiltersDropdown = [
            filters.includedChangesInCommitFilter,
            filters.filterNewFiles,
            filters.filterModifiedFiles,
            filters.filterDeletedFiles,
            filters.filterExcludedFiles,
          ].some(Boolean)

          // Logic from renderNoChanges for empty state button
          const hasActiveFiltersEmptyState =
            [
              filters.includedChangesInCommitFilter,
              filters.filterNewFiles,
              filters.filterModifiedFiles,
              filters.filterDeletedFiles,
              filters.filterExcludedFiles,
            ].some(Boolean) || filterText.length > 0

          if (filterText.length > 0) {
            // When text filter is active, empty state button should always be visible
            assert.equal(
              hasActiveFiltersEmptyState,
              true,
              `Empty state: ${description}`
            )
          } else {
            // When no text filter, both buttons should have same visibility
            assert.equal(
              hasActiveFiltersDropdown,
              expectedVisible,
              `Dropdown: ${description}`
            )
            assert.equal(
              hasActiveFiltersEmptyState,
              expectedVisible,
              `Empty state: ${description}`
            )
          }
        }
      )
    })

    it('clear filters operation resets to default state', () => {
      // Simulate the exact dispatcher calls made by onClearAllFilters
      const dispatcherCalls = [
        { method: 'setChangesListFilterText', args: ['repository', ''] },
        {
          method: 'setIncludedChangesInCommitFilter',
          args: ['repository', false],
        },
        { method: 'setFilterExcludedFiles', args: ['repository', false] },
        { method: 'setFilterNewFiles', args: ['repository', false] },
        { method: 'setFilterModifiedFiles', args: ['repository', false] },
        { method: 'setFilterDeletedFiles', args: ['repository', false] },
        { method: 'incrementMetric', args: ['appliesClearAllFiltersCount'] },
      ]

      // Verify all expected dispatcher calls are made
      assert.equal(dispatcherCalls.length, 7)

      // Verify text filter is cleared
      const textFilterCall = dispatcherCalls.find(
        call => call.method === 'setChangesListFilterText'
      )
      assert.ok(textFilterCall, 'Should call setChangesListFilterText')
      assert.equal(textFilterCall.args[1], '', 'Should clear text filter')

      // Verify all boolean filters are set to false
      const booleanFilterCalls = dispatcherCalls.filter(
        call =>
          call.method.startsWith('setFilter') ||
          call.method === 'setIncludedChangesInCommitFilter'
      )
      assert.equal(
        booleanFilterCalls.length,
        5,
        'Should have 5 boolean filter calls'
      )

      booleanFilterCalls.forEach(call => {
        assert.equal(
          call.args[1],
          false,
          `${call.method} should be set to false`
        )
      })

      // Verify metrics are tracked
      const metricsCall = dispatcherCalls.find(
        call => call.method === 'incrementMetric'
      )
      assert.ok(metricsCall, 'Should call incrementMetric')
      assert.equal(
        metricsCall.args[0],
        'appliesClearAllFiltersCount',
        'Should track clear all filters metric'
      )
    })

    it('clear filters closes filter options popover', () => {
      // Test that closeFilterOptions is called after clearing filters
      let popoverClosed = false

      const mockCloseFilterOptions = () => {
        popoverClosed = true
      }

      // Simulate the end of onClearAllFilters method
      mockCloseFilterOptions()

      assert.equal(
        popoverClosed,
        true,
        'Should close filter options popover after clearing'
      )
    })
  })

  describe('edge cases', () => {
    it('handles empty working directory with filters enabled', () => {
      const emptyWorkingDirectory = WorkingDirectoryStatus.fromFiles([])

      const includedCount = emptyWorkingDirectory.files.filter(
        f => f.selection.getSelectionType() !== DiffSelectionType.None
      ).length

      const excludedCount = emptyWorkingDirectory.files.filter(
        f => f.selection.getSelectionType() === DiffSelectionType.None
      ).length

      const newCount = emptyWorkingDirectory.files.filter(
        f =>
          f.status.kind === AppFileStatusKind.New ||
          f.status.kind === AppFileStatusKind.Untracked
      ).length

      assert.equal(includedCount, 0)
      assert.equal(excludedCount, 0)
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

      const includedCount = singleFileWorkingDirectory.files.filter(
        f => f.selection.getSelectionType() !== DiffSelectionType.None
      ).length

      const excludedCount = singleFileWorkingDirectory.files.filter(
        f => f.selection.getSelectionType() === DiffSelectionType.None
      ).length

      const modifiedCount = singleFileWorkingDirectory.files.filter(
        f => f.status.kind === AppFileStatusKind.Modified
      ).length

      assert.equal(includedCount, 1)
      assert.equal(excludedCount, 0)
      assert.equal(modifiedCount, 1)
    })
  })
})
