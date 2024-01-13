import * as React from 'react'
import { SuccessBanner } from './success-banner'
import { t } from 'i18next'

export function SuccessfulRebase({
  baseBranch,
  targetBranch,
  onDismissed,
}: {
  readonly baseBranch?: string
  readonly targetBranch: string
  readonly onDismissed: () => void
}) {
  const message =
    baseBranch !== undefined ? (
      <span>
        {t(
          'successful-rebase.successfully-rebased-onto-branch-1',
          'Successfully rebased '
        )}
        <strong>{targetBranch}</strong>
        {t('successful-rebase.successfully-rebased-onto-branch-2', ' onto ')}
        <strong>{baseBranch}</strong>
        {t('successful-rebase.successfully-rebased-onto-branch-3', ' ')}
      </span>
    ) : (
      <span>
        {t(
          'successful-rebase.successfully-rebased-branch-1',
          'Successfully rebased '
        )}
        <strong>{targetBranch}</strong>
        {t('successful-rebase.successfully-rebased-branch-2', ' ')}
      </span>
    )

  return (
    <SuccessBanner timeout={5000} onDismissed={onDismissed}>
      <div className="banner-message">{message}</div>
    </SuccessBanner>
  )
}
