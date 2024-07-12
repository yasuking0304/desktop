import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../../dialog'
import { OkCancelButtonGroup } from '../../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IConfirmAbortDialogProps {
  /**
   * This is expected to be capitalized for correct output on windows and macOs.
   *
   * Examples:
   *  - Rebase
   *  - Cherry-pick
   *  - Squash
   */
  readonly operation: string
  readonly onReturnToConflicts: () => void
  readonly onConfirmAbort: () => Promise<void>
}

interface IConfirmAbortDialogState {
  readonly isAborting: boolean
}

export class ConfirmAbortDialog extends React.Component<
  IConfirmAbortDialogProps,
  IConfirmAbortDialogState
> {
  public constructor(props: IConfirmAbortDialogProps) {
    super(props)
    this.state = {
      isAborting: false,
    }
  }

  private onSubmit = async () => {
    this.setState({
      isAborting: true,
    })

    await this.props.onConfirmAbort()

    this.setState({
      isAborting: false,
    })
  }

  private onCancel = async () => {
    return this.props.onReturnToConflicts()
  }

  public render() {
    const { operation } = this.props
    return (
      <Dialog
        id="abort-warning"
        title={
          __DARWIN__
            ? t(
                'confirm-abort-dialog.confirm-abort-darwin',
                `Confirm Abort {{0}}`,
                { 0: operation }
              )
            : t('confirm-abort-dialog.confirm-abort', `Confirm abort {{0}}`, {
                0: operation.toLowerCase(),
              })
        }
        onDismissed={this.onCancel}
        onSubmit={this.onSubmit}
        disabled={this.state.isAborting}
        type="warning"
        role="alertdialog"
        ariaDescribedBy="abort-operation-confirmation"
      >
        <DialogContent>
          <div className="column-left" id="abort-operation-confirmation">
            <p>
              {t(
                'confirm-abort-dialog.are-you-sure-you-want-to-abort',
                `Are you sure you want to abort this {{0}}?`,
                { 0: operation.toLowerCase() }
              )}
            </p>
            <p>
              {t(
                'confirm-abort-dialog.this-will-take-you-back',
                `This will take you back to the original branch state and the
                conflicts you have already resolved will be discarded.`
              )}
            </p>
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={
              __DARWIN__
                ? t('confirm-abort-dialog.abort-darwin', `Abort {{0}}`, {
                    0: operation,
                  })
                : t('confirm-abort-dialog.abort', `Abort {{0}}`, {
                    0: operation.toLowerCase(),
                  })
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }
}
