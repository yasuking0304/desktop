import * as React from 'react'
import * as URL from 'url'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IUntrustedCertificateProps {
  /** The untrusted certificate. */
  readonly certificate: Electron.Certificate

  /** The URL which was being accessed. */
  readonly url: string

  /** The function to call when the user chooses to dismiss the dialog. */
  readonly onDismissed: () => void

  /**
   * The function to call when the user chooses to continue in the process of
   * trusting the certificate.
   */
  readonly onContinue: (certificate: Electron.Certificate) => void
}

/**
 * The dialog we display when an API request encounters an untrusted
 * certificate.
 *
 * An easy way to test this dialog is to attempt to sign in to GitHub
 * Enterprise using  one of the badssl.com domains, such
 * as https://self-signed.badssl.com/
 */
export class UntrustedCertificate extends React.Component<
  IUntrustedCertificateProps,
  {}
> {
  public render() {
    const host = URL.parse(this.props.url).hostname

    return (
      <Dialog
        title={
          __DARWIN__
            ? t(
                'untrusted-certificate.untrusted-server-darwin',
                'Untrusted Server'
              )
            : t('untrusted-certificate.untrusted-server', 'Untrusted server')
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.onContinue}
        type={__DARWIN__ ? 'warning' : 'error'}
      >
        <DialogContent>
          <p>
            {t(
              'untrusted-certificate.gitHub-desktop-cannot-verify-1',
              `GitHub Desktop cannot verify the identity of {{0}}. The 
            certificate ({{1}}) is invalid or untrusted. `,
              { 0: host, 1: this.props.certificate.subjectName }
            )}
            <strong>
              {t(
                'untrusted-certificate.this-may-indicate-attackers',
                'This may indicate attackers are trying to steal your data.'
              )}
            </strong>
            {t('untrusted-certificate.gitHub-desktop-cannot-verify-2', ' ', {
              0: host,
              1: this.props.certificate.subjectName,
            })}
          </p>
          <p>
            {t(
              'untrusted-certificate.in-some-cases',
              'In some cases, this may be expected. For example:'
            )}
          </p>
          <ul>
            <li>
              {t(
                'untrusted-certificate.if-this-is-a-github-enterprise-trial',
                'If this is a GitHub Enterprise trial.'
              )}
            </li>
            <li>
              {t(
                'untrusted-certificate.if-your-github-enterprise-instance',
                `If your GitHub Enterprise instance is run on an unusual
                top-level domain.`
              )}
            </li>
          </ul>
          <p>
            {t(
              'untrusted-certificate.if-you-are-unsure-of-what-to-do',
              `If you are unsure of what to do, cancel and contact your system
              administrator.`
            )}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={
              __DARWIN__
                ? t(
                    'untrusted-certificate.view-certificate-darwin',
                    'View Certificate'
                  )
                : t('untrusted-certificate.view-certificate', 'Add certificate')
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onContinue = () => {
    this.props.onDismissed()
    this.props.onContinue(this.props.certificate)
  }
}
