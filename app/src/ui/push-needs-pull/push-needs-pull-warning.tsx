import * as React from 'react'
import { Dispatcher } from '../dispatcher'
import { DialogFooter, DialogContent, Dialog } from '../dialog'
import { FetchType } from '../../models/fetch'
import { Repository } from '../../models/repository'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IPushNeedsPullWarningProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly onDismissed: () => void
}

interface IPushNeedsPullWarningState {
  readonly isLoading: boolean
}

export class PushNeedsPullWarning extends React.Component<
  IPushNeedsPullWarningProps,
  IPushNeedsPullWarningState
> {
  public constructor(props: IPushNeedsPullWarningProps) {
    super(props)

    this.state = {
      isLoading: false,
    }
  }

  public render() {
    return (
      <Dialog
        title={
          __DARWIN__
            ? t(
                'push-needs-pull-warning.newer-commits-on-remote-darwin',
                'Newer Commits on Remote'
              )
            : t(
                'push-needs-pull-warning.newer-commits-on-remote',
                'Newer commits on remote'
              )
        }
        dismissable={!this.state.isLoading}
        disabled={this.state.isLoading}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onFetch}
        loading={this.state.isLoading}
        type="warning"
      >
        <DialogContent>
          <p>
            {t(
              'push-needs-pull-warning.desktop-is-unable-to-push-commits',
              `Desktop is unable to push commits to this branch because there are
            commits on the remote that are not present on your local branch.
            Fetch these new commits before pushing in order to reconcile them
            with your local commits.`
            )}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={t('push-needs-pull-warning.fetch', 'Fetch')}
            okButtonDisabled={this.state.isLoading}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onFetch = async () => {
    this.setState({ isLoading: true })
    await this.props.dispatcher.fetch(
      this.props.repository,
      FetchType.UserInitiatedTask
    )
    this.setState({ isLoading: false })
    this.props.onDismissed()
  }
}
