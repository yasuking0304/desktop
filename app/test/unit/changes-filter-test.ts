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

  describe('filterNewFiles', () => {
    it('initializes with default value false', () => {
      const state = createState({})
      assert.equal(state.filterNewFiles, false)
    })

    it('can be set to true', () => {
      const state = createState({
        filterNewFiles: true,
      })
      assert.equal(state.filterNewFiles, true)
    })

    it('can be set to false explicitly', () => {
      const state = createState({
        filterNewFiles: false,
      })
      assert.equal(state.filterNewFiles, false)
    })
  })

  describe('filterModifiedFiles', () => {
    it('initializes with default value false', () => {
      const state = createState({})
      assert.equal(state.filterModifiedFiles, false)
    })

    it('can be set to true', () => {
      const state = createState({
        filterModifiedFiles: true,
      })
      assert.equal(state.filterModifiedFiles, true)
    })

    it('can be set to false explicitly', () => {
      const state = createState({
        filterModifiedFiles: false,
      })
      assert.equal(state.filterModifiedFiles, false)
    })
  })

  describe('filterDeletedFiles', () => {
    it('initializes with default value false', () => {
      const state = createState({})
      assert.equal(state.filterDeletedFiles, false)
    })

    it('can be set to true', () => {
      const state = createState({
        filterDeletedFiles: true,
      })
      assert.equal(state.filterDeletedFiles, true)
    })

    it('can be set to false explicitly', () => {
      const state = createState({
        filterDeletedFiles: false,
      })
      assert.equal(state.filterDeletedFiles, false)
    })
  })

  describe('filterExcludedFiles', () => {
    it('initializes with default value false', () => {
      const state = createState({})
      assert.equal(state.filterExcludedFiles, false)
    })

    it('can be set to true', () => {
      const state = createState({
        filterExcludedFiles: true,
      })
      assert.equal(state.filterExcludedFiles, true)
    })

    it('can be set to false explicitly', () => {
      const state = createState({
        filterExcludedFiles: false,
      })
      assert.equal(state.filterExcludedFiles, false)
    })
  })

  describe('includedChangesInCommitFilter', () => {
    it('initializes with default value false', () => {
      const state = createState({})
      assert.equal(state.includedChangesInCommitFilter, false)
    })

    it('can be set to true', () => {
      const state = createState({
        includedChangesInCommitFilter: true,
      })
      assert.equal(state.includedChangesInCommitFilter, true)
    })

    it('can be set to false explicitly', () => {
      const state = createState({
        includedChangesInCommitFilter: false,
      })
      assert.equal(state.includedChangesInCommitFilter, false)
    })
  })

  describe('filterText', () => {
    it('initializes with empty string', () => {
      const state = createState({})
      assert.equal(state.filterText, '')
    })

    it('can be set to a filter string', () => {
      const filterText = 'README'
      const state = createState({
        filterText,
      })
      assert.equal(state.filterText, filterText)
    })

    it('can be set to empty string explicitly', () => {
      const state = createState({
        filterText: '',
      })
      assert.equal(state.filterText, '')
    })
  })

  describe('combined filter states', () => {
    it('can have multiple filters enabled simultaneously', () => {
      const state = createState({
        filterNewFiles: true,
        filterModifiedFiles: true,
        filterDeletedFiles: true,
        filterExcludedFiles: true,
        includedChangesInCommitFilter: true,
        filterText: 'test',
      })

      assert.equal(state.filterNewFiles, true)
      assert.equal(state.filterModifiedFiles, true)
      assert.equal(state.filterDeletedFiles, true)
      assert.equal(state.filterExcludedFiles, true)
      assert.equal(state.includedChangesInCommitFilter, true)
      assert.equal(state.filterText, 'test')
    })

    it('can have mixed filter states', () => {
      const state = createState({
        filterNewFiles: true,
        filterModifiedFiles: false,
        filterDeletedFiles: true,
        filterExcludedFiles: false,
        includedChangesInCommitFilter: true,
        filterText: 'feature',
      })

      assert.equal(state.filterNewFiles, true)
      assert.equal(state.filterModifiedFiles, false)
      assert.equal(state.filterDeletedFiles, true)
      assert.equal(state.filterExcludedFiles, false)
      assert.equal(state.includedChangesInCommitFilter, true)
      assert.equal(state.filterText, 'feature')
    })

    it('can disable all filters', () => {
      const state = createState({
        filterNewFiles: false,
        filterModifiedFiles: false,
        filterDeletedFiles: false,
        filterExcludedFiles: false,
        includedChangesInCommitFilter: false,
        filterText: '',
      })

      assert.equal(state.filterNewFiles, false)
      assert.equal(state.filterModifiedFiles, false)
      assert.equal(state.filterDeletedFiles, false)
      assert.equal(state.filterExcludedFiles, false)
      assert.equal(state.includedChangesInCommitFilter, false)
      assert.equal(state.filterText, '')
    })
  })

  describe('filter state with file selection', () => {
    it('maintains filter states with file selection', () => {
      const firstFile = testFiles[0].id
      const state = createState({
        workingDirectory,
        filterNewFiles: true,
        filterText: 'README',
        selection: {
          kind: ChangesSelectionKind.WorkingDirectory,
          selectedFileIDs: [firstFile],
          diff: null,
        },
      })

      assert.equal(state.filterNewFiles, true)
      assert.equal(state.filterText, 'README')
      assert.equal(state.selection.kind, ChangesSelectionKind.WorkingDirectory)
    })

    it('works with empty file selection', () => {
      const state = createState({
        workingDirectory,
        filterNewFiles: true,
        filterModifiedFiles: true,
        selection: {
          kind: ChangesSelectionKind.WorkingDirectory,
          selectedFileIDs: [],
          diff: null,
        },
      })

      assert.equal(state.filterNewFiles, true)
      assert.equal(state.filterModifiedFiles, true)
      assert.equal(state.selection.kind, ChangesSelectionKind.WorkingDirectory)
    })
  })

  describe('edge cases', () => {
    it('handles empty working directory with filters enabled', () => {
      const emptyWorkingDirectory = WorkingDirectoryStatus.fromFiles([])
      const state = createState({
        workingDirectory: emptyWorkingDirectory,
        filterNewFiles: true,
        filterModifiedFiles: true,
        includedChangesInCommitFilter: true,
      })

      assert.equal(state.filterNewFiles, true)
      assert.equal(state.filterModifiedFiles, true)
      assert.equal(state.includedChangesInCommitFilter, true)
      assert.equal(state.workingDirectory.files.length, 0)
    })

    it('handles special characters in filter text', () => {
      const specialFilterText = 'file-with-special_chars@#$.txt'
      const state = createState({
        filterText: specialFilterText,
      })

      assert.equal(state.filterText, specialFilterText)
    })

    it('handles very long filter text', () => {
      const longFilterText = 'a'.repeat(1000)
      const state = createState({
        filterText: longFilterText,
      })

      assert.equal(state.filterText, longFilterText)
    })

    it('handles unicode characters in filter text', () => {
      const unicodeFilterText = '测试文件.txt'
      const state = createState({
        filterText: unicodeFilterText,
      })

      assert.equal(state.filterText, unicodeFilterText)
    })

    it('handles filter text with whitespace', () => {
      const whitespaceFilterText = '  file with spaces  '
      const state = createState({
        filterText: whitespaceFilterText,
      })

      assert.equal(state.filterText, whitespaceFilterText)
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
        filterNewFiles: true,
        filterModifiedFiles: true,
      })

      assert.equal(state.workingDirectory.files.length, 4)
      assert.equal(state.filterNewFiles, true)
      assert.equal(state.filterModifiedFiles, true)
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
        filterNewFiles: false,
        filterModifiedFiles: true,
      })

      assert.equal(state.workingDirectory.files.length, 2)
      assert.equal(state.filterNewFiles, false)
      assert.equal(state.filterModifiedFiles, true)
    })
  })

  describe('filter state validation', () => {
    it('accepts boolean values for filter flags', () => {
      const state = createState({
        filterNewFiles: true,
        filterModifiedFiles: false,
        includedChangesInCommitFilter: true,
      })

      assert.strictEqual(typeof state.filterNewFiles, 'boolean')
      assert.strictEqual(typeof state.filterModifiedFiles, 'boolean')
      assert.strictEqual(typeof state.includedChangesInCommitFilter, 'boolean')
    })

    it('accepts string values for filter text', () => {
      const state = createState({
        filterText: 'test-filter',
      })

      assert.strictEqual(typeof state.filterText, 'string')
      assert.equal(state.filterText, 'test-filter')
    })
  })
})
