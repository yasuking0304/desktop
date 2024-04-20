import * as React from 'react'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Ref } from '../lib/ref'
import { Repository } from '../../models/repository'
import { TrashNameLabel } from '../lib/context-menu'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IConfirmRemoveRepositoryProps {
  /** The repository to be removed */
  readonly repository: Repository

  /** The action to execute when the user confirms */
  readonly onConfirmation: (
    repo: Repository,
    deleteRepoFromDisk: boolean
  ) => Promise<void>

  /** The action to execute when the user cancels */
  readonly onDismissed: () => void
}

interface IConfirmRemoveRepositoryState {
  readonly deleteRepoFromDisk: boolean
  readonly isRemovingRepository: boolean
}

export class ConfirmRemoveRepository extends React.Component<
  IConfirmRemoveRepositoryProps,
  IConfirmRemoveRepositoryState
> {
  public constructor(props: IConfirmRemoveRepositoryProps) {
    super(props)

    this.state = {
      deleteRepoFromDisk: false,
      isRemovingRepository: false,
    }
  }

  private onSubmit = async () => {
    this.setState({ isRemovingRepository: true })

    await this.props.onConfirmation(
      this.props.repository,
      this.state.deleteRepoFromDisk
    )

    this.props.onDismissed()
  }

  public render() {
    const isRemovingRepository = this.state.isRemovingRepository

    return (
      <Dialog
        id="confirm-remove-repository"
        key="remove-repository-confirmation"
        type="warning"
        title={
          __DARWIN__
            ? t(
                'confirm-remove-repository.remove-repositry-darwin',
                'Remove Repository'
              )
            : t(
                'confirm-remove-repository.remove-repositry',
                'Remove repository'
              )
        }
        dismissDisabled={isRemovingRepository}
        loading={isRemovingRepository}
        disabled={isRemovingRepository}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
      >
        <DialogContent>
          <p>
            {t(
              'confirm-remove-repository.you-want-to-remove-repository-1',
              'Are you sure you want to remove the repository "'
            )}
            {this.props.repository.name}
            {t(
              'confirm-remove-repository.you-want-to-remove-repository-2',
              '" from GitHub Desktop?'
            )}
          </p>
          <div className="description">
            <p>
              {t(
                'confirm-remove-repository.the-repository-will-be-removed',
                'The repository will be removed from GitHub Desktop:'
              )}
            </p>
            <p>
              <Ref>{this.props.repository.path}</Ref>
           </p>
          </div>

          <div>
            <Checkbox
              label={t(
                'confirm-remove-repository.also-move-this-repository',
                'Also move this repository to {{0}}',
                { 0: TrashNameLabel }
              )}
              value={
                this.state.deleteRepoFromDisk
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmRepositoryDeletion}
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={t('common.remove', 'Remove')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onConfirmRepositoryDeletion = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ deleteRepoFromDisk: value })
  }
}
