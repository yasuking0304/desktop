import * as React from 'react'
import { Checkbox, CheckboxValue } from '../../lib/checkbox'
import { Dispatcher } from '../../dispatcher'
import { DialogFooter, DialogContent, Dialog } from '../../dialog'
import { OkCancelButtonGroup } from '../../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IWarnForcePushProps {
  /**
   * This is expected to be capitalized for correct output on windows and macOs.
   *
   * Examples:
   *  - Rebase
   *  - Squash
   *  - Reorder
   *  - Amend
   */
  readonly operation: string
  readonly dispatcher: Dispatcher
  readonly askForConfirmationOnForcePush: boolean
  readonly onBegin: () => void
  readonly onDismissed: () => void
}

interface IWarnForcePushState {
  readonly askForConfirmationOnForcePush: boolean
}

export class WarnForcePushDialog extends React.Component<
  IWarnForcePushProps,
  IWarnForcePushState
> {
  public constructor(props: IWarnForcePushProps) {
    super(props)

    this.state = {
      askForConfirmationOnForcePush: props.askForConfirmationOnForcePush,
    }
  }

  public render() {
    const { operation, onDismissed } = this.props

    const title = __DARWIN__
      ? t(
          'warn-force-push-dialog.require-force-push-darwin',
          '{{0}} Will Require Force Push',
          { 0: operation }
        )
      : t(
          'warn-force-push-dialog.require-force-push',
          '{{0}} will require force push',
          { 0: operation }
        )

    return (
      <Dialog
        title={title}
        onDismissed={onDismissed}
        onSubmit={this.onBegin}
        backdropDismissable={false}
        type="warning"
      >
        <DialogContent>
          <p>
            {t(
              'warn-force-push-dialog.are-you-sure-operation',
              'Are you sure you want to {{0}}?',
              { 0: operation.toLowerCase() }
            )}
          </p>
          <p>
            {t(
              'warn-force-push-dialog.end-of-the-operation-flow',
              `At the end of the {{0}} flow, GitHub Desktop
              will enable you to force push the branch to update the upstream
              branch. Force pushing will alter the history on the remote and
              potentially cause problems for others collaborating on this
              branch.`,
              { 0: operation.toLowerCase() }
            )}
          </p>
          <div>
            <Checkbox
              label={t(
                'common.do-not-show-message-again',
                'Do not show this message again'
              )}
              value={
                this.state.askForConfirmationOnForcePush
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onAskForConfirmationOnForcePushChanged}
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={t(
              'warn-force-push-dialog.begin-operation',
              `Begin {0}`,
              { 0: __DARWIN__ ? operation : operation.toLowerCase() }
            )}
            onCancelButtonClick={this.props.onDismissed}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onAskForConfirmationOnForcePushChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ askForConfirmationOnForcePush: value })
  }

  private onBegin = async () => {
    this.props.dispatcher.setConfirmForcePushSetting(
      this.state.askForConfirmationOnForcePush
    )

    this.props.onBegin()
  }
}
