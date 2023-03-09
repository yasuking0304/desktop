import * as React from 'react'

import { Dispatcher } from '../dispatcher'

import { Repository } from '../../models/repository'
import { Branch } from '../../models/branch'
import { PullRequest } from '../../models/pull-request'

import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IDeleteBranchProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly branch: Branch
  readonly pullRequest: PullRequest
  readonly onDismissed: () => void
}

export class DeletePullRequest extends React.Component<IDeleteBranchProps, {}> {
  public render() {
    return (
      <Dialog
        id="delete-branch"
        title={
          __DARWIN__
            ? t(
                'delete-pull-request-dialog.delete-branch-darwin',
                'Delete Branch'
              )
            : t('delete-pull-request-dialog.delete-branch', 'Delete branch')
        }
        type="warning"
        onDismissed={this.props.onDismissed}
        onSubmit={this.deleteBranch}
      >
        <DialogContent>
          <p>
            {t(
              'delete-pull-request-dialog.this-branch-may-have-an-open-1',
              'This branch may have an open pull request associated with it.'
            )}
          </p>
          <p>
            {t(
              'delete-pull-request-dialog.this-branch-may-have-an-open-2',
              'If '
            )}
            <LinkButton onClick={this.openPullRequest}>
              #{this.props.pullRequest.pullRequestNumber}
            </LinkButton>
            {t(
              'delete-pull-request-dialog.this-branch-may-have-an-open-3',
              ` has been merged, you can also go to GitHub to delete the remote
            branch.`
            )}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={t('common.delete', 'Delete')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private openPullRequest = () => {
    this.props.dispatcher.showPullRequest(this.props.repository)
  }

  private deleteBranch = () => {
    this.props.dispatcher.deleteLocalBranch(
      this.props.repository,
      this.props.branch
    )

    return this.props.onDismissed()
  }
}
