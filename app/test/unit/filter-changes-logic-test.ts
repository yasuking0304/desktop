import { describe, it } from 'node:test'
import assert from 'node:assert'
import { AppFileStatusKind } from '../../src/models/status'
import { DiffSelectionType } from '../../src/models/diff'
import {
  WorkingDirectoryFileChange,
  WorkingDirectoryStatus,
} from '../../src/models/status'
import { DiffSelection } from '../../src/models/diff'
import { CheckboxValue } from '../../src/ui/lib/checkbox'
import {
  applyFilters,
  isCommittingFileHiddenByFilter,
  getNewFilesCount,
  getModifiedFilesCount,
  getDeletedFilesCount,
  getExcludedFilesCount,
  getIncludedFilesCount,
  getCheckBoxValueFromIncludeAll,
  getCheckAllValue,
  getNoResultsMessage,
  hasActiveFilters,
  countActiveFilters,
  IFileFilterState,
  IChangesListItem,
} from '../../src/ui/changes/filter-changes-logic'

// Helper function to create a test file
function createTestFile(
  path: string,
  status: AppFileStatusKind,
  selectionType: DiffSelectionType
): WorkingDirectoryFileChange {
  const selection = selectionType === DiffSelectionType.Partial
    ? DiffSelection.fromInitialSelection(DiffSelectionType.All).withLineSelection(0, false)
    : DiffSelection.fromInitialSelection(selectionType as DiffSelectionType.All | DiffSelectionType.None)
  return {
    id: path,
    path,
    status: { kind: status },
    selection,
  } as WorkingDirectoryFileChange
}

// Helper function to create a test changes list item
function createTestItem(
  path: string,
  status: AppFileStatusKind,
  selectionType: DiffSelectionType
): IChangesListItem {
  const change = createTestFile(path, status, selectionType)
  return {
    id: path,
    text: [path],
    change,
  }
}

