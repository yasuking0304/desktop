import * as React from 'react'
import * as Path from 'path'

import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Repository } from '../../models/repository'
import { getUnderlyingError, isRawGitError } from '../app-error'
import { Terminal } from '../terminal'
import { WorktreeEntry } from '../../models/worktree'
import { t } from 'i18next'

interface IDeleteWorktreeFailedDialogProps {
  readonly repository: Repository
  readonly worktreePath: string
  readonly onDeleteWorktree: (
    repository: Repository,
    worktreePath: string,
    force: boolean
  ) => Promise<void>
  readonly onSwitchToWorktree: (
    repository: Repository,
    worktree: WorktreeEntry
  ) => Promise<void>
  readonly error: Error
  readonly originalWorktree: WorktreeEntry | null
  readonly onDismissed: () => void
}

interface IDeleteWorktreeFailedDialogState {
  readonly isDeleting: boolean
}

export class DeleteWorktreeFailedDialog extends React.Component<
  IDeleteWorktreeFailedDialogProps,
  IDeleteWorktreeFailedDialogState
> {
  public constructor(props: IDeleteWorktreeFailedDialogProps) {
    super(props)

    this.state = {
      isDeleting: false,
    }
  }

  public render() {
    const name = Path.basename(this.props.worktreePath)

    return (
      <Dialog
        id="delete-worktree-failed"
        title={
          __DARWIN__
            ? t(
                'delete-worktree-failed-dialog.title-darwin',
                'Delete Worktree Failed'
              )
            : t('delete-worktree-failed-dialog.title', 'Delete worktree failed')
        }
        type="error"
        onSubmit={this.onSubmit}
        onDismissed={this.onDismissed}
        disabled={this.state.isDeleting}
        loading={this.state.isDeleting}
        role="alertdialog"
        ariaDescribedBy="delete-worktree-failed-message"
      >
        <DialogContent>
          <div id="delete-worktree-failed-message">
            <p>
              {t(
                'delete-worktree-failed-dialog.deleting-the-worktree-1',
                'Deleting the worktree '
              )}
              <Ref>{name}</Ref>
              {t(
                'delete-worktree-failed-dialog.dialog.deleting-the-worktree-2',
                ' failed.'
              )}
            </p>
            {this.renderErrorMessage()}
            <p>
              {t(
                'delete-worktree-failed-dialog.would-you-like-to-forcefully-1',
                'Would you like to forcefully delete the worktree '
              )}
              <Ref>{name}</Ref>
              {t(
                'delete-worktree-failed-dialog.would-you-like-to-forcefully-2',
                '?'
              )}
            </p>
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={
              __DARWIN__
                ? t(
                    'delete-worktree-failed-dialog.force-delete',
                    'Forcefully delete'
                  )
                : t(
                    'delete-worktree-failed-dialog.force-delete',
                    'Forcefully delete'
                  )
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderErrorMessage() {
    const e = getUnderlyingError(this.props.error)

    if (isRawGitError(e)) {
      return <Terminal terminalOutput={e.message} rows={8} cols={80} />
    }

    return <p>{e.toString()}</p>
  }

  private onDismissed = () => {
    const { originalWorktree, repository } = this.props

    if (originalWorktree !== null) {
      this.props.onSwitchToWorktree(repository, originalWorktree)
    }

    this.props.onDismissed()
  }

  private onSubmit = async () => {
    this.setState({ isDeleting: true })
    await this.props.onDeleteWorktree(
      this.props.repository,
      this.props.worktreePath,
      true
    )
    this.props.onDismissed()
  }
}
