import * as React from 'react'
import * as Path from 'path'

import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Repository } from '../../models/repository'
import { IDeleteWorktreeOptions } from '../../models/worktree'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { t } from 'i18next'

interface IDeleteWorktreeDialogProps {
  readonly repository: Repository
  readonly worktreePath: string
  readonly options: IDeleteWorktreeOptions
  readonly askForConfirmationOnWorktreeRemoval: boolean
  readonly onDeleteWorktree: (
    repository: Repository,
    worktreePath: string,
    options?: IDeleteWorktreeOptions
  ) => Promise<void>
  readonly onConfirmWorktreeRemovalChanged: (value: boolean) => void
  readonly onDismissed: () => void
}

interface IDeleteWorktreeDialogState {
  readonly isDeleting: boolean
  readonly confirmWorktreeRemoval: boolean
}

export class DeleteWorktreeDialog extends React.Component<
  IDeleteWorktreeDialogProps,
  IDeleteWorktreeDialogState
> {
  public constructor(props: IDeleteWorktreeDialogProps) {
    super(props)

    this.state = {
      isDeleting: false,
      confirmWorktreeRemoval: props.askForConfirmationOnWorktreeRemoval,
    }
  }

  public render() {
    const isMissing = this.props.options.isMissing === true
    const name = Path.basename(this.props.worktreePath)

    const title = isMissing
      ? __DARWIN__
        ? t('delete-worktree.delete-missing-worktree-dialog-darwin', 'Remove Missing Worktree')
        : t('delete-worktree.delete-missing-worktree-dialog', 'Remove missing worktree')
      : __DARWIN__
        ? t('delete-worktree.delete-worktree-dialog-darwin', 'Delete Worktree')
        : t('delete-worktree.delete-worktree-dialog', 'Delete worktree')

    return (
      <Dialog
        id="delete-worktree"
        title={title}
        type="warning"
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        disabled={this.state.isDeleting}
        loading={this.state.isDeleting}
        role="alertdialog"
        ariaDescribedBy="delete-worktree-confirmation"
      >
        <DialogContent>
          <p id="delete-worktree-confirmation">
            {isMissing ? (
              <>
                {t('delete-worktree-dialog.missing-worktree-confirmation-1', 'The folder for the worktree ')}
                <Ref>{name}</Ref>
                {t('delete-worktree-dialog.missing-worktree-confirmation-2', ' no longer exists.\nRemove it from this repository?')}
              </>
            ) : (
              <>
                {t(
                  'delete-worktree-dialog.are-you-sure-1',
                  'Are you sure you want to delete the worktree '
                )}
                <Ref>{name}</Ref>
                {t('delete-worktree-dialog.are-you-sure-2', '?')}
              </>
            )}
          </p>
          {!isMissing && (
            <Checkbox
              label={t(
                'common.do-not-show-message-again',
                'Do not show this message again'
              )}
              value={
                this.state.confirmWorktreeRemoval
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onConfirmWorktreeRemovalChanged}
            />
          )}
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={isMissing ? t('common.remove', 'Remove') : t('common.delete', 'Delete')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onConfirmWorktreeRemovalChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked
    this.setState({ confirmWorktreeRemoval: value })
  }

  private onSubmit = async () => {
    this.setState({ isDeleting: true })

    this.props.onConfirmWorktreeRemovalChanged(
      this.state.confirmWorktreeRemoval
    )

    await this.props.onDeleteWorktree(
      this.props.repository,
      this.props.worktreePath,
      this.props.options
    )
    this.props.onDismissed()
  }
}
