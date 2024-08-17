import * as React from 'react'
import { Dispatcher } from '../dispatcher'
import { Branch } from '../../models/branch'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Repository } from '../../models/repository'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IPushBranchCommitsProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly branch: Branch
  readonly onConfirm: (repository: Repository, branch: Branch) => void
  readonly onDismissed: () => void

  /**
   * Used to show the number of commits a branch is ahead by.
   * If this value is undefined, component defaults to publish view.
   */
  readonly unPushedCommits?: number
}

interface IPushBranchCommitsState {
  /**
   * A value indicating whether we're currently working on publishing
   * or pushing the branch to the remote. This value is used to tell
   * the dialog to apply the loading and disabled state which adds a
   * spinner and disables form controls for the duration of the operation.
   */
  readonly isPushingOrPublishing: boolean
}

/**
 * Returns a string used for communicating the number of commits
 * that will be pushed to the user.
 *
 * @param numberOfCommits The number of commits that will be pushed
 */
function pluralizeLocalCommits(numberOfCommits: number) {
  return numberOfCommits === 1
    ? t('push-branch-commits.local-commit', `{{0}} local commit`, {
        0: numberOfCommits,
      })
    : t('push-branch-commits.local-commits', `{{0}} local commits`, {
        0: numberOfCommits,
      })
}

/**
 * Simple type guard which allows us to substitute the non-obvious
 * this.props.unPushedCommits === undefined checks with
 * renderPublishView(this.props.unPushedCommits).
 */
function renderPublishView(
  unPushedCommits: number | undefined
): unPushedCommits is undefined {
  return unPushedCommits === undefined
}

/**
 * This component gets shown if the user attempts to open a PR with
 * a) An un-published branch
 * b) A branch that is ahead of its base branch
 *
 * In both cases, this asks the user if they'd like to push/publish the branch.
 * If they confirm we push/publish then open the PR page on dotcom.
 */
export class PushBranchCommits extends React.Component<
  IPushBranchCommitsProps,
  IPushBranchCommitsState
> {
  public constructor(props: IPushBranchCommitsProps) {
    super(props)

    this.state = { isPushingOrPublishing: false }
  }

  public render() {
    return (
      <Dialog
        id="push-branch-commits"
        key="push-branch-commits"
        title={this.renderDialogTitle()}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        loading={this.state.isPushingOrPublishing}
        disabled={this.state.isPushingOrPublishing}
        role="alertdialog"
        ariaDescribedBy="push-branch-commits-title push-branch-commits-message"
      >
        {this.renderDialogContent()}

        <DialogFooter>{this.renderButtonGroup()}</DialogFooter>
      </Dialog>
    )
  }

  private renderDialogContent() {
    if (renderPublishView(this.props.unPushedCommits)) {
      return (
        <DialogContent>
          <p id="push-branch-commits-title">
            {t(
              'push-branch-commits.your-branch-must-be-published',
              'Your branch must be published before opening a pull request.'
            )}
          </p>
          <p id="push-branch-commits-message">
            {t(
              'push-branch-commits.would-you-like-to-publish-1',
              'Would you like to publish '
            )}
            <Ref>{this.props.branch.name}</Ref>
            {t(
              'push-branch-commits.would-you-like-to-publish-2',
              ' now and open a pull request?'
            )}
          </p>
        </DialogContent>
      )
    }

    const localCommits = pluralizeLocalCommits(this.props.unPushedCommits)

    return (
      <DialogContent>
        <p id="push-branch-commits-title">
          {t(
            'push-branch-commits.you-have-local-commits-that',
            `You have {{0}} that haven't been pushed to the remote yet.`,
            { 0: localCommits }
          )}
        </p>
        <p id="push-branch-commits-message">
          {t(
            'push-branch-commits.would-you-like-to-push-1',
            'Would you like to push your changes to '
          )}
          <Ref>{this.props.branch.name}</Ref>
          {t(
            'push-branch-commits.would-you-like-to-push-2',
            ' before creating your pull request?'
          )}
        </p>
      </DialogContent>
    )
  }

  private renderDialogTitle() {
    if (renderPublishView(this.props.unPushedCommits)) {
      return __DARWIN__
        ? t('push-branch-commits.publish-branch-q-darwin', 'Publish Branch?')
        : t('push-branch-commits.publish-branch-q', 'Publish branch?')
    }

    return __DARWIN__
      ? t(
          'push-branch-commits.push-local-changes-q-darwin',
          `Push Local Changes?`
        )
      : t('push-branch-commits.push-local-changes-q', `Push local changes?`)
  }

  private renderButtonGroup() {
    if (renderPublishView(this.props.unPushedCommits)) {
      return (
        <OkCancelButtonGroup
          okButtonText={
            __DARWIN__
              ? t('push-branch-commits.publish-branch-darwin', 'Publish Branch')
              : t('push-branch-commits.publish-branch', 'Publish branch')
          }
        />
      )
    }

    return (
      <OkCancelButtonGroup
        okButtonText={
          __DARWIN__
            ? t('push-branch-commits.push-commits-darwin', 'Push Commits')
            : t('push-branch-commits.push-commits', 'Push commits')
        }
        cancelButtonText={
          __DARWIN__
            ? t(
                'push-branch-commits.create-without-pushing-darwin',
                'Create Without Pushing'
              )
            : t(
                'push-branch-commits.create-without-pushing',
                'Create without pushing'
              )
        }
        onCancelButtonClick={this.onCreateWithoutPushButtonClick}
      />
    )
  }

  private onCreateWithoutPushButtonClick = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault()
    this.props.onConfirm(this.props.repository, this.props.branch)
    this.props.onDismissed()
  }

  private onSubmit = async () => {
    const { repository, branch } = this.props

    this.setState({ isPushingOrPublishing: true })

    try {
      await this.props.dispatcher.push(repository)
    } finally {
      this.setState({ isPushingOrPublishing: false })
    }

    this.props.onConfirm(repository, branch)
    this.props.onDismissed()
  }
}
