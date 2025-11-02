import * as React from 'react'
import { formatRebaseValue } from '../../../lib/rebase'
import { RichText } from '../../lib/rich-text'
import { Dialog, DialogContent } from '../../dialog'
import { Octicon } from '../../octicons'
import * as octicons from '../../octicons/octicons.generated'
import { IMultiCommitOperationProgress } from '../../../models/progress'
import { t } from 'i18next'
import { Emoji } from '../../../lib/emoji'

interface IProgressDialogProps {
  /**
   * This is expected to be capitalized.
   *
   * Examples:
   *  - Rebase
   *  - Cherry-pick
   *  - Squash
   *  - Reorder
   */
  readonly operation: string
  readonly progress: IMultiCommitOperationProgress
  readonly emoji: Map<string, Emoji>
}

export class ProgressDialog extends React.Component<IProgressDialogProps> {
  public render() {
    const { progress, operation, emoji } = this.props
    const { position, totalCommitCount, value, currentCommitSummary } = progress

    const progressValue = formatRebaseValue(value)
    return (
      <Dialog
        dismissDisabled={true}
        id="multi-commit-progress"
        title={t('progress-dialog.in-progress', '{{0}} in progress', {
          0: operation,
        })}
      >
        <DialogContent>
          <div>
            <progress value={progressValue} />

            <div className="details">
              <div className="green-circle">
                <Octicon symbol={octicons.check} />
              </div>
              <div className="summary">
                <div className="message">
                  {t('progress-dialog.commit-0-of-1', 'Commit {{0}} of {{1}}', {
                    0: position,
                    1: totalCommitCount,
                  })}
                </div>
                <div className="detail">
                  <RichText emoji={emoji} text={currentCommitSummary || ''} />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
}
