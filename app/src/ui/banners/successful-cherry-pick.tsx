import * as React from 'react'
import { SuccessBanner } from './success-banner'
import { t } from 'i18next'

interface ISuccessfulCherryPickBannerProps {
  readonly targetBranchName: string
  readonly countCherryPicked: number
  readonly onDismissed: () => void
  readonly onUndo: () => void
}

export class SuccessfulCherryPick extends React.Component<
  ISuccessfulCherryPickBannerProps,
  {}
> {
  public render() {
    const { countCherryPicked, onDismissed, onUndo, targetBranchName } =
      this.props

    const pluralized =
      countCherryPicked === 1
        ? t('common.one-commit', 'commit')
        : t('common.multiple-commits', 'commits')

    return (
      <SuccessBanner timeout={15000} onDismissed={onDismissed} onUndo={onUndo}>
        <span>
          {t(
            'successful-cherry-pick.successfully-copied-1',
            'Successfully copied {{0}} {{1}} to',
            { 0: countCherryPicked, 1: pluralized }
          )}{' '}
          <strong>{targetBranchName}</strong>
          {t('successful-cherry-pick.successfully-copied-2', '.')}
        </span>
      </SuccessBanner>
    )
  }
}
