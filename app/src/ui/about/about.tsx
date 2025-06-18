import * as React from 'react'

import { Row } from '../lib/row'
import { Button } from '../lib/button'
import {
  Dialog,
  DialogError,
  DialogContent,
  DefaultDialogFooter,
} from '../dialog'
import { LinkButton } from '../lib/link-button'
import { IUpdateState, UpdateStatus } from '../lib/update-store'
import { Loading } from '../lib/loading'
import { RelativeTime } from '../relative-time'
import { assertNever } from '../../lib/fatal-error'
import { ReleaseNotesUri } from '../lib/releases'
import { encodePathAsUrl } from '../../lib/path'
import { t } from 'i18next'
import { isOSNoLongerSupportedByElectron } from '../../lib/get-os'
import { AriaLiveContainer } from '../accessibility/aria-live-container'
import { formatDate } from '../../lib/format-date'

const logoPath = __DARWIN__
  ? 'static/logo-64x64@2x.png'
  : 'static/windows-logo-64x64@2x.png'
const DesktopLogo = encodePathAsUrl(__dirname, logoPath)

interface IAboutProps {
  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the Dialog component's dismissible prop.
   */
  readonly onDismissed: () => void

  /**
   * The name of the currently installed (and running) application
   */
  readonly applicationName: string

  /**
   * The currently installed (and running) version of the app.
   */
  readonly applicationVersion: string

  /**
   * The currently installed (and running) architecture of the app.
   */
  readonly applicationArchitecture: string

  /** A function to call to kick off a non-staggered update check. */
  readonly onCheckForNonStaggeredUpdates: () => void

  readonly onShowAcknowledgements: () => void

  /** A function to call when the user wants to see Terms and Conditions. */
  readonly onShowTermsAndConditions: () => void
  readonly onQuitAndInstall: () => void

  readonly updateState: IUpdateState

  /**
   * A flag to indicate whether the About dialog should ignore that
   * it's running in development mode. Used exclusively by the AboutTestDialog
   */
  readonly allowDevelopment?: boolean
}

interface IUpdateInfoProps {
  readonly message: string
  readonly richMessage?: JSX.Element
  readonly loading?: boolean
}

class UpdateInfo extends React.Component<IUpdateInfoProps> {
  public render() {
    return (
      <div className="update-status">
        <AriaLiveContainer message={this.props.message} />

        {this.props.loading && <Loading />}
        {this.props.richMessage ?? this.props.message}
      </div>
    )
  }
}

/**
 * A dialog that presents information about the
 * running application such as name and version.
 */
export class About extends React.Component<IAboutProps> {
  private get canCheckForUpdates() {
    return (
      __RELEASE_CHANNEL__ !== 'development' ||
      this.props.allowDevelopment === true
    )
  }

  private renderUpdateButton() {
    if (!this.canCheckForUpdates) {
      return null
    }

    const updateStatus = this.props.updateState.status

    switch (updateStatus) {
      case UpdateStatus.UpdateReady:
        return (
          <Row>
            <Button onClick={this.props.onQuitAndInstall}>
              {t('about.quit-and-install-update', 'Quit and Install Update')}
            </Button>
          </Row>
        )
      case UpdateStatus.UpdateNotAvailable:
      case UpdateStatus.CheckingForUpdates:
      case UpdateStatus.UpdateAvailable:
      case UpdateStatus.UpdateNotChecked:
        const disabled =
          ![
            UpdateStatus.UpdateNotChecked,
            UpdateStatus.UpdateNotAvailable,
          ].includes(updateStatus) || isOSNoLongerSupportedByElectron()

        const buttonTitle = t('about.check-for-updates', 'Check for Updates')

        return __LINUX__ || __UNOFFICIAL__ ? (
          <></>
        ) : (
          <Row>
            <Button
              disabled={disabled}
              onClick={this.props.onCheckForNonStaggeredUpdates}
            >
              {buttonTitle}
            </Button>
          </Row>
        )
      default:
        return assertNever(
          updateStatus,
          `Unknown update status ${updateStatus}`
        )
    }
  }

