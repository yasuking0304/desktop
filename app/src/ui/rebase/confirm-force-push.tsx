import * as React from 'react'

import { Repository } from '../../models/repository'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Dispatcher } from '../dispatcher'
import { DialogFooter, DialogContent, Dialog } from '../dialog'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IConfirmForcePushProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly upstreamBranch: string
  readonly askForConfirmationOnForcePush: boolean
  readonly onDismissed: () => void
}

interface IConfirmForcePushState {
  readonly isLoading: boolean
  readonly askForConfirmationOnForcePush: boolean
}

export class ConfirmForcePush extends React.Component<
  IConfirmForcePushProps,
  IConfirmForcePushState
> {
  public constructor(props: IConfirmForcePushProps) {
    super(props)

    this.state = {
      isLoading: false,
      askForConfirmationOnForcePush: props.askForConfirmationOnForcePush,
    }
  }

  public render() {
    return (
      <Dialog
        title={t(
          'confirm-force-push.want-to-force-push',
          'Are you sure you want to force push?'
        )}
        dismissable={!this.state.isLoading}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onForcePush}
        type="warning"
      >
        <DialogContent>
          <p>
            {t(
              'confirm-force-push.force-push will-rewrite-history-1',
              'A force push will rewrite history on '
            )}
            <Ref>{this.props.upstreamBranch}</Ref>
            {t(
              'confirm-force-push.force-push will-rewrite-history-2',
              `. Any collaborators working on
              this branch will need to reset their own local branch to match
              the history of the remote.`
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
            destructive={true}
            okButtonText={t('confirm-force-push.i-am-sure', "I'm sure")}
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

  private onForcePush = async () => {
    this.props.dispatcher.setConfirmForcePushSetting(
      this.state.askForConfirmationOnForcePush
    )
    this.props.onDismissed()

    await this.props.dispatcher.performForcePush(this.props.repository)
  }
}
