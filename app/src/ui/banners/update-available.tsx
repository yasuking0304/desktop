import * as React from 'react'
import { Dispatcher } from '../dispatcher/index'
import { LinkButton } from '../lib/link-button'
import {
  UpdateStatus,
  lastShowCaseVersionSeen,
  updateStore,
} from '../lib/update-store'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { PopupType } from '../../models/popup'
import { shell } from '../../lib/app-shell'

import { ReleaseSummary } from '../../models/release-notes'
import { Banner } from './banner'
import { ReleaseNotesUri } from '../lib/releases'
import { RichText } from '../lib/rich-text'
import { t } from 'i18next'
import { Emoji } from '../../lib/emoji'

interface IUpdateAvailableProps {
  readonly dispatcher: Dispatcher
  readonly newReleases: ReadonlyArray<ReleaseSummary> | null
  readonly isX64ToARM64ImmediateAutoUpdate: boolean
  readonly isUpdateShowcaseVisible: boolean
  readonly emoji: Map<string, Emoji>
  readonly onDismissed: () => void
}

/**
 * A component which tells the user an update is available and gives them the
 * option of moving into the future or being a luddite.
 */
export class UpdateAvailable extends React.Component<
  IUpdateAvailableProps,
  {}
> {
  public render() {
    return (
      <Banner id="update-available" onDismissed={this.props.onDismissed}>
        {!this.props.isUpdateShowcaseVisible && (
          <Octicon
            className="download-icon"
            symbol={octicons.desktopDownload}
          />
        )}

        {this.renderMessage()}
      </Banner>
    )
  }

  private renderMessage = () => {
    if (this.props.isX64ToARM64ImmediateAutoUpdate) {
      return (
        <span onSubmit={this.updateNow}>
          {t(
            'update-available.an-optimized-arm-version-1',
            `An optimized version of GitHub Desktop is available for your 
            {{0}} machine and will be installed
            at the next launch or `,
            { 0: __DARWIN__ ? 'Apple silicon' : 'Arm64' }
          )}
          <LinkButton onClick={this.updateNow}>
            {t(
              'update-available.restart-gitHub-desktop',
              'restart GitHub Desktop'
            )}
          </LinkButton>
          {t('update-available.an-optimized-arm-version-2', ' now.')}
        </span>
      )
    }

    if (this.props.isUpdateShowcaseVisible) {
      const version =
        this.props.newReleases !== null
          ? ` with GitHub Desktop ${this.props.newReleases[0].latestVersion}`
          : ''

      return (
        <span>
          <RichText
            className="banner-emoji"
            text={':tada:'}
            emoji={this.props.emoji}
          />
          {t(
            'update-available.exciting-new-features-1',
            'Exciting new features have been added{{0}}. See ',
            { 0: version }
          )}
          <LinkButton onClick={this.showReleaseNotes}>
            {t('update-available.whats-new', `what's new`)}
          </LinkButton>
          {t('update-available.exciting-new-features-2', ' or ')}
          <LinkButton onClick={this.dismissUpdateShowCaseVisibility}>
            {t('update-available.dismiss', 'dismiss')}
          </LinkButton>
          {t('update-available.exciting-new-features-3', '.')}
        </span>
      )
    }

    return (
      <span onSubmit={this.updateNow}>
        {t(
          'update-available.updated version-is-available-1',
          `An updated version of GitHub Desktop is available and will be
           installed at the next launch. See `
        )}
        <LinkButton onClick={this.showReleaseNotes}>
          {t('update-available.whats-new', `what's new`)}
        </LinkButton>
        {t('update-available.updated version-is-available-2', 'or ')}
        <LinkButton onClick={this.updateNow}>
          {t(
            'update-available.restart-gitHub-desktop',
            'restart GitHub Desktop'
          )}
        </LinkButton>
        {t('update-available.updated version-is-available-3', '.')}
      </span>
    )
  }

  private dismissUpdateShowCaseVisibility = () => {
    // Note: under that scenario that this is being dismissed due to clicking
    // what's new on a pending release and for some reason we don't have the
    // releases. We will end up showing the showcase banner after restart. This
    // shouldn't happen but even if it did it would just be a minor annoyance as
    // user would need to dismiss it again.
    const versionSeen =
      this.props.newReleases === null
        ? __APP_VERSION__
        : this.props.newReleases[0].latestVersion

    localStorage.setItem(lastShowCaseVersionSeen, versionSeen)
    this.props.dispatcher.setUpdateShowCaseVisibility(false)
  }

  private showReleaseNotes = () => {
    if (this.props.newReleases == null) {
      // if, for some reason we're not able to render the release notes we
      // should redirect the user to the website so we do _something_
      shell.openExternal(ReleaseNotesUri)
    } else {
      this.props.dispatcher.showPopup({
        type: PopupType.ReleaseNotes,
        newReleases: this.props.newReleases,
      })
    }

    this.dismissUpdateShowCaseVisibility()
  }

  private updateNow = () => {
    if (
      (__RELEASE_CHANNEL__ === 'development' ||
        __RELEASE_CHANNEL__ === 'test') &&
      updateStore.state.status !== UpdateStatus.UpdateReady
    ) {
      this.props.onDismissed()
      return // causes a crash.. if no update is available
    }

    updateStore.quitAndInstallUpdate()
  }
}
