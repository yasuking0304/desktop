import * as React from 'react'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  OkCancelButtonGroup,
} from '../dialog'
import { t } from 'i18next'

interface IShellErrorProps {
  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the Dialog component's dismissable prop.
   */
  readonly onDismissed: () => void

  /**
   * Event to trigger if the user navigates to the Preferences dialog
   */
  readonly showPreferencesDialog: () => void

  /**
   * The text to display to the user relating to this error.
   */
  readonly message: string
}

/**
 * A dialog indicating something went wrong with launching their preferred
 * shell.
 */
export class ShellError extends React.Component<IShellErrorProps, {}> {
  private onShowPreferencesDialog = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault()
    this.props.onDismissed()
    this.props.showPreferencesDialog()
  }

  public render() {
    const title = __DARWIN__
      ? t('shell-error.unable-to-open-shell-darwin', 'Unable to Open Shell')
      : t('shell-error.unable-to-open-shell', 'Unable to open shell')
    return (
      <Dialog
        id="shell-error"
        type="error"
        title={title}
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <p>{this.props.message}</p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={t('common.close', 'Close')}
            cancelButtonText={
              __DARWIN__
                ? t(
                    'shell-error.unable-to-open-settings-darwin',
                    'Open Settings'
                  )
                : t('shell-error.unable-to-open-options', 'Open options')
            }
            onCancelButtonClick={this.onShowPreferencesDialog}
          />
        </DialogFooter>
      </Dialog>
    )
  }
}
