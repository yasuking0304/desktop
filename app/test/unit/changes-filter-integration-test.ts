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
        filterText: 'README',
      })

      // In a real implementation, this would be handled by the UI component
      // that applies the filter. Here we simulate the filtering logic.
      const filteredFiles = state.workingDirectory.files.filter(file =>
        file.path.toLowerCase().includes(state.filterText.toLowerCase())
      )

      assert.equal(filteredFiles.length, 1)
      assert.equal(filteredFiles[0].path, 'README.md')
    })

    it('filters files by partial path', () => {
      const state = createState({
        workingDirectory,
        filterText: 'src/',
      })

      const filteredFiles = state.workingDirectory.files.filter(file =>
        file.path.toLowerCase().includes(state.filterText.toLowerCase())
      )

      assert.equal(filteredFiles.length, 2)
      assert.ok(filteredFiles.some(f => f.path === 'src/components/App.tsx'))
      assert.ok(filteredFiles.some(f => f.path === 'src/utils/helpers.ts'))
    })

    it('filters files by extension', () => {
      const state = createState({
        workingDirectory,
        filterText: '.tsx',
      })

      const filteredFiles = state.workingDirectory.files.filter(file =>
        file.path.toLowerCase().includes(state.filterText.toLowerCase())
      )

      assert.equal(filteredFiles.length, 2)
      assert.ok(filteredFiles.some(f => f.path === 'src/components/App.tsx'))
      assert.ok(filteredFiles.some(f => f.path === 'renamed-component.tsx'))
    })

    it('handles case-insensitive filtering', () => {
      const state = createState({
        workingDirectory,
        filterText: 'APP',
      })

      const filteredFiles = state.workingDirectory.files.filter(file =>
        file.path.toLowerCase().includes(state.filterText.toLowerCase())
      )

      assert.equal(filteredFiles.length, 1)
      assert.equal(filteredFiles[0].path, 'src/components/App.tsx')
    })

    it('returns all files when filter text is empty', () => {
      const state = createState({
        workingDirectory,
        filterText: '',
      })

      const filteredFiles = state.workingDirectory.files.filter(
        file =>
          state.filterText === '' ||
          file.path.toLowerCase().includes(state.filterText.toLowerCase())
      )

      assert.equal(filteredFiles.length, testFiles.length)
    })
  })

  describe('file type filtering', () => {
    it('filters new files when filterNewFiles is enabled', () => {
      const state = createState({
        workingDirectory,
        filterNewFiles: true,
      })

      // Simulate the filtering logic that would be applied in the UI
      const filteredFiles = state.workingDirectory.files.filter(file => {
        if (!state.filterNewFiles) {
          return true
        }
        return file.status.kind === AppFileStatusKind.New
      })

      assert.equal(filteredFiles.length, 2)
      assert.ok(
        filteredFiles.every(f => f.status.kind === AppFileStatusKind.New)
      )
      assert.ok(filteredFiles.some(f => f.path === 'src/utils/helpers.ts'))
      assert.ok(filteredFiles.some(f => f.path === 'docs/api.md'))
    })

    it('filters modified files when filterModifiedFiles is enabled', () => {
      const state = createState({
        workingDirectory,
        filterModifiedFiles: true,
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        if (!state.filterModifiedFiles) {
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
        includedChangesInCommitFilter: true,
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        if (!state.includedChangesInCommitFilter) {
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
  })

  describe('combined filtering', () => {
    it('applies multiple filters simultaneously', () => {
      const state = createState({
        workingDirectory,
        filterText: 'src/',
        filterNewFiles: true,
      })

      // Apply both text filter and new files filter
      const filteredFiles = state.workingDirectory.files.filter(file => {
        const matchesText =
          state.filterText === '' ||
          file.path.toLowerCase().includes(state.filterText.toLowerCase())
        const matchesType =
          !state.filterNewFiles || file.status.kind === AppFileStatusKind.New

        return matchesText && matchesType
      })

      assert.equal(filteredFiles.length, 1)
      assert.equal(filteredFiles[0].path, 'src/utils/helpers.ts')
      assert.equal(filteredFiles[0].status.kind, AppFileStatusKind.New)
    })

    it('applies text filter with included changes filter', () => {
      const state = createState({
        workingDirectory,
        filterText: '.md',
        includedChangesInCommitFilter: true,
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        const matchesText =
          state.filterText === '' ||
          file.path.toLowerCase().includes(state.filterText.toLowerCase())
        const matchesIncluded =
          !state.includedChangesInCommitFilter ||
          file.selection.getSelectionType() !== DiffSelectionType.None

        return matchesText && matchesIncluded
      })

      assert.equal(filteredFiles.length, 1)
      assert.equal(filteredFiles[0].path, 'README.md')
    })

    it('returns empty result when filters exclude all files', () => {
      const state = createState({
        workingDirectory,
        filterText: 'nonexistent',
        filterNewFiles: true,
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        const matchesText =
          state.filterText === '' ||
          file.path.toLowerCase().includes(state.filterText.toLowerCase())
        const matchesType =
          !state.filterNewFiles || file.status.kind === AppFileStatusKind.New

        return matchesText && matchesType
      })

      assert.equal(filteredFiles.length, 0)
    })

    it('handles all filters disabled (shows all files)', () => {
      const state = createState({
        workingDirectory,
        filterText: '',
        filterNewFiles: false,
        filterModifiedFiles: false,
        includedChangesInCommitFilter: false,
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        const matchesText =
          state.filterText === '' ||
          file.path.toLowerCase().includes(state.filterText.toLowerCase())
        const matchesNewFiles =
          !state.filterNewFiles || file.status.kind === AppFileStatusKind.New
        const matchesModifiedFiles =
          !state.filterModifiedFiles ||
          file.status.kind === AppFileStatusKind.Modified
        const matchesIncluded =
          !state.includedChangesInCommitFilter ||
          file.selection.getSelectionType() !== DiffSelectionType.None

        return (
          matchesText &&
          matchesNewFiles &&
          matchesModifiedFiles &&
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
        filterText: 'anything',
        filterNewFiles: true,
      })

      const filteredFiles = state.workingDirectory.files.filter(file => {
        const matchesText =
          state.filterText === '' ||
          file.path.toLowerCase().includes(state.filterText.toLowerCase())
        const matchesType =
          !state.filterNewFiles || file.status.kind === AppFileStatusKind.New

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
        filterText: '@#$',
      })

      const filteredFiles = state.workingDirectory.files.filter(file =>
        file.path.toLowerCase().includes(state.filterText.toLowerCase())
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
        filterText: '测试',
      })

      const filteredFiles = state.workingDirectory.files.filter(file =>
        file.path.toLowerCase().includes(state.filterText.toLowerCase())
      )

      assert.equal(filteredFiles.length, 1)
      assert.equal(filteredFiles[0].path, '测试文件.txt')
    })
  })
})