  private renderUpdateDetails() {
    if (__UNOFFICIAL__) {
      return (
        <p className="unofficial-build">
          {t(
            'about.unofficial-build',
            `Since this is an unofficial build, automatic updates will not occur`
          )}
          <Row>
            <LinkButton
              uri={t(
                'url.unofficial-github-desktop-wiki',
                'https://github.com/yasuking0304/desktop/wiki'
              )}
            >
              {t('about.click-here-for-details', 'Click here for details')}
            </LinkButton>
          </Row>
        </p>
      )
    }

    if (__LINUX__) {
      return null
    }

    if (!this.canCheckForUpdates) {
      return (
        <p>
          {t(
            'about.application-is-currently-running',
            `The application is currently running in development and will not
            receive any updates.`
          )}
        </p>
      )
    }

    const { status, lastSuccessfulCheck } = this.props.updateState

    switch (status) {
      case UpdateStatus.CheckingForUpdates:
        return (
          <UpdateInfo
            message={t('about.checking-for-updates', 'Checking for updates…')}
            loading={true}
          />
        )
      case UpdateStatus.UpdateAvailable:
        return (
          <UpdateInfo
            message={t('about.downloading-updates', 'Downloading update…')}
            loading={true}
          />
        )
      case UpdateStatus.UpdateNotAvailable:
        if (!lastSuccessfulCheck) {
          return null
        }

        const richMessage = (
          <>
            {t(
              'about.you-have-the-latest-version-1',
              `You have the latest version (last checked `
            )}
            <RelativeTime date={lastSuccessfulCheck} />
            {t('about.you-have-the-latest-version-2', ')')}
          </>
        )

        const absoluteDate = formatDate(lastSuccessfulCheck, {
          dateStyle: 'full',
          timeStyle: 'short',
        })

        return (
          <UpdateInfo
            message={t(
              'about.you-have-the-latest-version',
              `You have the latest version (last checked {{0}})`,
              { 0: absoluteDate }
            )}
            richMessage={richMessage}
          />
        )
      case UpdateStatus.UpdateReady:
        return (
          <UpdateInfo
            message={t(
              'about.update-has-been-downloaded-and-is-ready',
              'An update has been downloaded and is ready to be installed.'
            )}
          />
        )
      case UpdateStatus.UpdateNotChecked:
        return null
      default:
        return assertNever(status, `Unknown update status ${status}`)
    }
  }

  private renderUpdateErrors() {
    if (__LINUX__) {
      return null
    }

    if (!this.canCheckForUpdates) {
      return null
    }

    if (isOSNoLongerSupportedByElectron()) {
      return (
        <DialogError>
          {t(
            'about.no-longer-supported-operating-systems',
            `This operating system is no longer supported. Software updates have
              been disabled. `
          )}
          <LinkButton
            uri={t(
              'url.supported-operating-systems-for-github-desktop',
              'https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/overview/supported-operating-systems'
            )}
          >
            {t(
              'about.supported-operating-systems',
              'Supported operating systems'
            )}
          </LinkButton>
        </DialogError>
      )
    }

    if (!this.props.updateState.lastSuccessfulCheck) {
      return (
        <DialogError>
          {t(
            'about.could-not-determine-the-last-time-update-check',
            `Couldn't determine the last time an update check was performed.
            You may be running an old version. Please try manually checking for
            updates and contact GitHub Support if the problem persists`
          )}
        </DialogError>
      )
    }

    return null
  }

  private renderBetaLink() {
    if (__RELEASE_CHANNEL__ === 'beta') {
      return
    }

    return (
      <div>
        <p className="no-padding">
          {t(
            'about.looking-for-the-latest-features',
            'Looking for the latest features?'
          )}
        </p>
        <p className="no-padding">
          {t('about.check-out-the-beta-channel-1', 'Check out the ')}
          <LinkButton uri="https://desktop.github.com/beta">
            {t('about.check-out-the-beta-channel-2', 'Beta Channel')}
          </LinkButton>
          {t('about.check-out-the-beta-channel-3', ' ')}
        </p>
      </div>
    )
  }

  public render() {
    const name = this.props.applicationName
    const version = this.props.applicationVersion
    const releaseNotesLink = (
      <LinkButton uri={ReleaseNotesUri}>
        {t('about.release-notes', 'release notes')}
      </LinkButton>
    )

    const versionText = __DEV__
      ? t('about.build', `Build {{0}}`, { 0: version })
      : t('about.version', `Version {{0}}`, { 0: version })
    const titleId = 'Dialog_about'

    return (
      <Dialog
        id="about"
        titleId={titleId}
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        {this.renderUpdateErrors()}
        <DialogContent>
          <Row className="logo">
            <img
              src={DesktopLogo}
              alt="GitHub Desktop"
              width="64"
              height="64"
            />
          </Row>
          <h1 id={titleId}>
            {t('about.about-name', 'About {{0}}', { 0: name })}
          </h1>
          <p className="no-padding">
            <span className="selectable-text">
              {versionText} ({this.props.applicationArchitecture})
            </span>{' '}
            ({releaseNotesLink})
          </p>
          {this.renderUpdateDetails()}
          {this.renderUpdateButton()}
          {this.renderBetaLink()}
          <div className="terms-and-license-container">
            <p className="no-padding terms-and-license">
              <LinkButton onClick={this.props.onShowTermsAndConditions}>
                {t('about.terms-and-conditions', 'Terms and Conditions')}
              </LinkButton>
            </p>
            <p className="no-padding terms-and-license">
              <LinkButton onClick={this.props.onShowAcknowledgements}>
                {t(
                  'about.license-and-open-source-notices',
                  'License and Open Source Notices'
                )}
              </LinkButton>
            </p>
            <p className="terms-and-license">
              <LinkButton uri="https://gh.io/copilot-for-desktop-transparency">
                {t(
                  'about.responsible-use-of-copilot',
                  'Responsible use of Copilot in GitHub Desktop'
                )}
              </LinkButton>
            </p>
          </div>
        </DialogContent>
        <DefaultDialogFooter />
      </Dialog>
    )
  }
}
