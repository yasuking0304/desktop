import * as React from 'react'

import { HistoryTabMode } from '../../lib/app-state'
import { Repository } from '../../models/repository'
import { Branch } from '../../models/branch'
import { Dispatcher } from '../dispatcher'
import { ActionStatusIcon } from '../lib/action-status-icon'
import { MergeTreeResult } from '../../models/merge'
import { ComputedAction } from '../../models/computed-action'
import {
  DropdownSelectButton,
  IDropdownSelectButtonOption,
} from '../dropdown-select-button'
import { getMergeOptions, updateRebasePreview } from '../lib/update-branch'
import {
  MultiCommitOperationKind,
  isIdMultiCommitOperation,
} from '../../models/multi-commit-operation'
import { RebasePreview } from '../../models/rebase'
import { t } from 'i18next'
import { formatNumber } from '../../lib/format-number'

interface IMergeCallToActionWithConflictsProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  readonly mergeStatus: MergeTreeResult | null
  readonly currentBranch: Branch
  readonly comparisonBranch: Branch
  readonly commitsBehind: number
}

interface IMergeCallToActionWithConflictsState {
  readonly selectedOperation: MultiCommitOperationKind
  readonly rebasePreview: RebasePreview | null
}

export class MergeCallToActionWithConflicts extends React.Component<
  IMergeCallToActionWithConflictsProps,
  IMergeCallToActionWithConflictsState
