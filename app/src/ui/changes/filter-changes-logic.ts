import { WorkingDirectoryStatus, WorkingDirectoryFileChange, AppFileStatusKind } from '../../models/status'
import { DiffSelectionType } from '../../models/diff'
import { RebaseConflictState } from '../../lib/app-state'
import { CheckboxValue } from '../lib/checkbox'

/** Interface for filter state */
export interface IFileFilterState {
  readonly includedChangesInCommitFilter: boolean
  readonly filterExcludedFiles: boolean
  readonly filterNewFiles: boolean
  readonly filterModifiedFiles: boolean
  readonly filterDeletedFiles: boolean
}

/** Interface for a changes list item */
export interface IChangesListItem {
  readonly id: string
  readonly text: ReadonlyArray<string>
  readonly change: WorkingDirectoryFileChange
}

/**
 * Apply filters to determine if a file should be shown
 * Uses AND logic - file must satisfy ALL active filters
 */
export function applyFilters(
  item: IChangesListItem,
  filters: IFileFilterState
): boolean {
  // Check if any filters are active
  const hasAnyFilter =
    filters.includedChangesInCommitFilter ||
    filters.filterExcludedFiles ||
    filters.filterNewFiles ||
    filters.filterModifiedFiles ||
    filters.filterDeletedFiles

  if (!hasAnyFilter) {
    return true
  }

  // Use AND logic - file must satisfy ALL active filters
  const isStaged =
    item.change.selection.getSelectionType() !== DiffSelectionType.None
  const isUnstaged =
    item.change.selection.getSelectionType() === DiffSelectionType.None

  // Check staging status filters
  if (filters.includedChangesInCommitFilter && !isStaged) {
    return false
  }

  if (filters.filterExcludedFiles && !isUnstaged) {
    return false
  }

  // Check if file type filters are active
  const hasFileTypeFilter =
    filters.filterNewFiles ||
    filters.filterModifiedFiles ||
    filters.filterDeletedFiles

  if (hasFileTypeFilter) {
    // Determine the file type
    const isNewFile =
      item.change.status.kind === AppFileStatusKind.New ||
      item.change.status.kind === AppFileStatusKind.Untracked
    const isModifiedFile =
      item.change.status.kind === AppFileStatusKind.Modified
    const isDeletedFile =
      item.change.status.kind === AppFileStatusKind.Deleted

    // Check each active file type filter
    if (filters.filterNewFiles && !isNewFile) {
      return false
    }

    if (filters.filterModifiedFiles && !isModifiedFile) {
      return false
    }

    if (filters.filterDeletedFiles && !isDeletedFile) {
      return false
    }
  }

  // File matches all active filters
  return true
}

/**
 * Check if any files being committed are hidden by the current filter
 */
export function isCommittingFileHiddenByFilter(
  filterText: string,
  fileIdsIncludedInCommit: ReadonlyArray<string>,
  filteredItems: Map<string, IChangesListItem>,
  fileCount: number,
  filters: IFileFilterState
): boolean {
  // Check if any filters are active
  const hasAnyActiveFilter =
    filterText !== '' ||
    filters.includedChangesInCommitFilter ||
    filters.filterNewFiles ||
    filters.filterModifiedFiles ||
    filters.filterDeletedFiles ||
    filters.filterExcludedFiles

  // All possible files are present in the list (no active filters or all files match active filters)
  if (!hasAnyActiveFilter || filteredItems.size === fileCount) {
    return false
  }

  // If filtered rows count is 1 and included for commit rows count is 2,
  // there is no way the included for commit rows are visible regardless of
  // what they are.
  if (fileIdsIncludedInCommit.length > filteredItems.size) {
    return true
  }

  // If we can find a file id included in the commit that does not exist in
  // the filtered items, then we are committing a hidden file.
  return fileIdsIncludedInCommit.some(fId => !filteredItems.get(fId))
}

/**
 * Calculate the count of new files (including untracked)
 */
export function getNewFilesCount(workingDirectory: WorkingDirectoryStatus): number {
  return workingDirectory.files.filter(
    f =>
      f.status.kind === AppFileStatusKind.New ||
      f.status.kind === AppFileStatusKind.Untracked
  ).length
}

/**
 * Calculate the count of modified files
 */
export function getModifiedFilesCount(workingDirectory: WorkingDirectoryStatus): number {
  return workingDirectory.files.filter(
    f => f.status.kind === AppFileStatusKind.Modified
  ).length
}

/**
 * Calculate the count of deleted files
 */
