import * as React from 'react'
import {
  Popover,
  PopoverAnchorPosition,
  PopoverDecoration,
} from '../lib/popover'
import {
  countActiveFilterOptions,
  hasActiveFilters,
} from './filter-changes-logic'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { IFileListFilterState } from '../../lib/app-state'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import memoizeOne from 'memoize-one'
import { Button } from '../lib/button'
import classNames from 'classnames'
import { IChangesListItem } from './filter-changes-list'
import { WorkingDirectoryStatus } from '../../models/status'
import { t } from 'i18next'

interface IChangesListFilterOptionsProps {
  readonly fileListFilter: IFileListFilterState
  readonly filteredItems: Map<string, IChangesListItem>
  readonly workingDirectory: WorkingDirectoryStatus
  readonly onFilterToIncludedInCommit: () => void
  readonly onFilterExcludedFiles: () => void
  readonly onFilterDeletedFiles: () => void
  readonly onFilterModifiedFiles: () => void
  readonly onFilterNewFiles: () => void
  readonly onClearAllFilters: () => void
}

interface IChangesListFilterOptionsState {
  readonly isFilterOptionsOpen: boolean
}

/**
 * Component to render filter options for the changes list.
 *
 * Allows users to filter files based on their status (new, modified, deleted, etc.)
 * and includes a button to clear all filters.
 */
export class ChangesListFilterOptions extends React.Component<
  IChangesListFilterOptionsProps,
  IChangesListFilterOptionsState
