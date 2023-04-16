import * as React from 'react'
import { SuccessBanner } from './success-banner'
import { t } from 'i18next'

interface ISuccessfulSquashedBannerProps {
  readonly count: number
  readonly onDismissed: () => void
  readonly onUndo: () => void
}

export class SuccessfulSquash extends React.Component<
  ISuccessfulSquashedBannerProps,
  {}
> {
  public render() {
    const { count, onDismissed, onUndo } = this.props

    const pluralized =
      count === 1
        ? t('common.one-commit', 'commit')
        : t('common.multiple-commits', 'commits')

    return (
      <SuccessBanner timeout={15000} onDismissed={onDismissed} onUndo={onUndo}>
        <span>
          {t(
            'successful-squash.successfully-squashed',
            'Successfully squashed {{0}} {{1}}.',
            { 0: count, 1: pluralized }
          )}
        </span>
      </SuccessBanner>
    )
  }
}
