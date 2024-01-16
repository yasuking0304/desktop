import * as React from 'react'

import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IDeleteTagProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly tagName: string
  readonly onDismissed: () => void
}

interface IDeleteTagState {
  readonly isDeleting: boolean
}

export class DeleteTag extends React.Component<
  IDeleteTagProps,
  IDeleteTagState
> {
  public constructor(props: IDeleteTagProps) {
    super(props)

    this.state = {
      isDeleting: false,
    }
  }

  public render() {
    return (
      <Dialog
        id="delete-tag"
        title={
          __DARWIN__
            ? t('delete-tag-dialog.delete-tag-darwin', 'Delete Tag')
            : t('delete-tag-dialog.delete-tag', 'Delete tag')
        }
        type="warning"
        onSubmit={this.DeleteTag}
        onDismissed={this.props.onDismissed}
        disabled={this.state.isDeleting}
        loading={this.state.isDeleting}
        role="alertdialog"
        ariaDescribedBy="delete-tag-confirmation"
      >
        <DialogContent>
          <p id="delete-tag-confirmation">
            {t(
              'delete-tag-dialog.are-you-sure-you-want-to-delete-the-tag-1',
              'Are you sure you want to delete the tag '
            )}
            <Ref>{this.props.tagName}</Ref>
            {t(
              'delete-tag-dialog.are-you-sure-you-want-to-delete-the-tag-2',
              '?'
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

  private DeleteTag = async () => {
    const { dispatcher, repository, tagName } = this.props

    this.setState({ isDeleting: true })

    await dispatcher.deleteTag(repository, tagName)
    this.props.onDismissed()
  }
}
