import * as React from 'react'
import { encodePathAsUrl } from '../../lib/path'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'
import { t } from 'i18next'

const BlankSlateImage = encodePathAsUrl(
  __dirname,
  'static/empty-no-pull-requests.svg'
)

interface INoPullRequestsProps {
  /** The name of the repository. */
  readonly repositoryName: string

  /** Is the default branch currently checked out? */
  readonly isOnDefaultBranch: boolean

  /** Is this component being rendered due to a search? */
  readonly isSearch: boolean

  /* Called when the user wants to create a new branch. */
  readonly onCreateBranch: () => void

  /** Called when the user wants to create a pull request. */
  readonly onCreatePullRequest: () => void

  /** Are we currently loading pull requests? */
  readonly isLoadingPullRequests: boolean
}

/** The placeholder for when there are no open pull requests. */
export class NoPullRequests extends React.Component<INoPullRequestsProps, {}> {
  public render() {
    return (
      <div className="no-pull-requests">
        <img src={BlankSlateImage} className="blankslate-image" alt="" />
        {this.renderTitle()}
        {this.renderCallToAction()}
      </div>
    )
  }

  private renderTitle() {
    if (this.props.isSearch) {
      return (
        <div className="title">
          {t(
            'no-pull-requests.i-can-not-find-that-pull-request',
            `Sorry, I can't find that pull request!`
          )}
        </div>
      )
    } else if (this.props.isLoadingPullRequests) {
      return (
        <div className="title">
          {t('no-pull-requests.hang-tight', 'Hang tight')}
        </div>
      )
    } else {
      return (
        <div>
          <div className="title">
            {t('no-pull-requests.you-are-all-set', `You're all set!`)}
          </div>
          <div className="no-prs">
            {t(
              'no-pull-requests.no-open-pull-requests-1',
              'No open pull requests in '
            )}
            <Ref>{this.props.repositoryName}</Ref>
            {t('no-pull-requests.no-open-pull-requests-2', ' ')}
          </div>
        </div>
      )
    }
  }

  private renderCallToAction() {
    if (this.props.isLoadingPullRequests) {
      return (
        <div className="call-to-action">
          {t(
            'no-pull-requests.loading-pull-requests-fast',
            'Loading pull requests as fast as I can!'
          )}
        </div>
      )
    }

    if (this.props.isOnDefaultBranch) {
      return (
        <div className="call-to-action">
          {t(
            'no-pull-requests.would-you-like-creat-a-new-branch-1',
            'Would you like to '
          )}
          <LinkButton onClick={this.props.onCreateBranch}>
            {t('no-pull-requests.creat-a-new-branch', 'create a new branch')}
          </LinkButton>
          {t(
            'no-pull-requests.would-you-like-creat-a-new-branch-2',
            ' and get going on your next project?'
          )}
        </div>
      )
    } else {
      return (
        <div className="call-to-action">
          {t(
            'no-pull-requests.would-you-like-creat-a-pull-request-1',
            'Would you like to '
          )}
          <LinkButton onClick={this.props.onCreatePullRequest}>
            {t(
              'no-pull-requests.creat-a-pull-request',
              'create a pull request'
            )}
          </LinkButton>
          {t(
            'no-pull-requests.would-you-like-creat-a-pull-request-2',
            ' from the current branch?'
          )}
        </div>
      )
    }
  }
}
