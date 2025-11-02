import * as React from 'react'
import { Account, isDotComAccount } from '../../models/account'
import { LinkButton } from './link-button'
import { isAttributableEmailFor } from '../../lib/email'
import { t } from 'i18next'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { AriaLiveContainer } from '../accessibility/aria-live-container'

interface IGitEmailNotFoundWarningProps {
  /** The account the commit should be attributed to. */
  readonly accounts: ReadonlyArray<Account>

  /** The email address used in the commit author info. */
  readonly email: string
}

/**
 * A component which just displays a warning to the user if their git config
 * email doesn't match any of the emails in their GitHub (Enterprise) account.
 */
export class GitEmailNotFoundWarning extends React.Component<IGitEmailNotFoundWarningProps> {
  private buildMessage(isAttributableEmail: boolean) {
    const indicatorIcon = !isAttributableEmail ? (
      <span className="warning-icon">⚠️</span>
    ) : (
      <span className="green-circle">
        <Octicon className="check-icon" symbol={octicons.check} />
      </span>
    )

    const learnMore = !isAttributableEmail ? (
      <LinkButton
        ariaLabel={t(
          'git-email-not-found-warning.learn-more-about',
          'Learn more about commit attribution'
        )}
        uri={t(
          'url.why-are-my-commits-linked-to-the-wrong-user',
          'https://docs.github.com/en/github/committing-changes-to-your-project/why-are-my-commits-linked-to-the-wrong-user'
        )}
      >
        {t('git-email-not-found-warning.learn-more', 'Learn more.')}
      </LinkButton>
    ) : null

    return (
      <>
        {indicatorIcon}
        {this.buildScreenReaderMessage(isAttributableEmail)}
        {learnMore}
      </>
    )
  }

  private buildScreenReaderMessage(isAttributableEmail: boolean) {
    const verb = !isAttributableEmail
      ? t('git-email-not-found-warning.does-not-match', 'does not match')
      : t('git-email-not-found-warning.matchs', 'matches')
    const info = !isAttributableEmail
      ? t(
          'git-email-not-found-warning.wrongly-attributed',
          'Your commits will be wrongly attributed. '
        )
      : ''
    return t(
      'git-email-not-found-warning.this-email-address',
      'This email address {{0}} {{1}}. {{2}}',
      { 0: verb, 1: this.getAccountTypeDescription(), 2: info }
    )
  }

  public render() {
    const { accounts, email } = this.props

    if (accounts.length === 0 || email.trim().length === 0) {
      return null
    }

    const isAttributableEmail = accounts.some(account =>
      isAttributableEmailFor(account, email)
    )

    /**
     * Here we put the message in the top div for visual users immediately  and
     * in the bottom div for screen readers. The screen reader content is
     * debounced to avoid frequent updates from typing in the email field.
     */
    return (
      <>
        <div className="git-email-not-found-warning">
          {this.buildMessage(isAttributableEmail)}
        </div>

        <AriaLiveContainer
          id="git-email-not-found-warning-for-screen-readers"
          trackedUserInput={this.props.email}
          message={this.buildScreenReaderMessage(isAttributableEmail)}
        />
      </>
    )
  }

  private getAccountTypeDescription() {
    if (this.props.accounts.length === 1) {
      const accountType = isDotComAccount(this.props.accounts[0])
        ? 'GitHub'
        : 'GitHub Enterprise'

      return t(
        'git-email-not-found-warning.your-account',
        'your {{0}} account',
        { 0: accountType }
      )
    }

    return t(
      'git-email-not-found-warning.edither-your-account',
      'either of your GitHub.com nor GitHub Enterprise accounts'
    )
  }
}
