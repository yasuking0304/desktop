import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { LinkButton } from '../lib/link-button'
import { PushProtectionErrorLocation } from './push-protection-error-location'
import { t } from 'i18next'

/** Represents the location of a detected secret detected on push  */
export interface ISecretLocation {
  /**The SHA of the commit where the secret was detected. */
  commitSha: string
  /** The file path where the secret is located. */
  path: string
  /** The line number in the file where the secret is found. */
  lineNumber: number
}

/** Represents secret detected by GitHub's Secret Scanning feature on push. */
export interface ISecretScanResult {
  /** The id used in the bypassURL to unique identify this secret */
  id: string
  /** The name of the secret - e.g "GitHub Access Token" */
  description: string
  /** The location of the secret, given as a commitSha, file path, and line number */
  locations: ReadonlyArray<ISecretLocation>
  /** The URL to use to get to GitHub.com's dialog for bypassing blocking the push of the secret  */
  bypassURL: string
}

interface IPushProtectionErrorDialogProps {
  /** The secrets that were detected on push */
  readonly secrets: ReadonlyArray<ISecretScanResult>
  readonly onDismissed: () => void
}

/**
 * The dialog shown when a push is denied by GitHub's push protection feature of secret scanning.
 */
export class PushProtectionErrorDialog extends React.Component<
  IPushProtectionErrorDialogProps,
  {}
> {
  public render() {
    return (
      <Dialog
        title={
          __DARWIN__
            ? t(
                'push-protection-error.push-blocked-darwin',
                'Push Blocked: Secret Detected'
              )
            : t(
                'push-protection-error.push-blocked',
                'Push blocked: secret detected'
              )
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.props.onDismissed}
        type="error"
        role="alertdialog"
        ariaDescribedBy="push-protection-error-dialog-description"
        className="push-protection-error-dialog"
      >
        <DialogContent>
          <div id="push-protection-error-dialog-description">
            <p>
              {t('push-protection-error.found secrets-1', '')}
              <LinkButton uri="https://docs.github.com/code-security/secret-scanning/protecting-pushes-with-secret-scanning">
                {t('push-protection-error.secret-scanning', 'Secret Scanning')}
              </LinkButton>
              {t(
                'push-protection-error.found secrets-2',
                ' found secret(s) in the commit(s) you attempted to push. '
              )}
            </p>
            <p>
              {t(
                'push-protection-error.allowing-secrets-risks-exposure',
                'Allowing secrets risks exposure. Consider '
              )}
              <LinkButton uri="https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection/working-with-push-protection-in-the-github-ui#resolving-a-blocked-commit">
                {t(
                  'push-protection-error.removing-the-secret',
                  'removing the secret from your commit and commit history.'
                )}
              </LinkButton>
            </p>
            {t(
              'push-protection-error.exosing-this-secret-can-allow',
              'Exposing this secret can allow someone to:'
            )}
            <ul>
              <li>
                {t(
                  'push-protection-error.verify-the-identity',
                  'Verify the identity of the secret(s)'
                )}
              </li>
              <li>
                {t(
                  'push-protection-error.know-which-resources',
                  'Know which resources the secret(s) can access'
                )}
              </li>
              <li>
                {t(
                  'push-protection-error.act-on-behalf',
                  "Act on behalf of the secret's owner"
                )}
              </li>
              <li>
                {t(
                  'push-protection-error.push-the-secrets-to-this-repository',
                  'Push the secret(s) to this repository without being blocked'
                )}
              </li>
            </ul>
            {this.renderSecrets()}
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup cancelButtonVisible={false} />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderSecretDescription = (secret: ISecretScanResult) => {
    return this.props.secrets.filter(s => s.description === secret.description)
      .length > 1
      ? `${secret.description} (${secret.id})`
      : secret.description
  }

  private renderSecrets = () => {
    const listItems = this.props.secrets.map((secret, index) => (
      <li key={index} className="secret-list-item">
        <span className="secret-list-item-header">
          <span>{this.renderSecretDescription(secret)}</span>
          <LinkButton
            ariaLabel={`Bypass ${secret.description}`}
            uri={secret.bypassURL}
          >
            {t('push-protection-error.bypass', 'Bypass')}
          </LinkButton>
        </span>
        <PushProtectionErrorLocation secret={secret} />
      </li>
    ))
    return (
      <ul aria-label="Secrets" className="secret-list">
        {listItems}
      </ul>
    )
  }
}
