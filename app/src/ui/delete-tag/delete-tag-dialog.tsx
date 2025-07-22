import * as React from 'react'

import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { Dialog, DialogDanger, DialogContent, DialogFooter } from '../dialog'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IDeleteTagProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly tagName: string
  readonly onDismissed: () => void
  readonly tagsToPush?: ReadonlyArray<string>
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
    const isRemote = this.isRemoteTag()
    const comfirmMessage = this.comfirmMessage()

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
        {isRemote && <DialogDanger>{isRemote}</DialogDanger>}

        <DialogContent>{comfirmMessage}</DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={t('common.delete', 'Delete')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private comfirmMessage(): JSX.Element | null {
    const isLocalTagName =
      this.props.tagsToPush &&
      this.props.tagsToPush.includes(this.props.tagName)
    if (!isLocalTagName) {
      return (
        <p id="delete-tag-confirmation">
          {t(
            'delete-tag-dialog.do-you-still-want-to-delete-the-tag',
            'Do you still want to delete the tag?'
          )}
        </p>
      )
    }
    return (
      <p id="delete-tag-confirmation">
        {t(
          'delete-tag-dialog.are-you-sure-you-want-to-delete-the-tag-1',
          'Are you sure you want to delete the tag '
        )}
        <Ref>{this.props.tagName}</Ref>
        {t('delete-tag-dialog.are-you-sure-you-want-to-delete-the-tag-2', '?')}
      </p>
    )
  }

  private isRemoteTag(): JSX.Element | null {
    const isLocalTagName =
      this.props.tagsToPush &&
      this.props.tagsToPush.includes(this.props.tagName)
    if (!isLocalTagName) {
      return (
        <>
          {t(
            'delete-tag-dialog.tag-named-is-present-on-the-remote-1',
            'A tag named '
          )}
          <Ref>{this.props.tagName}</Ref>
          {t(
            'delete-tag-dialog.tag-named-is-present-on-the-remote-2',
            ` is present on the remote.\n
            This tag may be in use and deleting it may cause problems.\n
            We recommend that you consult with your system administrator\n
            before deleting it.`
          )}
        </>
      )
    }
    return null
  }

  private DeleteTag = async () => {
    const { dispatcher, repository, tagName } = this.props

    this.setState({ isDeleting: true })

    await dispatcher.deleteTag(repository, tagName)
    this.props.onDismissed()
  }
}
