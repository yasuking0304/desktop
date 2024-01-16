import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { Ref } from '../lib/ref'
import { RepositoryWithGitHubRepository } from '../../models/repository'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { getDotComAPIEndpoint } from '../../lib/api'
import { t } from 'i18next'

const okButtonText = __DARWIN__
  ? t(
      'workflow-push-rejected.continue-in-browser-darwin',
      'Continue in Browser'
    )
  : t('workflow-push-rejected.continue-in-browser', 'Continue in browser')

interface IWorkflowPushRejectedDialogProps {
  readonly rejectedPath: string
  readonly repository: RepositoryWithGitHubRepository
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void
}
interface IWorkflowPushRejectedDialogState {
  readonly loading: boolean
}
/**
 * The dialog shown when a push is rejected due to it modifying a
 * workflow file without the workflow oauth scope.
 */
export class WorkflowPushRejectedDialog extends React.Component<
  IWorkflowPushRejectedDialogProps,
  IWorkflowPushRejectedDialogState
> {
  public constructor(props: IWorkflowPushRejectedDialogProps) {
    super(props)
    this.state = { loading: false }
  }

  public render() {
    return (
      <Dialog
        id="workflow-push-rejected"
        title={
          __DARWIN__
            ? t('workflow-push-rejected.push-rejected-darwin', 'Push Rejected')
            : t('workflow-push-rejected.push-rejected', 'Push rejected')
        }
        loading={this.state.loading}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSignIn}
        type="error"
      >
        <DialogContent>
          <p>
            {t(
              'workflow-push-rejected.the-push-was-rejected-by-the-server-1',
              `The push was rejected by the server for containing a modification
               to the workflow file `
            )}
            <Ref>{this.props.rejectedPath}</Ref>
            {t(
              'workflow-push-rejected.the-push-was-rejected-by-the-server-2',
              `. In order to be able to push to workflow files GitHub Desktop
               needs to request additional permissions.`
            )}
          </p>
          <p>
            {t(
              'workflow-push-rejected.would-you-like-to-open-a-browser',
              `Would you like to open a browser to grant GitHub Desktop
               permission to update workflow files?`
            )}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup okButtonText={okButtonText} />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSignIn = async () => {
    this.setState({ loading: true })

    const { repository, dispatcher } = this.props
    const { endpoint } = repository.gitHubRepository

    if (endpoint === getDotComAPIEndpoint()) {
      await dispatcher.beginDotComSignIn()
    } else {
      await dispatcher.beginEnterpriseSignIn()
      await dispatcher.setSignInEndpoint(endpoint)
    }

    await dispatcher.requestBrowserAuthentication()

    dispatcher.push(repository)
    this.props.onDismissed()
  }
}
