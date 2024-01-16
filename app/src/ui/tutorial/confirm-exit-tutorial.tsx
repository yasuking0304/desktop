import * as React from 'react'

import { DialogFooter, DialogContent, Dialog } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IConfirmExitTutorialProps {
  readonly onDismissed: () => void
  readonly onContinue: () => boolean
}

export class ConfirmExitTutorial extends React.Component<
  IConfirmExitTutorialProps,
  {}
> {
  public render() {
    return (
      <Dialog
        title={
          __DARWIN__
            ? t(
                'confirm-exit-tutorial.confirm-exit-tutorial-darwin',
                'Exit Tutorial'
              )
            : t('confirm-exit-tutorial.confirm-exit-tutorial', 'Exit tutorial')
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.onContinue}
        type="normal"
      >
        <DialogContent>
          <p>
            {t(
              'confirm-exit-tutorial.are-you-sure-you-want-to-leave',
              `Are you sure you want to leave the tutorial? This will bring you
            back to the home screen.`
            )}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={
              __DARWIN__
                ? t(
                    'confirm-exit-tutorial.confirm-exit-tutorial-darwin',
                    'Exit Tutorial'
                  )
                : t(
                    'confirm-exit-tutorial.confirm-exit-tutorial',
                    'Exit tutorial'
                  )
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onContinue = () => {
    const dismissPopup = this.props.onContinue()

    if (dismissPopup) {
      this.props.onDismissed()
    }
  }
}
