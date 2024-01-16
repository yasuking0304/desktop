import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  OkCancelButtonGroup,
} from './dialog'
import { Dispatcher } from './dispatcher'
import { Checkbox, CheckboxValue } from './lib/checkbox'
import { t } from 'i18next'

interface IMoveToApplicationsFolderProps {
  readonly dispatcher: Dispatcher

  /**
   * Callback to use when the dialog gets closed.
   */
  readonly onDismissed: () => void
}

interface IMoveToApplicationsFolderState {
  readonly askToMoveToApplicationsFolder: boolean
}

export class MoveToApplicationsFolder extends React.Component<
  IMoveToApplicationsFolderProps,
  IMoveToApplicationsFolderState
> {
  public constructor(props: IMoveToApplicationsFolderProps) {
    super(props)
    this.state = {
      askToMoveToApplicationsFolder: true,
    }
  }

  public render() {
    return (
      <Dialog
        title={t(
          'move-to-applications-folder.move-to-the-applications-folder',
          'Move GitHub Desktop to the Applications folder?'
        )}
        id="move-to-applications-folder"
        dismissable={false}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        type="warning"
      >
        <DialogContent>
          <p>
            {t(
              'move-to-applications-folder.detected-that-youre-not-running',
              `We've detected that you're not running GitHub Desktop from the
              Applications folder of your machine. This could cause problems
              with the app, including impacting your ability to sign in.`
            )}
            <br />
            <br />
            {t(
              'move-to-applications-folder.do-you-want-to-move',
              `Do you want to move GitHub Desktop to the Applications folder
              now? This will also restart the app.`
            )}
          </p>
          <div>
            <Checkbox
              label={t(
                'common.do-not-show-message-again',
                'Do not show this message again'
              )}
              value={
                this.state.askToMoveToApplicationsFolder
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onAskToMoveToApplicationsFolderChanged}
            />
          </div>
        </DialogContent>
        {this.renderFooter()}
      </Dialog>
    )
  }

  private renderFooter() {
    return (
      <DialogFooter>
        <OkCancelButtonGroup
          okButtonText={t(
            'move-to-applications-folder.move-and-restart',
            'Move and Restart'
          )}
          okButtonTitle={t(
            'move-to-applications-folder.this-will-move-github-desktop',
            `This will move GitHub Desktop to the Applications folder in your
            machine and restart the app.`
          )}
          cancelButtonText={t('move-to-applications-folder.not-now', 'Not Now')}
          onCancelButtonClick={this.onNotNow}
        />
      </DialogFooter>
    )
  }

  private onAskToMoveToApplicationsFolderChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ askToMoveToApplicationsFolder: value })
  }

  private onNotNow = () => {
    this.props.onDismissed()
    this.props.dispatcher.setAskToMoveToApplicationsFolderSetting(
      this.state.askToMoveToApplicationsFolder
    )
  }

  private onSubmit = async () => {
    this.props.onDismissed()

    try {
      await this.props.dispatcher.moveToApplicationsFolder()
    } catch (error) {
      this.props.dispatcher.postError(error)
    }
  }
}