describe('filter-changes-logic', () => {
  describe('applyFilters', () => {
    describe('when no filters are active', () => {
      it('should show all files', () => {
        const filters: IFileFilterState = {
          includedChangesInCommitFilter: false,
          filterExcludedFiles: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
        }

        const newFile = createTestItem(
          'new.txt',
          AppFileStatusKind.New,
          DiffSelectionType.All
        )
        const modifiedFile = createTestItem(
          'modified.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        )
        const deletedFile = createTestItem(
          'deleted.txt',
          AppFileStatusKind.Deleted,
          DiffSelectionType.All
        )

        assert.equal(applyFilters(newFile, filters), true)
        assert.equal(applyFilters(modifiedFile, filters), true)
        assert.equal(applyFilters(deletedFile, filters), true)
      })
    })

    describe('when using AND logic', () => {
      it('should show files matching ALL active filters', () => {
        const filters: IFileFilterState = {
          includedChangesInCommitFilter: true,
          filterExcludedFiles: false,
          filterNewFiles: true,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
        }

        // Staged new file - matches both filters
        const stagedNewFile = createTestItem(
          'staged-new.txt',
          AppFileStatusKind.New,
          DiffSelectionType.All
        )
        // Unstaged new file - doesn't match included filter
        const unstagedNewFile = createTestItem(
          'unstaged-new.txt',
          AppFileStatusKind.New,
          DiffSelectionType.None
        )
        // Staged modified file - doesn't match new file filter
        const stagedModifiedFile = createTestItem(
          'staged-modified.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        )

        assert.equal(applyFilters(stagedNewFile, filters), true)
        assert.equal(applyFilters(unstagedNewFile, filters), false)
        assert.equal(applyFilters(stagedModifiedFile, filters), false)
      })

      it('should handle conflicting filters correctly', () => {
        const filters: IFileFilterState = {
          includedChangesInCommitFilter: true,
          filterExcludedFiles: true, // Both can't be true at same time
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
        }

        const stagedFile = createTestItem(
          'staged.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        )
        const unstagedFile = createTestItem(
          'unstaged.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.None
        )

        // No file can be both staged and unstaged
        assert.equal(applyFilters(stagedFile, filters), false)
        assert.equal(applyFilters(unstagedFile, filters), false)
      })
    })
  })

  describe('isCommittingFileHiddenByFilter', () => {
    it('should return false when no filters are active', () => {
      const filters: IFileFilterState = {
        includedChangesInCommitFilter: false,
        filterExcludedFiles: false,
        filterNewFiles: false,
        filterModifiedFiles: false,
        filterDeletedFiles: false,
      }

      const fileIds = ['file1', 'file2']
      const filteredItems = new Map([
        ['file1', {} as IChangesListItem],
        ['file2', {} as IChangesListItem],
      ])

      assert.equal(
        isCommittingFileHiddenByFilter('', fileIds, filteredItems, 2, filters),
        false
      )
    })

    it('should return true when committing files not in filtered list', () => {
      const filters: IFileFilterState = {
        includedChangesInCommitFilter: true,
        filterExcludedFiles: false,
        filterNewFiles: false,
        filterModifiedFiles: false,
        filterDeletedFiles: false,
      }

      const fileIds = ['file1', 'file2', 'file3']
      const filteredItems = new Map([
        ['file1', {} as IChangesListItem],
        ['file2', {} as IChangesListItem],
      ])

      assert.equal(
        isCommittingFileHiddenByFilter('', fileIds, filteredItems, 5, filters),
        true
      )
    })
  })

  describe('count functions', () => {
    const createWorkingDirectory = (
      files: ReadonlyArray<WorkingDirectoryFileChange>
    ): WorkingDirectoryStatus => {
      return {
        files,
        includeAll: true,
      } as WorkingDirectoryStatus
    }

    it('should count new files correctly', () => {
      const files = [
        createTestFile(
          'new1.txt',
          AppFileStatusKind.New,
          DiffSelectionType.All
        ),
        createTestFile(
          'new2.txt',
          AppFileStatusKind.Untracked,
          DiffSelectionType.All
        ),
        createTestFile(
          'modified.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        ),
      ]
      const wd = createWorkingDirectory(files)
      assert.equal(getNewFilesCount(wd), 2)
    })

    it('should count modified files correctly', () => {
      const files = [
        createTestFile('new.txt', AppFileStatusKind.New, DiffSelectionType.All),
        createTestFile(
          'modified1.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        ),
        createTestFile(
          'modified2.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        ),
      ]
      const wd = createWorkingDirectory(files)
      assert.equal(getModifiedFilesCount(wd), 2)
    })

    it('should count deleted files correctly', () => {
      const files = [
        createTestFile(
          'deleted1.txt',
          AppFileStatusKind.Deleted,
          DiffSelectionType.All
        ),
        createTestFile(
          'modified.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        ),
        createTestFile(
          'deleted2.txt',
          AppFileStatusKind.Deleted,
          DiffSelectionType.All
        ),
      ]
      const wd = createWorkingDirectory(files)
      assert.equal(getDeletedFilesCount(wd), 2)
    })

    it('should count excluded files correctly', () => {
      const files = [
        createTestFile(
          'included.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        ),
        createTestFile(
          'excluded1.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.None
        ),
        createTestFile(
          'excluded2.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.None
        ),
      ]
      const wd = createWorkingDirectory(files)
      assert.equal(getExcludedFilesCount(wd), 2)
    })

    it('should count included files correctly', () => {
      const files = [
        createTestFile(
          'included1.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        ),
        createTestFile(
          'included2.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.Partial
        ),
        createTestFile(
          'excluded.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.None
        ),
      ]
      const wd = createWorkingDirectory(files)
      assert.equal(getIncludedFilesCount(wd), 2)
    })
  })

  describe('getCheckBoxValueFromIncludeAll', () => {
    it('should return On for true', () => {
      assert.equal(getCheckBoxValueFromIncludeAll(true), CheckboxValue.On)
    })

    it('should return Off for false', () => {
      assert.equal(getCheckBoxValueFromIncludeAll(false), CheckboxValue.Off)
    })

    it('should return Mixed for null', () => {
      assert.equal(getCheckBoxValueFromIncludeAll(null), CheckboxValue.Mixed)
    })
  })

  describe('getCheckAllValue', () => {
    it('should return working directory includeAll value when all files visible', () => {
      const files = [
        createTestFile(
          'file1.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        ),
        createTestFile(
          'file2.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        ),
      ]
      const wd = WorkingDirectoryStatus.fromFiles(files)

      const filteredItems = new Map([
        ['file1.txt', {} as IChangesListItem],
        ['file2.txt', {} as IChangesListItem],
      ])

      assert.equal(getCheckAllValue(wd, null, filteredItems), CheckboxValue.On)
    })

    it('should return Off when no files match filter', () => {
      const files = [
        createTestFile(
          'file1.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        ),
        createTestFile(
          'file2.txt',
          AppFileStatusKind.Modified,
          DiffSelectionType.All
        ),
      ]
      const wd = WorkingDirectoryStatus.fromFiles(files)

      const filteredItems = new Map<string, IChangesListItem>()

      assert.equal(getCheckAllValue(wd, null, filteredItems), CheckboxValue.Off)
    })
  })

  describe('getNoResultsMessage', () => {
    it('should return undefined when no filters active', () => {
      const filters: IFileFilterState = {
        includedChangesInCommitFilter: false,
        filterExcludedFiles: false,
        filterNewFiles: false,
        filterModifiedFiles: false,
        filterDeletedFiles: false,
      }

      assert.equal(getNoResultsMessage('', filters), undefined)
    })

    it('should return message with text filter', () => {
      const filters: IFileFilterState = {
        includedChangesInCommitFilter: false,
        filterExcludedFiles: false,
        filterNewFiles: false,
        filterModifiedFiles: false,
        filterDeletedFiles: false,
      }

      const message = getNoResultsMessage('test', filters)
      assert(message?.includes('"test"'))
    })

    it('should return message with multiple filters', () => {
      const filters: IFileFilterState = {
        includedChangesInCommitFilter: true,
        filterExcludedFiles: false,
        filterNewFiles: true,
        filterModifiedFiles: false,
        filterDeletedFiles: false,
      }

      const message = getNoResultsMessage('', filters)
      assert(message?.includes('Included in commit'))
      assert(message?.includes('New files'))
    })
  })

  describe('hasActiveFilters', () => {
    it('should return false when no filters active', () => {
      const filters: IFileFilterState = {
        includedChangesInCommitFilter: false,
        filterExcludedFiles: false,
        filterNewFiles: false,
        filterModifiedFiles: false,
        filterDeletedFiles: false,
      }

      assert.equal(hasActiveFilters('', filters), false)
    })

    it('should return true when text filter active', () => {
      const filters: IFileFilterState = {
        includedChangesInCommitFilter: false,
        filterExcludedFiles: false,
        filterNewFiles: false,
        filterModifiedFiles: false,
        filterDeletedFiles: false,
      }

      assert.equal(hasActiveFilters('test', filters), true)
    })

    it('should return true when any filter active', () => {
      const filters: IFileFilterState = {
        includedChangesInCommitFilter: true,
        filterExcludedFiles: false,
        filterNewFiles: false,
        filterModifiedFiles: false,
        filterDeletedFiles: false,
      }

      assert.equal(hasActiveFilters('', filters), true)
    })
  })

  describe('countActiveFilters', () => {
    it('should return 0 when no filters active', () => {
      const filters: IFileFilterState = {
        includedChangesInCommitFilter: false,
        filterExcludedFiles: false,
        filterNewFiles: false,
        filterModifiedFiles: false,
        filterDeletedFiles: false,
      }

      assert.equal(countActiveFilters(filters), 0)
    })

    it('should count active filters correctly', () => {
      const filters: IFileFilterState = {
        includedChangesInCommitFilter: true,
        filterExcludedFiles: false,
        filterNewFiles: true,
        filterModifiedFiles: true,
        filterDeletedFiles: false,
      }

      assert.equal(countActiveFilters(filters), 3)
    })
  })
})
