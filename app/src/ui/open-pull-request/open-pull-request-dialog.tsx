import * as React from 'react'
import { IConstrainedValue, IPullRequestState } from '../../lib/app-state'
import { getDotComAPIEndpoint } from '../../lib/api'
import { Branch } from '../../models/branch'
import { ImageDiffType } from '../../models/diff'
import { Repository } from '../../models/repository'
import { DialogFooter, OkCancelButtonGroup, Dialog } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { Ref } from '../lib/ref'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import {
  OpenPullRequestDialogHeader,
  OpenPullRequestDialogId,
} from './open-pull-request-header'
import { PullRequestFilesChanged } from './pull-request-files-changed'
import { PullRequestMergeStatus } from './pull-request-merge-status'
import { ComputedAction } from '../../models/computed-action'
import { t } from 'i18next'

interface IOpenPullRequestDialogProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher

  /**
   * The IRepositoryState.pullRequestState
   */
  readonly pullRequestState: IPullRequestState

  /**
   * The currently checked out branch
   */
  readonly currentBranch: Branch

  /**
   * See IBranchesState.defaultBranch
   */
  readonly defaultBranch: Branch | null

  /**
   * Branches in the repo with the repo's default remote
   *
   * We only want branches that are also on dotcom such that, when we ask a user
   * to create a pull request, the base branch also exists on dotcom.
   */
  readonly prBaseBranches: ReadonlyArray<Branch>

  /**
   * Recent branches with the repo's default remote
   *
   * We only want branches that are also on dotcom such that, when we ask a user
   * to create a pull request, the base branch also exists on dotcom.
   */
  readonly prRecentBaseBranches: ReadonlyArray<Branch>

  /** Whether we should display side by side diffs. */
  readonly showSideBySideDiff: boolean

  /** Whether we should hide whitespace in diff. */
  readonly hideWhitespaceInDiff: boolean

  /** The type of image diff to display. */
  readonly imageDiffType: ImageDiffType

  /** Label for selected external editor */
  readonly externalEditorLabel?: string

  /**
   * Callback to open a selected file using the configured external editor
   *
   * @param fullPath The full path to the file on disk
   */
  readonly onOpenInExternalEditor: (fullPath: string) => void

  /** Width to use for the files list pane in the files changed view */
  readonly fileListWidth: IConstrainedValue

  /** If the latest commit of the pull request is not local, this will contain
   * it's SHA  */
  readonly nonLocalCommitSHA: string | null

  /** Whether the current branch already has a pull request*/
  readonly currentBranchHasPullRequest: boolean

  /** Called to dismiss the dialog */
  readonly onDismissed: () => void
}

/** The component for start a pull request. */
export class OpenPullRequestDialog extends React.Component<IOpenPullRequestDialogProps> {
  private onCreatePullRequest = () => {
    const { currentBranchHasPullRequest, dispatcher, repository, onDismissed } =
      this.props

    if (currentBranchHasPullRequest) {
      dispatcher.showPullRequest(repository)
    } else {
      const { baseBranch } = this.props.pullRequestState
      dispatcher.createPullRequest(repository, baseBranch ?? undefined)
      dispatcher.incrementMetric('createPullRequestCount')
      dispatcher.incrementMetric('createPullRequestFromPreviewCount')
    }

    onDismissed()
  }

  private onBranchChange = (branch: Branch) => {
    const { repository } = this.props
    this.props.dispatcher.updatePullRequestBaseBranch(repository, branch)
  }

  private renderHeader() {
    const {
      currentBranch,
      pullRequestState,
      defaultBranch,
      prBaseBranches,
      prRecentBaseBranches,
    } = this.props
    const { baseBranch, commitSelection, commitSHAs } = pullRequestState
    if (commitSelection === null) {
      // type checking - will render no default branch message
      return
    }

    const { changesetData } = commitSelection

    return (
      <OpenPullRequestDialogHeader
        repository={this.props.repository}
        baseBranch={baseBranch}
        currentBranch={currentBranch}
        defaultBranch={defaultBranch}
        prBaseBranches={prBaseBranches}
        prRecentBaseBranches={prRecentBaseBranches}
        commitCount={commitSHAs?.length ?? 0}
        changesetData={changesetData}
        onBranchChange={this.onBranchChange}
        onDismissed={this.props.onDismissed}
      />
    )
  }

  private renderContent() {
    return (
      <div className="open-pull-request-content">
        {this.renderNoChanges()}
        {this.renderNoDefaultBranch()}
        {this.renderFilesChanged()}
      </div>
    )
  }

