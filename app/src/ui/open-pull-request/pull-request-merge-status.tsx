import * as React from 'react'
import { assertNever } from '../../lib/fatal-error'
import { ComputedAction } from '../../models/computed-action'
import { MergeTreeResult } from '../../models/merge'
import { Octicon } from '../octicons'
import { t } from 'i18next'
import * as OcticonSymbol from '../octicons/octicons.generated'

interface IPullRequestMergeStatusProps {
  /** The result of merging the pull request branch into the base branch */
  readonly mergeStatus: MergeTreeResult | null
}

/** The component to display message about the result of merging the pull
 * request. */
export class PullRequestMergeStatus extends React.Component<IPullRequestMergeStatusProps> {
  private getMergeStatusDescription = () => {
    const { mergeStatus } = this.props
    if (mergeStatus === null) {
      return ''
    }

    const { kind } = mergeStatus
    switch (kind) {
      case ComputedAction.Loading:
        return (
          <span className="pr-merge-status-loading">
            <strong>Checking mergeability&hellip;</strong>{' '}
            {t(
              'pull-request-merge-status.donot-worry',
              `Don’t worry, you can still create the pull request.`
            )}
          </span>
        )
      case ComputedAction.Invalid:
        return (
          <span className="pr-merge-status-invalid">
            <strong>
              {t(
                'pull-request-merge-status.error-checking-merge-status',
                `Error checking merge status.`
              )}
            </strong>{' '}
            {t(
              'pull-request-merge-status.unable-to-merge-unrelated-histories',
              `Unable to merge unrelated histories in this repository`
            )}
          </span>
        )
      case ComputedAction.Clean:
        return (
          <span className="pr-merge-status-clean">
            <strong>
              <Octicon symbol={OcticonSymbol.check} />{' '}
              {t('pull-request-merge-status.able-to-merge', `Able to merge.`)}
            </strong>{' '}
            {t(
              'pull-request-merge-status.can-be-automatically-merge',
              `These branches can be automatically merged.`
            )}
          </span>
        )
      case ComputedAction.Conflicts:
        return (
          <span className="pr-merge-status-conflicts">
            <strong>
              <Octicon symbol={OcticonSymbol.x} />{' '}
              {t(
                'pull-request-merge-status.cannot-automatically-merge',
                `Can't automatically merge.`
              )}
            </strong>{' '}
            {t(
              'pull-request-merge-status.donot-worry',
              `Don’t worry, you can still create the pull request.`
            )}
          </span>
        )
      default:
        return assertNever(kind, `Unknown merge status kind of ${kind}.`)
    }
  }

  public render() {
    return (
      <div className="pull-request-merge-status">
        {this.getMergeStatusDescription()}
      </div>
    )
  }
}
