import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { RetryAction } from '../../models/retry-actions'
import { t } from 'i18next'
import { SignInResult } from '../../lib/stores'

const okButtonText = __DARWIN__
  ? t('saml-reauth-required.continue-in-browser-darwin', 'Continue in Browser')
  : t('saml-reauth-required.continue-in-browser', 'Continue in browser')

interface ISAMLReauthRequiredDialogProps {
  readonly dispatcher: Dispatcher
  readonly organizationName: string
  readonly endpoint: string

  /** The action to retry if applicable. */
  readonly retryAction?: RetryAction

  readonly onDismissed: () => void
}
interface ISAMLReauthRequiredDialogState {
  readonly loading: boolean
}
/**
 * The dialog shown when a Git network operation is denied due to
 * the organization owning the repository having enforced SAML
 * SSO and the current session not being authorized.
 */
export class SAMLReauthRequiredDialog extends React.Component<
  ISAMLReauthRequiredDialogProps,
  ISAMLReauthRequiredDialogState
> {
  public constructor(props: ISAMLReauthRequiredDialogProps) {
    super(props)
    this.state = { loading: false }
  }

  public render() {
    return (
      <Dialog
        title={
          __DARWIN__
            ? t(
                'saml-reauth-required.re-authorization-required-darwin',
                'Re-authorization Required'
              )
            : t(
                'saml-reauth-required.re-authorization-required',
                'Re-authorization required'
              )
        }
        loading={this.state.loading}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSignIn}
        type="error"
      >
        <DialogContent>
          <p>
            {t(
              'saml-reauth-required.the-name-organization-has-enabled',
              `The "{{0}}" organization has enabled or
              enforced SAML SSO. To access this repository, you must sign in again
              and grant GitHub Desktop permission to access the organization's
              repositories.`,
              { 0: this.props.organizationName }
            )}
          </p>
          <p>
            {t(
              'saml-reauth-required.would-you-like-to-open-a-browser',
              `Would you like to open a browser to grant GitHub Desktop permission
              to access the repository?`
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
    const { dispatcher, endpoint } = this.props

    const result = await new Promise<SignInResult>(async resolve => {
      dispatcher.beginBrowserBasedSignIn(endpoint, resolve)
    })

    if (result.kind === 'success' && this.props.retryAction) {
      dispatcher.performRetry(this.props.retryAction)
    }

    this.props.onDismissed()
  }
}
