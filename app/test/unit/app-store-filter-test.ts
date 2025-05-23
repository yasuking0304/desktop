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

      repositoryStateCache.updateChangesState(repository, () => ({
        filterText,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterText, filterText)
    })

    it('handles empty filter text', () => {
      repositoryStateCache.updateChangesState(repository, () => ({
        filterText: '',
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterText, '')
    })

    it('handles special characters in filter text', () => {
      const specialText = 'file@#$%^&*().txt'

      repositoryStateCache.updateChangesState(repository, () => ({
        filterText: specialText,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterText, specialText)
    })

    it('handles unicode characters in filter text', () => {
      const unicodeText = '测试文件.txt'

      repositoryStateCache.updateChangesState(repository, () => ({
        filterText: unicodeText,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterText, unicodeText)
    })

    it('overwrites previous filter text', () => {
      repositoryStateCache.updateChangesState(repository, () => ({
        filterText: 'first',
      }))

      repositoryStateCache.updateChangesState(repository, () => ({
        filterText: 'second',
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterText, 'second')
    })
  })

  describe('_setIncludedChangesInCommitFilter', () => {
    it('enables included changes filter', () => {
      repositoryStateCache.updateChangesState(repository, () => ({
        includedChangesInCommitFilter: true,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.includedChangesInCommitFilter, true)
    })

    it('disables included changes filter', () => {
      repositoryStateCache.updateChangesState(repository, () => ({
        includedChangesInCommitFilter: false,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.includedChangesInCommitFilter, false)
    })

    it('toggles included changes filter state', () => {
      repositoryStateCache.updateChangesState(repository, () => ({
        includedChangesInCommitFilter: true,
      }))

      let state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.includedChangesInCommitFilter, true)

      repositoryStateCache.updateChangesState(repository, () => ({
        includedChangesInCommitFilter: false,
      }))

      state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.includedChangesInCommitFilter, false)
    })
  })

  describe('_setFilterNewFiles', () => {
    it('enables new files filter', () => {
      repositoryStateCache.updateChangesState(repository, () => ({
        filterNewFiles: true,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterNewFiles, true)
    })

    it('disables new files filter', () => {
      repositoryStateCache.updateChangesState(repository, () => ({
        filterNewFiles: false,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterNewFiles, false)
    })

    it('toggles new files filter state', () => {
      repositoryStateCache.updateChangesState(repository, () => ({
        filterNewFiles: true,
      }))

      let state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterNewFiles, true)

      repositoryStateCache.updateChangesState(repository, () => ({
        filterNewFiles: false,
      }))

      state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterNewFiles, false)
    })
  })

  describe('_setFilterModifiedFiles', () => {
    it('enables modified files filter', () => {
      repositoryStateCache.updateChangesState(repository, () => ({
        filterModifiedFiles: true,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterModifiedFiles, true)
    })

    it('disables modified files filter', () => {
      repositoryStateCache.updateChangesState(repository, () => ({
        filterModifiedFiles: false,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterModifiedFiles, false)
    })

    it('toggles modified files filter state', () => {
      repositoryStateCache.updateChangesState(repository, () => ({
        filterModifiedFiles: true,
      }))

      let state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterModifiedFiles, true)

      repositoryStateCache.updateChangesState(repository, () => ({
        filterModifiedFiles: false,
      }))

      state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterModifiedFiles, false)
    })
  })

  describe('combined filter operations', () => {
    it('sets multiple filters simultaneously', () => {
      repositoryStateCache.updateChangesState(repository, () => ({
        filterText: 'test',
        filterNewFiles: true,
        filterModifiedFiles: true,
        includedChangesInCommitFilter: true,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterText, 'test')
      assert.equal(state.changesState.filterNewFiles, true)
      assert.equal(state.changesState.filterModifiedFiles, true)
      assert.equal(state.changesState.includedChangesInCommitFilter, true)
    })

    it('updates individual filters without affecting others', () => {
      // Set initial state
      repositoryStateCache.updateChangesState(repository, () => ({
        filterText: 'initial',
        filterNewFiles: true,
        filterModifiedFiles: false,
        includedChangesInCommitFilter: true,
      }))

      // Update only filter text
      repositoryStateCache.updateChangesState(repository, () => ({
        filterText: 'updated',
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterText, 'updated')
      assert.equal(state.changesState.filterNewFiles, true)
      assert.equal(state.changesState.filterModifiedFiles, false)
      assert.equal(state.changesState.includedChangesInCommitFilter, true)
    })

    it('handles mixed filter states', () => {
      repositoryStateCache.updateChangesState(repository, () => ({
        filterText: 'partial',
        filterNewFiles: true,
        filterModifiedFiles: false,
        includedChangesInCommitFilter: true,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterText, 'partial')
      assert.equal(state.changesState.filterNewFiles, true)
      assert.equal(state.changesState.filterModifiedFiles, false)
      assert.equal(state.changesState.includedChangesInCommitFilter, true)
    })
  })

  describe('filter state persistence', () => {
    it('maintains filter state across multiple updates', () => {
      // Set initial filters
      repositoryStateCache.updateChangesState(repository, () => ({
        filterText: 'persistent',
        filterNewFiles: true,
      }))

      // Update working directory without affecting filters
      const workingDirectory = WorkingDirectoryStatus.fromFiles(testFiles)
      repositoryStateCache.updateChangesState(repository, () => ({
        workingDirectory,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterText, 'persistent')
      assert.equal(state.changesState.filterNewFiles, true)
      assert.equal(state.changesState.workingDirectory.files.length, 4)
    })

    it('preserves filter state when updating selection', () => {
      repositoryStateCache.updateChangesState(repository, () => ({
        filterText: 'selection-test',
        filterModifiedFiles: true,
        selection: {
          kind: ChangesSelectionKind.WorkingDirectory,
          selectedFileIDs: ['test-id'],
          diff: null,
        },
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterText, 'selection-test')
      assert.equal(state.changesState.filterModifiedFiles, true)
      assert.equal(
        state.changesState.selection.kind,
        ChangesSelectionKind.WorkingDirectory
      )
    })
  })

  describe('default filter values', () => {
    it('initializes with correct default filter values', () => {
      const state = repositoryStateCache.get(repository)

      assert.equal(state.changesState.filterText, '')
      assert.equal(state.changesState.filterNewFiles, false)
      assert.equal(state.changesState.filterModifiedFiles, false)
      assert.equal(state.changesState.includedChangesInCommitFilter, false)
    })

    it('resets to default values when explicitly set', () => {
      // Set non-default values
      repositoryStateCache.updateChangesState(repository, () => ({
        filterText: 'non-default',
        filterNewFiles: true,
        filterModifiedFiles: true,
        includedChangesInCommitFilter: true,
      }))

      // Reset to defaults
      repositoryStateCache.updateChangesState(repository, () => ({
        filterText: '',
        filterNewFiles: false,
        filterModifiedFiles: false,
        includedChangesInCommitFilter: false,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterText, '')
      assert.equal(state.changesState.filterNewFiles, false)
      assert.equal(state.changesState.filterModifiedFiles, false)
      assert.equal(state.changesState.includedChangesInCommitFilter, false)
    })
  })

  describe('edge cases', () => {
    it('handles very long filter text', () => {
      const longText = 'a'.repeat(10000)

      repositoryStateCache.updateChangesState(repository, () => ({
        filterText: longText,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterText, longText)
      assert.equal(state.changesState.filterText.length, 10000)
    })

    it('handles filter text with newlines and special characters', () => {
      const complexText = 'line1\nline2\ttab\rcarriage-return'

      repositoryStateCache.updateChangesState(repository, () => ({
        filterText: complexText,
      }))

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterText, complexText)
    })

    it('handles rapid filter updates', () => {
      // Simulate rapid user typing
      const updates = ['a', 'ab', 'abc', 'abcd', 'abcde']

      updates.forEach(text => {
        repositoryStateCache.updateChangesState(repository, () => ({
          filterText: text,
        }))
      })

      const state = repositoryStateCache.get(repository)
      assert.equal(state.changesState.filterText, 'abcde')
    })
  })
})
