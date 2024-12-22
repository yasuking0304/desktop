import * as React from 'react'
import { LinkButton } from '../lib/link-button'
import { RichText } from '../lib/rich-text'
import { Banner } from './banner'
import { t } from 'i18next'
import { Emoji } from '../../lib/emoji'

interface IOpenThankYouCardProps {
  readonly emoji: Map<string, Emoji>
  readonly onDismissed: () => void
  readonly onOpenCard: () => void
  readonly onThrowCardAway: () => void
}

/**
 * A component which tells the user that there is a thank you card for them.
 */
export class OpenThankYouCard extends React.Component<
  IOpenThankYouCardProps,
  {}
> {
  public render() {
    return (
      <Banner id="open-thank-you-card" onDismissed={this.props.onDismissed}>
        {t(
            'open-thank-you-card.open-thank-you-1',
            'The Desktop team would like to thank you for your contributions.'
          )}{' '}
        <LinkButton onClick={this.props.onOpenCard}>
          {t('open-thank-you-card.open-your-card', 'Open Your Card')}
        </LinkButton>{' '}
        <RichText
          className="thank-you-banner-emoji"
          text={':tada:'}
          emoji={this.props.emoji}
          renderUrlsAsLinks={true}
        />
        or <LinkButton onClick={this.onThrowCardAway}>
          {t('open-thank-you-card.throw-it-away', 'Throw It Away')}
        </LinkButton>{' '}
        <RichText
          className="thank-you-banner-emoji"
          text={':sob:'}
          emoji={this.props.emoji}
          renderUrlsAsLinks={true}
        />
      </Banner>
    )
  }

  private onThrowCardAway = () => {
    this.props.onDismissed()
    this.props.onThrowCardAway()
  }
}
