import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Dispatcher } from '../dispatcher'
import { TrashNameLabel } from '../lib/context-menu'
import { RetryAction } from '../../models/retry-actions'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { t } from 'i18next'

interface IDiscardChangesRetryDialogProps {
  readonly dispatcher: Dispatcher
  readonly retryAction: RetryAction
  readonly onDismissed: () => void
  readonly onConfirmDiscardChangesChanged: (optOut: boolean) => void
}

interface IDiscardChangesRetryDialogState {
  readonly retrying: boolean
  readonly confirmDiscardChanges: boolean
}

export class DiscardChangesRetryDialog extends React.Component<
  IDiscardChangesRetryDialogProps,
  IDiscardChangesRetryDialogState
> {
  public constructor(props: IDiscardChangesRetryDialogProps) {
    super(props)
    this.state = { retrying: false, confirmDiscardChanges: true }
  }

  public render() {
    const { retrying } = this.state

    return (
      <Dialog
        title={
          __DARWIN__
            ? t(
                'discard-changes-retry-dialog.discarded-Changes-darwin',
                'Discarded Changes Will Be Unrecoverable'
              )
            : t(
                'discard-changes-retry-dialog.discarded-Changes',
                'Discarded changes will be unrecoverable'
              )
        }
        id="discard-changes-retry"
        loading={retrying}
        disabled={retrying}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        type="error"
      >
        <DialogContent>
          <p>
            {t(
              'discard-changes-retry-dialog.fail-to-discard-changes',
              'Failed to discard changes to {{0}}.',
              { 0: TrashNameLabel }
            )}
          </p>
          <div>
            {t(
              'discard-changes-retry-dialog.common-reasons-are',
              'Common reasons are:'
            )}
            <ul>
              <li>
                {t(
                  'discard-changes-retry-dialog.delete-items-immediately',
                  'The {{0}} is configured to delete items immediately.',
                  { 0: TrashNameLabel }
                )}
              </li>
              <li>
                {t(
                  'discard-changes-retry-dialog.restricted-access',
                  'Restricted access to move the file(s).'
                )}
              </li>
            </ul>
          </div>
          <p>
            {t(
              'discard-changes-retry-dialog.changes-will-be-unrecoverable',
              'These changes will be unrecoverable from the {{0}}.',
              { 0: TrashNameLabel }
            )}
          </p>
          {this.renderConfirmDiscardChanges()}
        </DialogContent>
        {this.renderFooter()}
      </Dialog>
    )
  }

  private renderConfirmDiscardChanges() {
    return (
      <Checkbox
        label={t(
          'common.do-not-show-message-again',
          'Do not show this message again'
        )}
        value={
          this.state.confirmDiscardChanges
            ? CheckboxValue.Off
            : CheckboxValue.On
        }
        onChange={this.onConfirmDiscardChangesChanged}
      />
    )
  }

  private renderFooter() {
    return (
      <DialogFooter>
        <OkCancelButtonGroup
          okButtonText={
            __DARWIN__
              ? t(
                  'discard-changes-retry-dialog.discard-changes-darwin',
                  'Permanently Discard Changes'
                )
              : t(
                  'discard-changes-retry-dialog.discard-changes',
                  'Permanently discard changes'
                )
          }
          okButtonTitle={t(
            'discard-changes-retry-dialog.discard-changes-ok',
            'This will discard changes and they will be unrecoverable.'
          )}
          cancelButtonText={t('common.cancel', 'Cancel')}
          destructive={true}
        />
      </DialogFooter>
    )
  }

  private onConfirmDiscardChangesChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ confirmDiscardChanges: value })
  }

  private onSubmit = async () => {
    const { dispatcher, retryAction } = this.props

    this.setState({ retrying: true })

    await dispatcher.performRetry(retryAction)

    this.props.onConfirmDiscardChangesChanged(this.state.confirmDiscardChanges)
    this.props.onDismissed()
  }
}