  private renderFilesChanged() {
    const {
      dispatcher,
      externalEditorLabel,
      hideWhitespaceInDiff,
      imageDiffType,
      pullRequestState,
      repository,
      fileListWidth,
      nonLocalCommitSHA,
    } = this.props
    const { commitSelection } = pullRequestState
    if (commitSelection === null) {
      // type checking - will render no default branch message
      return
    }

    const { diff, file, changesetData, shas } = commitSelection
    const { files } = changesetData

    if (shas.length === 0) {
      return
    }

    return (
      <PullRequestFilesChanged
        diff={diff}
        dispatcher={dispatcher}
        externalEditorLabel={externalEditorLabel}
        fileListWidth={fileListWidth}
        files={files}
        hideWhitespaceInDiff={hideWhitespaceInDiff}
        imageDiffType={imageDiffType}
        nonLocalCommitSHA={nonLocalCommitSHA}
        selectedFile={file}
        showSideBySideDiff={this.props.showSideBySideDiff}
        repository={repository}
        onOpenInExternalEditor={this.props.onOpenInExternalEditor}
      />
    )
  }

  private renderNoChanges() {
    const { pullRequestState, currentBranch } = this.props
    const { commitSelection, baseBranch, mergeStatus } = pullRequestState
    if (commitSelection === null || baseBranch === null) {
      // type checking - will render no default branch message
      return
    }

    const { shas } = commitSelection
    if (shas.length !== 0) {
      return
    }
    const hasMergeBase = mergeStatus?.kind !== ComputedAction.Invalid
    const message = hasMergeBase ? (
      <>
        <Ref>{baseBranch.name}</Ref>
        {t(
          'open-pull-request-dialog.is-up-to-date-with-1',
          ' is up to date with all commits from '
        )}
        <Ref>{currentBranch.name}</Ref>
        {t('open-pull-request-dialog.is-up-to-date-with-2', '.')}
      </>
    ) : (
      <>
        <Ref>{baseBranch.name}</Ref> and <Ref>{currentBranch.name}</Ref> are
        entirely different commit histories.
      </>
    )
    return (
      <div className="open-pull-request-message">
        <div>
          <Octicon symbol={octicons.gitPullRequest} />
          <h3>
            {t(
              'open-pull-request-dialog.there_are_no_changes',
              'There are no changes.'
            )}
          </h3>
          {message}
        </div>
      </div>
    )
  }

  private renderNoDefaultBranch() {
    const { baseBranch } = this.props.pullRequestState

    if (baseBranch !== null) {
      return
    }

    return (
      <div className="open-pull-request-message">
        <div>
          <Octicon symbol={octicons.gitPullRequest} />
          <h3>
            {t(
              'open-pull-request-dialog.could-not-find-a-default-branch',
              'Could not find a default branch to compare against.'
            )}
          </h3>
          {t(
            'open-pull-request-dialog.select-a-base-branch-above',
            'Select a base branch above.'
          )}
        </div>
      </div>
    )
  }

  private renderFooter() {
    const { currentBranchHasPullRequest, pullRequestState, repository } =
      this.props
    const { mergeStatus, commitSHAs } = pullRequestState
    const gitHubRepository = repository.gitHubRepository
    const isEnterprise =
      gitHubRepository && gitHubRepository.endpoint !== getDotComAPIEndpoint()

    const viewCreate = currentBranchHasPullRequest
      ? t('open-pull-request-dialog.view', 'View')
      : t('open-pull-request-dialog.create', 'Create')
    const buttonTitle = t(
      'open-pull-request-dialog.button_title',
      '{{0}} pull request on GitHub{{1}}.',
      { 0: viewCreate, 1: isEnterprise ? ' Enterprise' : '' }
    )
    const requestCaption = __DARWIN__
      ? t('open-pull-request-dialog.request_darwin', '{{0}} Pull Request', {
          0: viewCreate,
        })
      : t('open-pull-request-dialog.request', '{{0}} Pull request', {
          0: viewCreate,
        })
    const okButton = (
      <>
        {currentBranchHasPullRequest && (
          <Octicon symbol={octicons.linkExternal} />
        )}
        {requestCaption}
      </>
    )

    return (
      <DialogFooter>
        <PullRequestMergeStatus mergeStatus={mergeStatus} />

        <OkCancelButtonGroup
          okButtonText={okButton}
          okButtonTitle={buttonTitle}
          cancelButtonText={t('common.cancel', 'Cancel')}
          okButtonDisabled={commitSHAs === null || commitSHAs.length === 0}
        />
      </DialogFooter>
    )
  }

  public render() {
    return (
      <Dialog
        titleId={OpenPullRequestDialogId}
        className="open-pull-request"
        onSubmit={this.onCreatePullRequest}
        onDismissed={this.props.onDismissed}
      >
        {this.renderHeader()}
        {this.renderContent()}
        {this.renderFooter()}
      </Dialog>
    )
  }
}
