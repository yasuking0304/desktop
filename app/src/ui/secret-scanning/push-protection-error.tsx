import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { LinkButton } from '../lib/link-button'
import { PushProtectionErrorLocation } from './push-protection-error-location'

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
            ? 'Push Blocked: Secret Detected'
            : 'Push blocked: secret detected'
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
              <LinkButton uri="https://docs.github.com/code-security/secret-scanning/protecting-pushes-with-secret-scanning">
                Secret Scanning
              </LinkButton>{' '}
              found secret(s) in the commit(s) you attempted to push.{' '}
            </p>
            <p>
              Allowing secrets risks exposure. Consider{' '}
              <LinkButton uri="https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection/working-with-push-protection-in-the-github-ui#resolving-a-blocked-commit">
                removing the secret from your commit and commit history.
              </LinkButton>
            </p>
            Exposing this secret can allow someone to:
            <ul>
              <li>Verify the identity of the secret(s)</li>
              <li>Know which resources the secret(s) can access</li>
              <li>Act on behalf of the secret's owner</li>
              <li>
                Push the secret(s) to this repository without being blocked
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
            Bypass
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
