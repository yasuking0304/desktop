import * as React from 'react'
import { SuccessBanner } from './success-banner'
import { t } from 'i18next'

export function SuccessfulMerge({
  ourBranch,
  theirBranch,
  onDismissed,
}: {
  readonly ourBranch: string
  readonly theirBranch?: string
  readonly onDismissed: () => void
}) {
  const message =
    theirBranch !== undefined ? (
      <span>
        {t(
          'successful-merge.successfully-merged-srcbranch-into-distbranch-1',
          'Successfully merged '
        )}
        <strong>{theirBranch}</strong>
        {t(
          'successful-merge.successfully-merged-srcbranch-into-distbranch-2',
          ' into '
        )}
        <strong>{ourBranch}</strong>
        {t(
          'successful-merge.successfully-merged-srcbranch-into-distbranch-3',
          ' '
        )}
      </span>
    ) : (
      <span>
        {t(
          'successful-merge.successfully-merged-into-branch-1',
          'Successfully merged into '
        )}
        <strong>{ourBranch}</strong>
        {t('successful-merge.successfully-merged-into-branch-2', ' ')}
      </span>
    )

  return (
    <SuccessBanner timeout={5000} onDismissed={onDismissed}>
      <div className="banner-message">{message}</div>
    </SuccessBanner>
  )
}
