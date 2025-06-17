import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import {
  WorkingDirectoryStatus,
  WorkingDirectoryFileChange,
  AppFileStatusKind,
} from '../../src/models/status'
import { DiffSelection, DiffSelectionType } from '../../src/models/diff'
import { createState } from '../helpers/changes-state-helper'
import { ChangesSelectionKind } from '../../src/lib/app-state'

const allSelected = DiffSelection.fromInitialSelection(DiffSelectionType.All)
const noneSelected = DiffSelection.fromInitialSelection(DiffSelectionType.None)

describe('Changes Filter Functionality', () => {
  let testFiles: WorkingDirectoryFileChange[]
  let workingDirectory: WorkingDirectoryStatus

  beforeEach(() => {
    testFiles = [
      new WorkingDirectoryFileChange(
        'README.md',
        { kind: AppFileStatusKind.Modified },
        allSelected
      ),
      new WorkingDirectoryFileChange(
        'new-feature.ts',
        { kind: AppFileStatusKind.New },
        noneSelected
      ),
      new WorkingDirectoryFileChange(
        'package.json',
        { kind: AppFileStatusKind.Modified },
        allSelected
      ),
      new WorkingDirectoryFileChange(
        'untracked-file.txt',
        { kind: AppFileStatusKind.Untracked },
        noneSelected
      ),
      new WorkingDirectoryFileChange(
        'deleted-file.md',
        { kind: AppFileStatusKind.Deleted },
        allSelected
      ),
    ]

    workingDirectory = WorkingDirectoryStatus.fromFiles(testFiles)
  })

  describe('fileListFilter.filterNewFiles', () => {
    it('initializes with default value false', () => {
      const state = createState({})
      assert.equal(state.fileListFilter.filterNewFiles, false)
    })

    it('can be set to true', () => {
      const state = createState({
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: true,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })
      assert.equal(state.fileListFilter.filterNewFiles, true)
    })

    it('can be set to false explicitly', () => {
      const state = createState({
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })
      assert.equal(state.fileListFilter.filterNewFiles, false)
    })
  })

  describe('fileListFilter.filterModifiedFiles', () => {
    it('initializes with default value false', () => {
      const state = createState({})
      assert.equal(state.fileListFilter.filterModifiedFiles, false)
    })

    it('can be set to true', () => {
      const state = createState({
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: true,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })
      assert.equal(state.fileListFilter.filterModifiedFiles, true)
    })

    it('can be set to false explicitly', () => {
      const state = createState({
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })
      assert.equal(state.fileListFilter.filterModifiedFiles, false)
    })
  })

  describe('fileListFilter.filterDeletedFiles', () => {
    it('initializes with default value false', () => {
      const state = createState({})
      assert.equal(state.fileListFilter.filterDeletedFiles, false)
    })

    it('can be set to true', () => {
      const state = createState({
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: true,
          filterExcludedFiles: false,
        },
      })
      assert.equal(state.fileListFilter.filterDeletedFiles, true)
    })

    it('can be set to false explicitly', () => {
      const state = createState({
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })
      assert.equal(state.fileListFilter.filterDeletedFiles, false)
    })
  })

  describe('fileListFilter.filterExcludedFiles', () => {
    it('initializes with default value false', () => {
      const state = createState({})
      assert.equal(state.fileListFilter.filterExcludedFiles, false)
    })

    it('can be set to true', () => {
      const state = createState({
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: true,
        },
      })
      assert.equal(state.fileListFilter.filterExcludedFiles, true)
    })

    it('can be set to false explicitly', () => {
      const state = createState({
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })
      assert.equal(state.fileListFilter.filterExcludedFiles, false)
    })
  })

  describe('fileListFilter.includedChangesInCommitFilter', () => {
    it('initializes with default value false', () => {
      const state = createState({})
      assert.equal(state.fileListFilter.includedChangesInCommitFilter, false)
    })

    it('can be set to true', () => {
      const state = createState({
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: true,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })
      assert.equal(state.fileListFilter.includedChangesInCommitFilter, true)
    })

    it('can be set to false explicitly', () => {
      const state = createState({
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })
      assert.equal(state.fileListFilter.includedChangesInCommitFilter, false)
    })
  })

  describe('fileListFilter.filterText', () => {
    it('initializes with empty string', () => {
      const state = createState({})
      assert.equal(state.fileListFilter.filterText, '')
    })

    it('can be set to a filter string', () => {
      const filterText = 'README'
      const state = createState({
        fileListFilter: {
          filterText,
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })
      assert.equal(state.fileListFilter.filterText, filterText)
    })

    it('can be set to empty string explicitly', () => {
      const state = createState({
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })
      assert.equal(state.fileListFilter.filterText, '')
    })
  })

  describe('combined filter states', () => {
    it('can have multiple filters enabled simultaneously', () => {
      const state = createState({
        fileListFilter: {
          filterText: 'test',
          filterNewFiles: true,
          filterModifiedFiles: true,
          filterDeletedFiles: true,
          filterExcludedFiles: true,
          includedChangesInCommitFilter: true,
        },
      })

      assert.equal(state.fileListFilter.filterNewFiles, true)
      assert.equal(state.fileListFilter.filterModifiedFiles, true)
      assert.equal(state.fileListFilter.filterDeletedFiles, true)
      assert.equal(state.fileListFilter.filterExcludedFiles, true)
      assert.equal(state.fileListFilter.includedChangesInCommitFilter, true)
      assert.equal(state.fileListFilter.filterText, 'test')
    })

    it('can have mixed filter states', () => {
      const state = createState({
        fileListFilter: {
          filterText: 'feature',
          filterNewFiles: true,
          filterModifiedFiles: false,
          filterDeletedFiles: true,
          filterExcludedFiles: false,
          includedChangesInCommitFilter: true,
        },
      })

      assert.equal(state.fileListFilter.filterNewFiles, true)
      assert.equal(state.fileListFilter.filterModifiedFiles, false)
      assert.equal(state.fileListFilter.filterDeletedFiles, true)
      assert.equal(state.fileListFilter.filterExcludedFiles, false)
      assert.equal(state.fileListFilter.includedChangesInCommitFilter, true)
      assert.equal(state.fileListFilter.filterText, 'feature')
    })

    it('can disable all filters', () => {
      const state = createState({
        fileListFilter: {
          filterText: '',
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
          includedChangesInCommitFilter: false,
        },
      })

      assert.equal(state.fileListFilter.filterNewFiles, false)
      assert.equal(state.fileListFilter.filterModifiedFiles, false)
      assert.equal(state.fileListFilter.filterDeletedFiles, false)
      assert.equal(state.fileListFilter.filterExcludedFiles, false)
      assert.equal(state.fileListFilter.includedChangesInCommitFilter, false)
      assert.equal(state.fileListFilter.filterText, '')
    })
  })

  describe('filter state with file selection', () => {
    it('maintains filter states with file selection', () => {
      const firstFile = testFiles[0].id
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: 'README',
          includedChangesInCommitFilter: false,
          filterNewFiles: true,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
        selection: {
          kind: ChangesSelectionKind.WorkingDirectory,
          selectedFileIDs: [firstFile],
          diff: null,
        },
      })

      assert.equal(state.fileListFilter.filterNewFiles, true)
      assert.equal(state.fileListFilter.filterText, 'README')
      assert.equal(state.selection.kind, ChangesSelectionKind.WorkingDirectory)
    })

    it('works with empty file selection', () => {
      const state = createState({
        workingDirectory,
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: true,
          filterModifiedFiles: true,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
        selection: {
          kind: ChangesSelectionKind.WorkingDirectory,
          selectedFileIDs: [],
          diff: null,
        },
      })

      assert.equal(state.fileListFilter.filterNewFiles, true)
      assert.equal(state.fileListFilter.filterModifiedFiles, true)
      assert.equal(state.selection.kind, ChangesSelectionKind.WorkingDirectory)
    })
  })

  describe('edge cases', () => {
    it('handles empty working directory with filters enabled', () => {
      const emptyWorkingDirectory = WorkingDirectoryStatus.fromFiles([])
      const state = createState({
        workingDirectory: emptyWorkingDirectory,
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: true,
          filterNewFiles: true,
          filterModifiedFiles: true,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      assert.equal(state.fileListFilter.filterNewFiles, true)
      assert.equal(state.fileListFilter.filterModifiedFiles, true)
      assert.equal(state.fileListFilter.includedChangesInCommitFilter, true)
      assert.equal(state.workingDirectory.files.length, 0)
    })

    it('handles special characters in filter text', () => {
      const specialFilterText = 'file-with-special_chars@#$.txt'
      const state = createState({
        fileListFilter: {
          filterText: specialFilterText,
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      assert.equal(state.fileListFilter.filterText, specialFilterText)
    })

    it('handles very long filter text', () => {
      const longFilterText = 'a'.repeat(1000)
      const state = createState({
        fileListFilter: {
          filterText: longFilterText,
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      assert.equal(state.fileListFilter.filterText, longFilterText)
    })

    it('handles unicode characters in filter text', () => {
      const unicodeFilterText = '测试文件.txt'
      const state = createState({
        fileListFilter: {
          filterText: unicodeFilterText,
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      assert.equal(state.fileListFilter.filterText, unicodeFilterText)
    })

    it('handles filter text with whitespace', () => {
      const whitespaceFilterText = '  file with spaces  '
      const state = createState({
        fileListFilter: {
          filterText: whitespaceFilterText,
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      assert.equal(state.fileListFilter.filterText, whitespaceFilterText)
    })
  })

  describe('filter state with different file types', () => {
    it('works with files of basic status kinds', () => {
      const basicFiles = [
        new WorkingDirectoryFileChange(
          'modified.ts',
          { kind: AppFileStatusKind.Modified },
          allSelected
        ),
        new WorkingDirectoryFileChange(
          'new.ts',
          { kind: AppFileStatusKind.New },
          noneSelected
        ),
        new WorkingDirectoryFileChange(
          'deleted.ts',
          { kind: AppFileStatusKind.Deleted },
          allSelected
        ),
        new WorkingDirectoryFileChange(
          'untracked.ts',
          { kind: AppFileStatusKind.Untracked },
          noneSelected
        ),
      ]

      const basicWorkingDirectory = WorkingDirectoryStatus.fromFiles(basicFiles)
      const state = createState({
        workingDirectory: basicWorkingDirectory,
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: true,
          filterModifiedFiles: true,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      assert.equal(state.workingDirectory.files.length, 4)
      assert.equal(state.fileListFilter.filterNewFiles, true)
      assert.equal(state.fileListFilter.filterModifiedFiles, true)
    })

    it('works with complex file status kinds', () => {
      const complexFiles = [
        new WorkingDirectoryFileChange(
          'renamed.ts',
          {
            kind: AppFileStatusKind.Renamed,
            oldPath: 'old-name.ts',
            renameIncludesModifications: false,
          },
          noneSelected
        ),
        new WorkingDirectoryFileChange(
          'copied.ts',
          {
            kind: AppFileStatusKind.Copied,
            oldPath: 'original.ts',
            renameIncludesModifications: true,
          },
          allSelected
        ),
      ]

      const complexWorkingDirectory =
        WorkingDirectoryStatus.fromFiles(complexFiles)
      const state = createState({
        workingDirectory: complexWorkingDirectory,
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: true,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      assert.equal(state.workingDirectory.files.length, 2)
      assert.equal(state.fileListFilter.filterNewFiles, false)
      assert.equal(state.fileListFilter.filterModifiedFiles, true)
    })
  })

  describe('filter state validation', () => {
    it('accepts boolean values for filter flags', () => {
      const state = createState({
        fileListFilter: {
          filterText: '',
          includedChangesInCommitFilter: true,
          filterNewFiles: true,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      assert.strictEqual(typeof state.fileListFilter.filterNewFiles, 'boolean')
      assert.strictEqual(
        typeof state.fileListFilter.filterModifiedFiles,
        'boolean'
      )
      assert.strictEqual(
        typeof state.fileListFilter.includedChangesInCommitFilter,
        'boolean'
      )
    })

    it('accepts string values for filter text', () => {
      const state = createState({
        fileListFilter: {
          filterText: 'test-filter',
          includedChangesInCommitFilter: false,
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
        },
      })

      assert.strictEqual(typeof state.fileListFilter.filterText, 'string')
      assert.equal(state.fileListFilter.filterText, 'test-filter')
    })
  })
})
