import React from 'react'
import { getAheadBehind, revSymmetricDifference } from '../../../lib/git'
import { determineMergeability } from '../../../lib/git/merge-tree'
import { Branch } from '../../../models/branch'
import { ComputedAction } from '../../../models/computed-action'
import { MergeTreeResult } from '../../../models/merge'
import { MultiCommitOperationKind } from '../../../models/multi-commit-operation'
import { PopupType } from '../../../models/popup'
import { ActionStatusIcon } from '../../lib/action-status-icon'
import { t } from 'i18next'
import {
  ChooseBranchDialog,
  IBaseChooseBranchDialogProps,
  canStartOperation,
} from './base-choose-branch-dialog'
import { truncateWithEllipsis } from '../../../lib/truncate-with-ellipsis'

interface IMergeChooseBranchDialogState {
  readonly commitCount: number
  readonly mergeStatus: MergeTreeResult | null
  readonly selectedBranch: Branch | null
}

export class MergeChooseBranchDialog extends React.Component<
  IBaseChooseBranchDialogProps,
  IMergeChooseBranchDialogState
> {
  public constructor(props: IBaseChooseBranchDialogProps) {
    super(props)

    this.state = {
      selectedBranch: null,
      commitCount: 0,
      mergeStatus: null,
    }
  }

  private start = () => {
    if (!this.canStart()) {
      return
    }

    const { selectedBranch, mergeStatus } = this.state
    const { operation, dispatcher, repository } = this.props
    if (!selectedBranch) {
      return
    }

    dispatcher.mergeBranch(
      repository,
      selectedBranch,
      mergeStatus,
      operation === MultiCommitOperationKind.Squash
    )

    dispatcher.closePopup(PopupType.MultiCommitOperation)
  }

  private canStart = (): boolean => {
    const { currentBranch } = this.props
    const { selectedBranch, commitCount, mergeStatus } = this.state

    return canStartOperation(
      selectedBranch,
      currentBranch,
      commitCount,
      mergeStatus?.kind
    )
  }

  private onSelectionChanged = (selectedBranch: Branch | null) => {
    if (selectedBranch === null) {
      this.setState({ selectedBranch, commitCount: 0, mergeStatus: null })
    } else {
      this.setState(
        {
          selectedBranch,
          commitCount: 0,
          mergeStatus: { kind: ComputedAction.Loading },
        },
        () => this.updateStatus(selectedBranch)
      )
    }
  }

  private getDialogTitle = () => {
    const truncatedName = truncateWithEllipsis(
      this.props.currentBranch.name,
      40
    )
    const squashPrefix =
      this.props.operation === MultiCommitOperationKind.Squash
        ? t('merge-choose-branch-dialog.squash-and', 'Squash and ')
        : null
    return (
      <>
        {t('merge-choose-branch-dialog.merge-into-1', '{{0}}Merge into ', {
          0: squashPrefix,
        })}
        <strong>{truncatedName}</strong>
        {t('merge-choose-branch-dialog.merge-into-2', ' ', { 0: squashPrefix })}
      </>
    )
  }

  private updateStatus = async (branch: Branch) => {
    const { currentBranch, repository } = this.props

    const mergeStatus = await determineMergeability(
      repository,
      currentBranch,
      branch
    ).catch<MergeTreeResult>(e => {
      log.error('Failed determining mergeability', e)
      return { kind: ComputedAction.Clean }
    })

    // The user has selected a different branch since we started or the branch
    // has changed, so don't update the preview with stale data.
    //
    // We don't have to check if the state changed from underneath us if we
    // loaded the status from cache, because that means we never kicked off an
    // async operation.
    if (this.state.selectedBranch?.tip.sha !== branch.tip.sha) {
      return
    }

    // Can't go forward if the merge status is invalid, no need to check commit count
    if (mergeStatus.kind === ComputedAction.Invalid) {
      this.setState({ mergeStatus })
      return
    }

    // Commit count is used in the UI output as well as determining whether the
    // submit button is enabled
    const range = revSymmetricDifference('', branch.name)
    const aheadBehind = await getAheadBehind(repository, range)
    const commitCount = aheadBehind ? aheadBehind.behind : 0

    if (this.state.selectedBranch.tip.sha !== branch.tip.sha) {
      return
    }

    this.setState({ commitCount, mergeStatus })
  }

  private renderStatusPreviewMessage(): JSX.Element | null {
    const { mergeStatus, selectedBranch: branch } = this.state
    const { currentBranch } = this.props

    if (mergeStatus === null || branch === null) {
      return null
    }

    if (mergeStatus.kind === ComputedAction.Loading) {
      return this.renderLoadingMergeMessage()
    }

    if (mergeStatus.kind === ComputedAction.Clean) {
      return this.renderCleanMergeMessage(
        branch,
        currentBranch,
        this.state.commitCount
      )
    }

    if (mergeStatus.kind === ComputedAction.Invalid) {
      return this.renderInvalidMergeMessage()
    }

    return this.renderConflictedMergeMessage(
      branch,
      currentBranch,
      mergeStatus.conflictedFiles
    )
  }

  private renderLoadingMergeMessage() {
    return (
      <>
        {t(
          'merge-choose-branch-dialog.checking-for-ability',
          'Checking for ability to merge automatically...'
        )}
      </>
    )
  }

  private renderCleanMergeMessage(
    branch: Branch,
    currentBranch: Branch,
    commitCount: number
  ) {
    if (commitCount === 0) {
      return (
        <React.Fragment>
          {t(
            'merge-choose-branch-dialog.is-already-up-to-date-with-1',
            ` `
          )}
          <strong>{currentBranch.name}</strong>
          {t(
            'merge-choose-branch-dialog.is-already-up-to-date-with-2',
            ` This branch is up to date with `
          )}
          <strong>{branch.name}</strong>
          {t(
            'merge-choose-branch-dialog.is-already-up-to-date-with-3',
            ` `
          )}
        </React.Fragment>
      )
    }

    const pluralized =
      commitCount === 1
        ? t('common.one-commit', 'commit')
        : t('common.multiple-commits', 'commits')
    return (
      <React.Fragment>
        {t('merge-choose-branch-dialog.this-will-merge-1', 'This will merge ')}
        <strong>
          {t('merge-choose-branch-dialog.number-commit', `{{0}} {{1}}`, {
            0: commitCount,
            1: pluralized,
          })}
        </strong>
        {t('merge-choose-branch-dialog.this-will-merge-2', ` from `)}
        <strong>{branch.name}</strong>
        {t('merge-choose-branch-dialog.this-will-merge-3', ` into `)}
        <strong>{currentBranch.name}</strong>
        {t('merge-choose-branch-dialog.this-will-merge-4', ` `)}
      </React.Fragment>
    )
  }

  private renderInvalidMergeMessage() {
    return (
      <React.Fragment>
        {t(
          'merge-choose-branch-dialog.unable-to-merge-unrelated-histories',
          'Unable to merge unrelated histories in this repository'
        )}
      </React.Fragment>
    )
  }

  private renderConflictedMergeMessage(
    branch: Branch,
    currentBranch: Branch,
    count: number
  ) {
    const pluralized =
      count === 1
        ? t('merge-choose-branch-dialog.file', 'file')
        : t('merge-choose-branch-dialog.files', 'files')
    return (
      <React.Fragment>
        {t(
          'merge-choose-branch-dialog.there-will-be-number-conflicted-1',
          'There will be '
        )}
        <strong>
          {t(
            'merge-choose-branch-dialog.number-conflicted-file',
            `{{0}} conflicted {{1}}`,
            { 0: count, 1: pluralized }
          )}
        </strong>
        {t(
          'merge-choose-branch-dialog.there-will-be-number-conflicted-2',
          ` when merging `
        )}
        <strong>{branch.name}</strong>
        {t(
          'merge-choose-branch-dialog.there-will-be-number-conflicted-3',
          ` into `
        )}
        <strong>{currentBranch.name}</strong>
        {t('merge-choose-branch-dialog.there-will-be-number-conflicted-4', ` `)}
      </React.Fragment>
    )
  }

  private renderStatusPreview() {
    return (
      <>
        <ActionStatusIcon
          status={this.state.mergeStatus}
          classNamePrefix="merge-status"
        />
        <p className="merge-info" id="merge-status-preview">
          {this.renderStatusPreviewMessage()}
        </p>
      </>
    )
  }

  public render() {
    return (
      <ChooseBranchDialog
        {...this.props}
        start={this.start}
        selectedBranch={this.state.selectedBranch}
        canStartOperation={this.canStart()}
        dialogTitle={this.getDialogTitle()}
        onSelectionChanged={this.onSelectionChanged}
      >
        {this.renderStatusPreview()}
      </ChooseBranchDialog>
    )
  }
}