> {
  private getFilterCounts = memoizeOne(
    (
      wd: WorkingDirectoryStatus,
      filteredItems: Map<string, IChangesListItem>
    ) => {
      const counts = {
        newFilesCount: 0,
        modifiedFilesCount: 0,
        deletedFilesCount: 0,
        includedFilesCount: 0,
        excludedFilesCount: 0,
      }

      Array.from(filteredItems.values()).forEach(v => {
        const file = wd.findFileWithID(v.id)
        if (file) {
          if (file.isNew() || file.isUntracked()) {
            counts.newFilesCount++
          }
          if (file.isModified()) {
            counts.modifiedFilesCount++
          }
          if (file.isDeleted()) {
            counts.deletedFilesCount++
          }
          if (file.isIncludedInCommit()) {
            counts.includedFilesCount++
          }
          if (file.isExcludedFromCommit()) {
            counts.excludedFilesCount++
          }
        }
      })

      return counts
    }
  )

  private filterOptionsButtonRef: HTMLButtonElement | null = null

  public constructor(props: IChangesListFilterOptionsProps) {
    super(props)

    this.state = {
      isFilterOptionsOpen: false,
    }
  }

  private closeFilterOptions = () => {
    this.setState({ isFilterOptionsOpen: false })
  }

  private onFilterToIncludedInCommit = () => {
    this.props.onFilterToIncludedInCommit()
    this.closeFilterOptions()
  }

  private onFilterExcludedFiles = () => {
    this.props.onFilterExcludedFiles()
    this.closeFilterOptions()
  }

  private onFilterDeletedFiles = () => {
    this.props.onFilterDeletedFiles()
    this.closeFilterOptions()
  }

  private onFilterModifiedFiles = () => {
    this.props.onFilterModifiedFiles()
    this.closeFilterOptions()
  }

  private onFilterNewFiles = () => {
    this.props.onFilterNewFiles()
    this.closeFilterOptions()
  }

  private onClearAllFilters = () => {
    this.props.onClearAllFilters()
    this.closeFilterOptions()
  }

  private openFilterOptions = () => {
    this.setState({ isFilterOptionsOpen: true })
  }

  private renderFilterOptions() {
    // Check if any filters are active
    const filtersActive = hasActiveFilters(this.props.fileListFilter)

    const {
      newFilesCount,
      modifiedFilesCount,
      deletedFilesCount,
      excludedFilesCount,
      includedFilesCount,
    } = this.getFilterCounts(
      this.props.workingDirectory,
      this.props.filteredItems
    )

    return (
      <Popover
        className="filter-popover"
        ariaLabelledby="filter-options-header"
        anchor={this.filterOptionsButtonRef}
        anchorPosition={PopoverAnchorPosition.BottomRight}
        decoration={PopoverDecoration.Balloon}
        onMousedownOutside={this.closeFilterOptions}
        onClickOutside={this.closeFilterOptions}
      >
        <div className="filter-popover-header">
          <h3 id="filter-options-header">
            {t('changes-list-filter-options.filter-options', 'Filter Options')}
          </h3>
          <button
            className="close"
            onClick={this.closeFilterOptions}
            aria-label="Close"
          >
            <Octicon symbol={octicons.x} />
          </button>
        </div>
        <div className="filter-options">
          <Checkbox
            value={
              this.props.fileListFilter.isIncludedInCommit
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onFilterToIncludedInCommit}
            label={t(
              'changes-list-filter-options.included-in-commit-with-number',
              `Included in commit ({{0}})`,
              { 0: includedFilesCount }
            )}
          />
          <Checkbox
            value={
              this.props.fileListFilter.isExcludedFromCommit
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onFilterExcludedFiles}
            label={t(
              'changes-list-filter-options.excluded-from-commit-with-number',
              `Excluded from commit ({{0}})`,
              { 0: excludedFilesCount }
            )}
          />
          <Checkbox
            value={
              this.props.fileListFilter.isNewFile
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onFilterNewFiles}
            label={t(
              'changes-list-filter-options.new-files-with-number',
              `New files ({{0}})`,
              { 0: newFilesCount }
            )}
          />
          <Checkbox
            value={
              this.props.fileListFilter.isModifiedFile
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onFilterModifiedFiles}
            label={t(
              'changes-list-filter-options.modified-files-with-number',
              `Modified files ({{0}})`,
              { 0: modifiedFilesCount }
            )}
          />
          <Checkbox
            value={
              this.props.fileListFilter.isDeletedFile
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onFilterDeletedFiles}
            label={t(
              'changes-list-filter-options.deleted-files-with-number',
              `Deleted files ({0})`,
              { 0: deletedFilesCount }
            )}
          />
        </div>
        {filtersActive && (
          <div className="filter-options-footer">
            <Button onClick={this.onClearAllFilters}>
              {t('changes-list-filter-options.clear-filters', 'Clear filters')}
            </Button>
          </div>
        )}
      </Popover>
    )
  }

  private onFilterOptionsButtonRef = (buttonRef: HTMLButtonElement | null) => {
    this.filterOptionsButtonRef = buttonRef
  }

  public render() {
    const activeFiltersCount = countActiveFilterOptions(
      this.props.fileListFilter
    )
    const hasActiveFilters = activeFiltersCount > 0
    const activeFiltersText = hasActiveFilters
      ? t('changes-list-filter-options.active-filters',
         '({{0}} applied)',
         { 0: activeFiltersCount })
      : ''
    const buttonTextLabel = t(
      'changes-list-filter-options.filter-button-label',
      `Filter Options {{0}}`, {0: activeFiltersText}
    )

    return (
      <>
        <Button
          className={classNames('filter-button', {
            active: hasActiveFilters,
          })}
          onClick={this.openFilterOptions}
          ariaExpanded={this.state.isFilterOptionsOpen}
          onButtonRef={this.onFilterOptionsButtonRef}
          tooltip={buttonTextLabel}
          ariaLabel={buttonTextLabel}
        >
          <span>
            <Octicon symbol={octicons.filter} />
          </span>
          {hasActiveFilters ? (
            <span className="active-badge">
              <div className="badge-bg">
                <div className="badge"></div>
              </div>
            </span>
          ) : null}
          <Octicon symbol={octicons.triangleDown} />
        </Button>
        {this.state.isFilterOptionsOpen && this.renderFilterOptions()}
      </>
    )
  }
}
