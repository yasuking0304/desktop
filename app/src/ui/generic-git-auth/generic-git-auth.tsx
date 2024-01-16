import * as React from 'react'

import { TextBox } from '../lib/text-box'
import { Row } from '../lib/row'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { RetryAction } from '../../models/retry-actions'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'
import { t } from 'i18next'
import { PasswordTextBox } from '../lib/password-text-box'

interface IGenericGitAuthenticationProps {
  /** The hostname with which the user tried to authenticate. */
  readonly hostname: string

  /** The function to call when the user saves their credentials. */
  readonly onSave: (
    hostname: string,
    username: string,
    password: string,
    retryAction: RetryAction
  ) => void

  /** The function to call when the user dismisses the dialog. */
  readonly onDismiss: () => void

  /** The action to retry after getting credentials. */
  readonly retryAction: RetryAction
}

interface IGenericGitAuthenticationState {
  readonly username: string
  readonly password: string
}

/** Shown to enter the credentials to authenticate to a generic git server. */
export class GenericGitAuthentication extends React.Component<
  IGenericGitAuthenticationProps,
  IGenericGitAuthenticationState
> {
  public constructor(props: IGenericGitAuthenticationProps) {
    super(props)

    this.state = { username: '', password: '' }
  }

  public render() {
    const disabled = !this.state.password.length || !this.state.username.length
    return (
      <Dialog
        id="generic-git-auth"
        title={
          __DARWIN__
            ? t(
                'generic-git-auth.authentication-failed-darwin',
                'Authentication Failed'
              )
            : t(
                'generic-git-auth.authentication-failed',
                'Authentication failed'
              )
        }
        onDismissed={this.props.onDismiss}
        onSubmit={this.save}
      >
        <DialogContent>
          <p>
            {t(
              'generic-git-auth.we-were-unable-to-authenticate-1',
              'We were unable to authenticate with '
            )}
            <Ref>{this.props.hostname}</Ref>
            {t(
              'generic-git-auth.we-were-unable-to-authenticate-2',
              '. Please enter your username and password to try again.'
            )}
          </p>

          <Row>
            <TextBox
              label={t('generic-git-auth.username', 'Username')}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={true}
              value={this.state.username}
              onValueChanged={this.onUsernameChange}
            />
          </Row>

          <Row>
            <PasswordTextBox
              label={t('generic-git-auth.password', 'Password')}
              value={this.state.password}
              onValueChanged={this.onPasswordChange}
            />
          </Row>

          <Row>
            <div>
              {t(
                'generic-git-auth.depending-on-your-repository-s-1',
                `Depending on your repository's hosting service, you might need
                 to use a Personal Access Token (PAT) as your password. Learn
                 more about creating a PAT in our `
              )}
              <LinkButton uri="https://github.com/desktop/desktop/tree/development/docs/integrations">
                {t('generic-git-auth.integration-docs', 'integration docs')}
              </LinkButton>
              {t('generic-git-auth.depending-on-your-repository-s-2', '.')}
            </div>
          </Row>
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={
              __DARWIN__
                ? t('generic-git-auth.save-and-retry-darwin', 'Save and Retry')
                : t('generic-git-auth.save-and-retry', 'Save and retry')
            }
            okButtonDisabled={disabled}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onUsernameChange = (value: string) => {
    this.setState({ username: value })
  }

  private onPasswordChange = (value: string) => {
    this.setState({ password: value })
  }

  private save = () => {
    this.props.onDismiss()

    this.props.onSave(
      this.props.hostname,
      this.state.username,
      this.state.password,
      this.props.retryAction
    )
  }
}
