import * as React from 'react'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { LinkButton } from '../lib/link-button'
import {
  getNotificationSettingsUrl,
  supportsNotifications,
  supportsNotificationsPermissionRequest,
} from 'desktop-notifications'
import {
  getNotificationsPermission,
  requestNotificationsPermission,
} from '../main-process-proxy'
import { t } from 'i18next'

interface INotificationPreferencesProps {
  readonly notificationsEnabled: boolean
  readonly onNotificationsEnabledChanged: (checked: boolean) => void
}

interface INotificationPreferencesState {
  readonly suggestGrantNotificationPermission: boolean
  readonly warnNotificationsDenied: boolean
  readonly suggestConfigureNotifications: boolean
}

export class Notifications extends React.Component<
  INotificationPreferencesProps,
  INotificationPreferencesState
> {
  public constructor(props: INotificationPreferencesProps) {
    super(props)

    this.state = {
      suggestGrantNotificationPermission: false,
      warnNotificationsDenied: false,
      suggestConfigureNotifications: false,
    }
  }

  public componentDidMount() {
    this.updateNotificationsState()
  }

  private onNotificationsEnabledChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onNotificationsEnabledChanged(event.currentTarget.checked)
  }

  public render() {
    return (
      <DialogContent>
        <div className="advanced-section">
          <h2>{t('notifications.notifications', 'Notifications')}</h2>
          <Checkbox
            label={t(
              'notifications.enable-notifications',
              'Enable notifications'
            )}
            value={
              this.props.notificationsEnabled
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onNotificationsEnabledChanged}
          />
          <p className="git-settings-description">
            {t(
              'notifications.allows-the-display-of-notifications',
              `Allows the display of notifications when high-signal events take
                place in the current repository.`
            )}
            {this.renderNotificationHint()}
          </p>
        </div>
      </DialogContent>
    )
  }

  private onGrantNotificationPermission = async () => {
    await requestNotificationsPermission()
    this.updateNotificationsState()
  }

  private async updateNotificationsState() {
    const notificationsPermission = await getNotificationsPermission()
    this.setState({
      suggestGrantNotificationPermission:
        supportsNotificationsPermissionRequest() &&
        notificationsPermission === 'default',
      warnNotificationsDenied: notificationsPermission === 'denied',
      suggestConfigureNotifications: notificationsPermission === 'granted',
    })
  }

  private renderNotificationHint() {
    // No need to bother the user if their environment doesn't support our
    // notifications or if they've been explicitly disabled.
    if (!supportsNotifications() || !this.props.notificationsEnabled) {
      return null
    }

    const {
      suggestGrantNotificationPermission,
      warnNotificationsDenied,
      suggestConfigureNotifications,
    } = this.state

    if (suggestGrantNotificationPermission) {
      return (
        <>
          {t('notifications.you-need-to-grant-permission-1', ' You need to ')}
          <LinkButton onClick={this.onGrantNotificationPermission}>
            {t(
              'notifications.you-need-to-grant-permission-2',
              'grant permission'
            )}
          </LinkButton>
          {t(
            'notifications.you-need-to-grant-permission-3',
            ' to display these notifications from GitHub Desktop.'
          )}
        </>
      )
    }

    const notificationSettingsURL = getNotificationSettingsUrl()

    if (notificationSettingsURL === null) {
      return null
    }

    if (warnNotificationsDenied) {
      return (
        <div className="setting-hint-warning">
          <span className="warning-icon">⚠️</span>
          {t(
            'notifications.has-no-permission-to-display-notifications-1',
            ` GitHub Desktop has no permission to display notifications. 
                Please, enable them in the `
          )}
          <LinkButton uri={notificationSettingsURL}>
            {t(
              'notifications.notifications-settings',
              'Notifications Settings'
            )}
          </LinkButton>
          {t('notifications.has-no-permission-to-display-notifications-2', '.')}
        </div>
      )
    }

    const verb = suggestConfigureNotifications
      ? t('notifications.properly-configured', 'properly configured')
      : t('notifications.enabled', 'enabled')

    return (
      <>
        {t(
          'notifications.make-sure-notifications-1',
          ` Make sure notifications are {{0}} for GitHub Desktop in the `,
          { 0: verb }
        )}
        <LinkButton uri={notificationSettingsURL}>
          {t('notifications.notifications-settings', 'Notifications Settings')}
        </LinkButton>
        {t('notifications.make-sure-notifications-2', '.', { 0: verb })}
      </>
    )
  }
}
