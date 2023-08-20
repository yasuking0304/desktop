import * as React from 'react'

import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { Branch } from '../../models/branch'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IDeleteRemoteBranchProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly branch: Branch
  readonly onDismissed: () => void
  readonly onDeleted: (repository: Repository) => void
}
interface IDeleteRemoteBranchState {
  readonly isDeleting: boolean
}
export class DeleteRemoteBranch extends React.Component<
  IDeleteRemoteBranchProps,
  IDeleteRemoteBranchState
> {
  public constructor(props: IDeleteRemoteBranchProps) {
    super(props)

    this.state = {
      isDeleting: false,
    }
  }

  public render() {
    return (
      <Dialog
        id="delete-branch"
        title={
          __DARWIN__
            ? t(
                'delete-remote-branch-dialog.delete-remote-branch-darwin',
                'Delete Remote Branch'
              )
            : t(
                'delete-remote-branch-dialog.delete-remote-branch',
                'Delete remote branch'
              )
        }
        type="warning"
        onSubmit={this.deleteBranch}
        onDismissed={this.props.onDismissed}
        disabled={this.state.isDeleting}
        loading={this.state.isDeleting}
        role="alertdialog"
        ariaDescribedBy="delete-branch-confirmation-message"
      >
        <DialogContent>
          <div id="delete-branch-confirmation-message">
            <p>
              {t(
                'delete-remote-branch-dialog.delete-remote-branch-content-1',
                'Delete remote branch '
              )}
              <Ref>{this.props.branch.name}</Ref>
              {t(
                'delete-remote-branch-dialog.delete-remote-branch-content-2',
                '?'
              )}
              <br />
              {t(
                'delete-remote-branch-dialog.this-action-cannot-be-undone',
                'This action cannot be undone.'
              )}
            </p>

            <p>
              {t(
                'delete-remote-branch-dialog.this-branch-does-not-exist-locally',
                `This branch does not exist locally. Deleting it may impact
                others collaborating on this branch.`
              )}
            </p>
          </div>
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

  private deleteBranch = async () => {
    const { dispatcher, repository, branch } = this.props

    this.setState({ isDeleting: true })

    await dispatcher.deleteRemoteBranch(repository, branch)
    this.props.onDeleted(repository)

    this.props.onDismissed()
  }
}