export function getDeletedFilesCount(workingDirectory: WorkingDirectoryStatus): number {
  return workingDirectory.files.filter(
    f => f.status.kind === AppFileStatusKind.Deleted
  ).length
}

/**
 * Calculate the count of excluded from commit files (files with DiffSelectionType.None)
 */
export function getExcludedFilesCount(workingDirectory: WorkingDirectoryStatus): number {
  return workingDirectory.files.filter(
    f => f.selection.getSelectionType() === DiffSelectionType.None
  ).length
}

/**
 * Calculate the count of included in commit files (files with DiffSelectionType.All or DiffSelectionType.Partial)
 */
export function getIncludedFilesCount(workingDirectory: WorkingDirectoryStatus): number {
  return workingDirectory.files.filter(
    f => f.selection.getSelectionType() !== DiffSelectionType.None
  ).length
}

/**
 * Get checkbox value from includeAll status
 */
export function getCheckBoxValueFromIncludeAll(includeAll: boolean | null): CheckboxValue {
  if (includeAll === true) {
    return CheckboxValue.On
  }

  if (includeAll === false) {
    return CheckboxValue.Off
  }

  return CheckboxValue.Mixed
}

/**
 * Compute the 'Include All' checkbox value
 */
export function getCheckAllValue(
  workingDirectory: WorkingDirectoryStatus,
  rebaseConflictState: RebaseConflictState | null,
  filteredItems: Map<string, IChangesListItem>
): CheckboxValue {
  if (
    filteredItems.size === workingDirectory.files.length &&
    rebaseConflictState === null
  ) {
    return getCheckBoxValueFromIncludeAll(workingDirectory.includeAll)
  }

  const files = workingDirectory.files.filter(f => filteredItems.has(f.id))

  if (files.length === 0) {
    // the current commit will be skipped in the rebase
    return CheckboxValue.Off
  }

  if (rebaseConflictState !== null) {
    // untracked files will be skipped by the rebase, so we need to ensure that
    // the "Include All" checkbox matches this state
    const onlyUntrackedFilesFound = files.every(
      f => f.status.kind === AppFileStatusKind.Untracked
    )

    if (onlyUntrackedFilesFound) {
      return CheckboxValue.Off
    }

    const onlyTrackedFilesFound = files.every(
      f => f.status.kind !== AppFileStatusKind.Untracked
    )

    // show "Mixed" if we have a mixture of tracked and untracked changes
    return onlyTrackedFilesFound ? CheckboxValue.On : CheckboxValue.Mixed
  }

  const filteredStatus = WorkingDirectoryStatus.fromFiles(files)

  return getCheckBoxValueFromIncludeAll(filteredStatus.includeAll)
}

/**
 * Generate message when no files match filters
 */
export function getNoResultsMessage(
  filterText: string,
  filters: IFileFilterState
): string | undefined {
  if (
    filterText === '' &&
    !filters.includedChangesInCommitFilter &&
    !filters.filterNewFiles &&
    !filters.filterModifiedFiles &&
    !filters.filterDeletedFiles &&
    !filters.filterExcludedFiles
  ) {
    return undefined
  }

  const activeFilters: string[] = []

  if (filterText) {
    activeFilters.push(`"${filterText}"`)
  }

  if (filters.includedChangesInCommitFilter) {
    activeFilters.push('Included in commit')
  }

  if (filters.filterExcludedFiles) {
    activeFilters.push('Excluded from commit')
  }

  if (filters.filterNewFiles) {
    activeFilters.push('New files')
  }

  if (filters.filterModifiedFiles) {
    activeFilters.push('Modified files')
  }

  if (filters.filterDeletedFiles) {
    activeFilters.push('Deleted files')
  }

  if (activeFilters.length === 0) {
    return undefined
  }

  const filterList = activeFilters.join(', ')
  return `Sorry, I can't find any changed files matching the following filters: ${filterList}`
}

/**
 * Check if there are any active filters
 */
export function hasActiveFilters(
  filterText: string,
  filters: IFileFilterState
): boolean {
  return (
    filterText !== '' ||
    filters.includedChangesInCommitFilter ||
    filters.filterNewFiles ||
    filters.filterModifiedFiles ||
    filters.filterDeletedFiles ||
    filters.filterExcludedFiles
  )
}

/**
 * Count the number of active filters
 */
export function countActiveFilters(filters: IFileFilterState): number {
  return [
    filters.includedChangesInCommitFilter,
    filters.filterNewFiles,
    filters.filterModifiedFiles,
    filters.filterDeletedFiles,
    filters.filterExcludedFiles,
  ].filter(Boolean).length
}