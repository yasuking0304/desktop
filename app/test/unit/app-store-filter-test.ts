import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { Repository } from '../../src/models/repository'
import { RepositoryStateCache } from '../../src/lib/stores/repository-state-cache'
import {
  WorkingDirectoryStatus,
  WorkingDirectoryFileChange,
  AppFileStatusKind,
} from '../../src/models/status'
import { DiffSelection, DiffSelectionType } from '../../src/models/diff'
import { ChangesSelectionKind } from '../../src/lib/app-state'
import { TestStatsStore } from '../helpers/test-stats-store'

const allSelected = DiffSelection.fromInitialSelection(DiffSelectionType.All)
const noneSelected = DiffSelection.fromInitialSelection(DiffSelectionType.None)

describe('App Store Filter Functionality', () => {
  let repository: Repository
  let repositoryStateCache: RepositoryStateCache
  let testFiles: WorkingDirectoryFileChange[]

  beforeEach(() => {
    repository = new Repository('/test/path', 1, null, false)
    const statsStore = new TestStatsStore()
    repositoryStateCache = new RepositoryStateCache(statsStore)

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
    ]
  })

  describe('_setChangesListFilterText', () => {
    it('updates filter text in repository state cache', () => {
      const filterText = 'README'

      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterText, filterText)
    })

    it('handles empty filter text', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText: '',
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterText, '')
    })

    it('handles special characters in filter text', () => {
      const specialText = 'file@#$%^&*().txt'

      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText: specialText,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterText, specialText)
    })

    it('handles unicode characters in filter text', () => {
      const unicodeText = '测试文件.txt'

      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText: unicodeText,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterText, unicodeText)
    })

    it('overwrites previous filter text', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText: 'first',
        },
      }))

      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText: 'second',
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterText, 'second')
    })
  })

  describe('_setIncludedChangesInCommitFilter', () => {
    it('enables included changes filter', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          includedChangesInCommitFilter: true,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(
        state.changesState.fileListFilter.includedChangesInCommitFilter,
        true
      )
    })

    it('disables included changes filter', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          includedChangesInCommitFilter: false,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(
        state.changesState.fileListFilter.includedChangesInCommitFilter,
        false
      )
    })

    it('toggles included changes filter state', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          includedChangesInCommitFilter: true,
        },
      }))

      let state = repositoryStateCache.get(repository)
      assert.equal(
        state.changesState.fileListFilter.includedChangesInCommitFilter,
        true
      )

      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          includedChangesInCommitFilter: false,
        },
      }))

      state = repositoryStateCache.get(repository)
      assert.equal(
        state.changesState.fileListFilter.includedChangesInCommitFilter,
        false
      )
    })
  })

  describe('_setFilterNewFiles', () => {
    it('enables new files filter', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterNewFiles: true,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterNewFiles, true)
    })

    it('disables new files filter', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterNewFiles: false,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterNewFiles, false)
    })

    it('toggles new files filter state', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterNewFiles: true,
        },
      }))

      let state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterNewFiles, true)

      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterNewFiles: false,
        },
      }))

      state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterNewFiles, false)
    })
  })

  describe('_setFilterModifiedFiles', () => {
    it('enables modified files filter', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterModifiedFiles: true,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterModifiedFiles, true)
    })

    it('disables modified files filter', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterModifiedFiles: false,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterModifiedFiles, false)
    })

    it('toggles modified files filter state', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterModifiedFiles: true,
        },
      }))

      let state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterModifiedFiles, true)

      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterModifiedFiles: false,
        },
      }))

      state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterModifiedFiles, false)
    })
  })

  describe('_setFilterDeletedFiles', () => {
    it('enables deleted files filter', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterDeletedFiles: true,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterDeletedFiles, true)
    })

    it('disables deleted files filter', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterDeletedFiles: false,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterDeletedFiles, false)
    })

    it('toggles deleted files filter state', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterDeletedFiles: true,
        },
      }))

      let state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterDeletedFiles, true)

      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterDeletedFiles: false,
        },
      }))

      state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterDeletedFiles, false)
    })
  })

  describe('_setFilterExcludedFiles', () => {
    it('enables excluded files filter', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterExcludedFiles: true,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterExcludedFiles, true)
    })

    it('disables excluded files filter', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterExcludedFiles: false,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterExcludedFiles, false)
    })

    it('toggles excluded files filter state', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterExcludedFiles: true,
        },
      }))

      let state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterExcludedFiles, true)

      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterExcludedFiles: false,
        },
      }))

      state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterExcludedFiles, false)
    })
  })

  describe('combined filter operations', () => {
    it('sets multiple filters simultaneously', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText: 'test',
          filterNewFiles: true,
          filterModifiedFiles: true,
          filterDeletedFiles: true,
          filterExcludedFiles: true,
          includedChangesInCommitFilter: true,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterText, 'test')
      assert.equal(state.changesState.fileListFilter.filterNewFiles, true)
      assert.equal(state.changesState.fileListFilter.filterModifiedFiles, true)
      assert.equal(state.changesState.fileListFilter.filterDeletedFiles, true)
      assert.equal(state.changesState.fileListFilter.filterExcludedFiles, true)
      assert.equal(
        state.changesState.fileListFilter.includedChangesInCommitFilter,
        true
      )
    })

    it('updates individual filters without affecting others', () => {
      // Set initial state
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText: 'initial',
          filterNewFiles: true,
          filterModifiedFiles: false,
          includedChangesInCommitFilter: true,
        },
      }))

      // Update only filter text
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText: 'updated',
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterText, 'updated')
      assert.equal(state.changesState.fileListFilter.filterNewFiles, true)
      assert.equal(state.changesState.fileListFilter.filterModifiedFiles, false)
      assert.equal(
        state.changesState.fileListFilter.includedChangesInCommitFilter,
        true
      )
    })

    it('handles mixed filter states', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText: 'partial',
          filterNewFiles: true,
          filterModifiedFiles: false,
          includedChangesInCommitFilter: true,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterText, 'partial')
      assert.equal(state.changesState.fileListFilter.filterNewFiles, true)
      assert.equal(state.changesState.fileListFilter.filterModifiedFiles, false)
      assert.equal(
        state.changesState.fileListFilter.includedChangesInCommitFilter,
        true
      )
    })
  })

  describe('filter state persistence', () => {
    it('maintains filter state across multiple updates', () => {
      // Set initial filters
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText: 'persistent',
          filterNewFiles: true,
        },
      }))

      // Update working directory without affecting filters
      const workingDirectory = WorkingDirectoryStatus.fromFiles(testFiles)
      repositoryStateCache.updateChangesState(repository, state => ({
        workingDirectory,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterText, 'persistent')
      assert.equal(state.changesState.fileListFilter.filterNewFiles, true)
      assert.equal(state.changesState.workingDirectory.files.length, 4)
    })

    it('preserves filter state when updating selection', () => {
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText: 'selection-test',
          filterModifiedFiles: true,
        },
        selection: {
          kind: ChangesSelectionKind.WorkingDirectory,
          selectedFileIDs: ['test-id'],
          diff: null,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(
        state.changesState.fileListFilter.filterText,
        'selection-test'
      )
      assert.equal(state.changesState.fileListFilter.filterModifiedFiles, true)
      assert.equal(
        state.changesState.selection.kind,
        ChangesSelectionKind.WorkingDirectory
      )
    })
  })

  describe('default filter values', () => {
    it('initializes with correct default filter values', () => {
      const state = repositoryStateCache.get(repository)

      assert.equal(state.changesState.fileListFilter.filterText, '')
      assert.equal(state.changesState.fileListFilter.filterNewFiles, false)
      assert.equal(state.changesState.fileListFilter.filterModifiedFiles, false)
      assert.equal(state.changesState.fileListFilter.filterDeletedFiles, false)
      assert.equal(state.changesState.fileListFilter.filterExcludedFiles, false)
      assert.equal(
        state.changesState.fileListFilter.includedChangesInCommitFilter,
        false
      )
    })

    it('resets to default values when explicitly set', () => {
      // Set non-default values
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText: 'non-default',
          filterNewFiles: true,
          filterModifiedFiles: true,
          filterDeletedFiles: true,
          filterExcludedFiles: true,
          includedChangesInCommitFilter: true,
        },
      }))

      // Reset to defaults
      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText: '',
          filterNewFiles: false,
          filterModifiedFiles: false,
          filterDeletedFiles: false,
          filterExcludedFiles: false,
          includedChangesInCommitFilter: false,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterText, '')
      assert.equal(state.changesState.fileListFilter.filterNewFiles, false)
      assert.equal(state.changesState.fileListFilter.filterModifiedFiles, false)
      assert.equal(state.changesState.fileListFilter.filterDeletedFiles, false)
      assert.equal(state.changesState.fileListFilter.filterExcludedFiles, false)
      assert.equal(
        state.changesState.fileListFilter.includedChangesInCommitFilter,
        false
      )
    })
  })

  describe('edge cases', () => {
    it('handles very long filter text', () => {
      const longText = 'a'.repeat(10000)

      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText: longText,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterText, longText)
      assert.equal(state.changesState.fileListFilter.filterText.length, 10000)
    })

    it('handles filter text with newlines and special characters', () => {
      const complexText = 'line1\nline2\ttab\rcarriage-return'

      repositoryStateCache.updateChangesState(repository, state => ({
        fileListFilter: {
          ...state.fileListFilter,
          filterText: complexText,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterText, complexText)
    })

    it('handles rapid filter updates', () => {
      // Simulate rapid user typing
      const updates = ['a', 'ab', 'abc', 'abcd', 'abcde']

      updates.forEach(text => {
        repositoryStateCache.updateChangesState(repository, state => ({
          fileListFilter: {
            ...state.fileListFilter,
            filterText: text,
          },
        }))
      })

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.fileListFilter.filterText, 'abcde')
    })
  })
})
