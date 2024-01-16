import { t } from 'i18next'
import * as React from 'react'
import { SuccessBanner } from './success-banner'

interface ICherryPickUndoneBannerProps {
  readonly targetBranchName: string
  readonly countCherryPicked: number
  readonly onDismissed: () => void
}

export class CherryPickUndone extends React.Component<
  ICherryPickUndoneBannerProps,
  {}
> {
  public render() {
    const { countCherryPicked, targetBranchName, onDismissed } = this.props
    const pluralized =
      countCherryPicked === 1
        ? t('cherry-pick-undone.one-commit', 'commit')
        : t('cherry-pick-undone.multiple-commits', 'commits')
    return (
      <SuccessBanner timeout={5000} onDismissed={onDismissed}>
        {t(
          'cherry-pick-undone.cherry-pick-undone-1',
          `Cherry-pick undone. Successfully removed the {{0}}
          copied {{1}} from `,
          { 0: countCherryPicked, 1: pluralized }
        )}
        <strong>{targetBranchName}</strong>
        {t('cherry-pick-undone.cherry-pick-undone-2', `.`, {
          0: countCherryPicked,
          1: pluralized,
        })}
      </SuccessBanner>
    )
  }
}