> {
  /**
   * This is obtained by either the merge status or the rebase preview. Depending
   * on which option is selected in the dropdown.
   */
  private get computedAction(): ComputedAction | null {
    if (this.state.selectedOperation === MultiCommitOperationKind.Rebase) {
      return this.state.rebasePreview !== null
        ? this.state.rebasePreview.kind
        : null
    }
    return this.props.mergeStatus !== null ? this.props.mergeStatus.kind : null
  }

  /**
   * This is obtained by either the merge status or the rebase preview. Depending
   * on which option is selected in the dropdown.
   */
  private get commitCount(): number {
    const { selectedOperation, rebasePreview } = this.state
    if (selectedOperation === MultiCommitOperationKind.Rebase) {
      return rebasePreview !== null &&
        rebasePreview.kind === ComputedAction.Clean
        ? rebasePreview.commitsAhead.length
        : 0
    }

    return this.props.commitsBehind
  }

  public constructor(props: IMergeCallToActionWithConflictsProps) {
    super(props)

    this.state = {
      selectedOperation: MultiCommitOperationKind.Merge,
      rebasePreview: null,
    }
  }

  private isUpdateBranchDisabled(): boolean {
    if (this.commitCount <= 0) {
      return true
    }

    const { selectedOperation, rebasePreview } = this.state
    if (selectedOperation === MultiCommitOperationKind.Rebase) {
      return (
        rebasePreview === null || rebasePreview.kind !== ComputedAction.Clean
      )
    }

    return (
      this.props.mergeStatus != null &&
      this.props.mergeStatus.kind === ComputedAction.Invalid
    )
  }

  private updateRebasePreview = async (baseBranch: Branch) => {
    const { currentBranch: targetBranch, repository } = this.props
    updateRebasePreview(baseBranch, targetBranch, repository, rebasePreview => {
      this.setState({ rebasePreview })
    })
  }

  private onOperationChange = (option: IDropdownSelectButtonOption) => {
    if (!isIdMultiCommitOperation(option.id)) {
      return
    }

    this.setState({ selectedOperation: option.id })
    if (option.id === MultiCommitOperationKind.Rebase) {
      this.updateRebasePreview(this.props.comparisonBranch)
    }
  }

  private onOperationInvoked = async (
    event: React.MouseEvent<HTMLButtonElement>,
    selectedOption: IDropdownSelectButtonOption
  ) => {
    if (!isIdMultiCommitOperation(selectedOption.id)) {
      return
    }
    event.preventDefault()

    const { dispatcher, repository } = this.props

    await this.dispatchOperation(selectedOption.id)

    dispatcher.executeCompare(repository, {
      kind: HistoryTabMode.History,
    })

    dispatcher.updateCompareForm(repository, {
      showBranchList: false,
      filterText: '',
    })
  }

  private async dispatchOperation(
    operation: MultiCommitOperationKind
  ): Promise<void> {
    const {
      dispatcher,
      currentBranch,
      comparisonBranch,
      repository,
      mergeStatus,
    } = this.props

    if (operation === MultiCommitOperationKind.Rebase) {
      const commits =
        this.state.rebasePreview !== null &&
        this.state.rebasePreview.kind === ComputedAction.Clean
          ? this.state.rebasePreview.commitsAhead
          : []
      return dispatcher.startRebase(
        repository,
        comparisonBranch,
        currentBranch,
        commits
      )
    }

    const isSquash = operation === MultiCommitOperationKind.Squash
    dispatcher.initializeMultiCommitOperation(
      repository,
      {
        kind: MultiCommitOperationKind.Merge,
        isSquash,
        sourceBranch: comparisonBranch,
      },
      currentBranch,
      [],
      currentBranch.tip.sha
    )
    dispatcher.incrementMetric('mergesInitiatedFromComparison')

    return dispatcher.mergeBranch(
      repository,
      comparisonBranch,
      mergeStatus,
      isSquash
    )
  }

  public render() {
    const disabled = this.isUpdateBranchDisabled()
    const mergeDetails = this.commitCount > 0 ? this.renderMergeStatus() : null

    return (
      <div className="merge-cta">
        {mergeDetails}

        <DropdownSelectButton
          checkedOption={this.state.selectedOperation}
          options={getMergeOptions()}
          dropdownAriaLabel="Merge options"
          disabled={disabled}
          onCheckedOptionChange={this.onOperationChange}
          onSubmit={this.onOperationInvoked}
        />
      </div>
    )
  }

  private renderMergeStatus() {
    if (this.computedAction === null) {
      return null
    }

    return (
      <div className="merge-status-component">
        <ActionStatusIcon
          status={{ kind: this.computedAction }}
          classNamePrefix="merge-status"
        />

        {this.renderStatusDetails()}
      </div>
    )
  }

  private renderStatusDetails() {
    const { currentBranch, comparisonBranch, mergeStatus } = this.props
    const { selectedOperation } = this.state
    if (this.computedAction === null) {
      return null
    }
    switch (this.computedAction) {
      case ComputedAction.Loading:
        return this.renderLoadingMessage()
      case ComputedAction.Clean:
        return this.renderCleanMessage(currentBranch, comparisonBranch)
      case ComputedAction.Invalid:
        return this.renderInvalidMessage()
    }

    if (
      selectedOperation !== MultiCommitOperationKind.Rebase &&
      mergeStatus !== null &&
      mergeStatus.kind === ComputedAction.Conflicts
    ) {
      return this.renderConflictedMergeMessage(
        currentBranch,
        comparisonBranch,
        mergeStatus.conflictedFiles
      )
    }
    return null
  }

  private renderLoadingMessage() {
    return (
      <div className="merge-message merge-message-loading">
        {t(
          'merge.checking-ability',
          'Checking for ability to {0} automatically…',
          {
            0: this.state.selectedOperation.toLowerCase(),
          }
        )}
      </div>
    )
  }

  private renderCleanMessage(currentBranch: Branch, branch: Branch) {
    if (this.commitCount <= 0) {
      return null
    }

    const pluralized =
      this.commitCount === 1
        ? t('common.commit', 'commit')
        : t('common.commits', 'commits')

    if (this.state.selectedOperation === MultiCommitOperationKind.Rebase) {
      return (
        <div className="merge-message">
          {t('merge.will-update', 'This will update ')}
          <strong>{currentBranch.name}</strong>
          {t('merge.will-update-2', ' by applying its ')}
          <strong>{`${this.commitCount} ${pluralized}`}</strong>
          {t('merge.will-update-3', ' on top of ')}
          <strong>{branch.name}</strong>
          {t('merge.will-update-4', ' ')}
        </div>
      )
    }

    return (
      <div className="merge-message">
        {t('merge.will-merge-1', 'This will merge')}
        <strong>{` ${this.commitCount} ${pluralized}`}</strong>
        {t('merge.will-merge-2', ' from ')}
        <strong>{branch.name}</strong>
        {t('merge.will-merge-3', ' into ')}
        <strong>{currentBranch.name}</strong>
        {t('merge.will-merge-4', ' ')}
      </div>
    )
  }

  private renderInvalidMessage() {
    if (this.state.selectedOperation === MultiCommitOperationKind.Rebase) {
      return (
        <div className="merge-message">
          {t(
            'merge.invalid-rebase',
            'Unable to start rebase. Check you have chosen a valid branch.'
          )}
        </div>
      )
    }

    return (
      <div className="merge-message">
        {t(
          'merge.invalid-merge',
          'Unable to merge unrelated histories in this repository'
        )}
      </div>
    )
  }

  private renderConflictedMergeMessage(
    currentBranch: Branch,
    branch: Branch,
    count: number
  ) {
    const pluralized =
      count === 1 ? t('common.file', 'file') : t('common.files', 'files')
    return (
      <div className="merge-message">
        {t('merge.conflicted-message-1', 'There will be')}
        <strong>
          {t('merge.conflicted-message-2', ' {{0}} conflicted {{1}}', {
            0: formatNumber(count),
            1: pluralized,
          })}
        </strong>
        {t('merge.conflicted-message-3', ' when merging ')}
        <strong>{branch.name}</strong>
        {t('merge.conflicted-message-4', ' into ')}
        <strong>{currentBranch.name}</strong>
        {t('merge.conflicted-message-5', ' ', {
          0: formatNumber(count),
          1: pluralized,
        })}
      </div>
    )
  }
}
