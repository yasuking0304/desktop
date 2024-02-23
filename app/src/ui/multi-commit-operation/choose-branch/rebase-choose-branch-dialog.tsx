import React from 'react'
import { Branch } from '../../../models/branch'
import { ComputedAction } from '../../../models/computed-action'
import { RebasePreview } from '../../../models/rebase'
import { ActionStatusIcon } from '../../lib/action-status-icon'
import { updateRebasePreview } from '../../lib/update-branch'
import { t } from 'i18next'
import {
  ChooseBranchDialog,
  IBaseChooseBranchDialogProps,
  canStartOperation,
} from './base-choose-branch-dialog'
import { truncateWithEllipsis } from '../../../lib/truncate-with-ellipsis'

interface IRebaseChooseBranchDialogState {
  readonly rebasePreview: RebasePreview | null
  readonly selectedBranch: Branch | null
}

export class RebaseChooseBranchDialog extends React.Component<
  IBaseChooseBranchDialogProps,
  IRebaseChooseBranchDialogState
> {
  public constructor(props: IBaseChooseBranchDialogProps) {
    super(props)

    this.state = {
      selectedBranch: null,
      rebasePreview: null,
    }
  }

  private start = () => {
    if (!this.canStart()) {
      return
    }

    const { selectedBranch, rebasePreview } = this.state
    const { repository, currentBranch, dispatcher } = this.props

    // Just type checking here, this shouldn't be possible
    if (
      selectedBranch === null ||
      rebasePreview === null ||
      rebasePreview.kind !== ComputedAction.Clean
    ) {
      return
    }

    dispatcher.startRebase(
      repository,
      selectedBranch,
      currentBranch,
      rebasePreview.commits
    )
  }

  private canStart = (): boolean => {
    const { currentBranch } = this.props
    const { selectedBranch, rebasePreview } = this.state
    const commitCount =
      rebasePreview?.kind === ComputedAction.Clean
        ? rebasePreview.commits.length
        : undefined
    return canStartOperation(
      selectedBranch,
      currentBranch,
      commitCount,
      rebasePreview?.kind
    )
  }

  private onSelectionChanged = (selectedBranch: Branch | null) => {
    this.setState({ selectedBranch })

    if (selectedBranch === null) {
      this.setState({ rebasePreview: null })
      return
    }

    this.updateStatus(selectedBranch)
  }

  private getSubmitButtonToolTip = () => {
    const { currentBranch } = this.props
    const { selectedBranch, rebasePreview } = this.state

    const selectedBranchIsCurrentBranch =
      selectedBranch !== null &&
      currentBranch !== null &&
      selectedBranch.name === currentBranch.name

    const areCommitsToRebase =
      rebasePreview?.kind === ComputedAction.Clean
        ? rebasePreview.commits.length > 0
        : false

    return selectedBranchIsCurrentBranch
      ? t(
          'rebase-choose-branch-dialog.you-are-not-able-to-rebase',
          'You are not able to rebase this branch onto itself.'
        )
      : !areCommitsToRebase
      ? t(
          'rebase-choose-branch-dialog.there-are-no-commits',
          'There are no commits on the current branch to rebase.'
        )
      : undefined
  }

  private getDialogTitle = () => {
    const truncatedName = truncateWithEllipsis(
      this.props.currentBranch.name,
      40
    )
    return (
      <>
        {t('rebase-choose-branch-dialog.rebase-1', 'Rebase ')}
        <strong>{truncatedName}</strong>
        {t('rebase-choose-branch-dialog.rebase-2', ' ')}
      </>
    )
  }

  private updateStatus = async (baseBranch: Branch) => {
    const { currentBranch: targetBranch, repository } = this.props
    updateRebasePreview(baseBranch, targetBranch, repository, rebasePreview => {
      this.setState({ rebasePreview })
    })
  }

  private renderStatusPreviewMessage(): JSX.Element | null {
    const { rebasePreview, selectedBranch: baseBranch } = this.state
    if (rebasePreview == null || baseBranch == null) {
      return null
    }

    const { currentBranch } = this.props

    if (rebasePreview.kind === ComputedAction.Loading) {
      return this.renderLoadingRebaseMessage()
    }
    if (rebasePreview.kind === ComputedAction.Clean) {
      return this.renderCleanRebaseMessage(
        currentBranch,
        baseBranch,
        rebasePreview.commits.length
      )
    }

    if (rebasePreview.kind === ComputedAction.Invalid) {
      return this.renderInvalidRebaseMessage()
    }

    return null
  }

  private renderLoadingRebaseMessage() {
    return (
      <>
        {t(
          'rebase-choose-branch-dialog.checking-for-ability-to-rebase',
          'Checking for ability to rebase automatically…'
        )}
      </>
    )
  }

  private renderInvalidRebaseMessage() {
    return (
      <>
        {t(
          'rebase-choose-branch-dialog.unable-to-start-rebase',
          'Unable to start rebase. Check you have chosen a valid branch.'
        )}
      </>
    )
  }

  private renderCleanRebaseMessage(
    currentBranch: Branch,
    baseBranch: Branch,
    commitsToRebase: number
  ) {
    if (commitsToRebase <= 0) {
      return (
        <>
          {t(
            'rebase-choose-branch-dialog.this-branch-is-up-to-date-with-1',
            `This branch is up to date with `
          )}
          <strong>{currentBranch.name}</strong>
          {t(
            'rebase-choose-branch-dialog.this-branch-is-up-to-date-with-2',
            ' '
          )}
        </>
      )
    }

    const pluralized =
      commitsToRebase === 1
        ? t('common.one-commit', 'commit')
        : t('common.multiple-commits', 'commits')
    return (
      <>
        {t(
          'rebase-choose-branch-dialog.this-will-update-1',
          'This will update '
        )}
        <strong>{currentBranch.name}</strong>
        {t(
          'rebase-choose-branch-dialog.this-will-update-2',
          ` by applying its `
        )}
        <strong>
          {t('rebase-choose-branch-dialog.number-commit', ` {{0}} {{1}}`, {
            0: commitsToRebase,
            1: pluralized,
          })}
        </strong>
        {t('rebase-choose-branch-dialog.this-will-update-3', ` on top of `)}
        <strong>{baseBranch.name}</strong>
        {t('rebase-choose-branch-dialog.this-will-update-4', ` `)}
      </>
    )
  }

  private renderStatusPreview() {
    return (
      <>
        <ActionStatusIcon
          status={this.state.rebasePreview}
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
        submitButtonTooltip={this.getSubmitButtonToolTip()}
        onSelectionChanged={this.onSelectionChanged}
      >
        {this.renderStatusPreview()}
      </ChooseBranchDialog>
    )
  }
}
