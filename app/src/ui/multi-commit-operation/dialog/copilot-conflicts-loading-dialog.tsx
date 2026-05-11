import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../../dialog'
import { Dispatcher } from '../../dispatcher'
import { Repository } from '../../../models/repository'
import { MultiCommitOperationStepKind } from '../../../models/multi-commit-operation'
import { MultiCommitOperationConflictState } from '../../../lib/app-state'
import { IConflictResolutionProgress } from '../../../lib/copilot-conflict-resolution'
import { OkCancelButtonGroup } from '../../dialog/ok-cancel-button-group'
import { Octicon } from '../../octicons'
import * as octicons from '../../octicons/octicons.generated'
import { t } from 'i18next'

interface ICopilotConflictsLoadingDialogProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  readonly conflictState: MultiCommitOperationConflictState
  readonly progress: IConflictResolutionProgress | null
}

/**
 * A loading interstitial shown while Copilot is resolving conflicts.
 * Displays a spinner and allows the user to cancel back to manual resolution.
 */
export class CopilotConflictsLoadingDialog extends React.Component<ICopilotConflictsLoadingDialogProps> {
  private onCancel = () => {
    const { dispatcher, repository, conflictState } = this.props

    dispatcher.setMultiCommitOperationStepWithCopilotResolution(
      repository,
      {
        kind: MultiCommitOperationStepKind.ShowConflicts,
        conflictState,
      },
      false
    )
  }

  private renderProgress(): JSX.Element | null {
    const { progress } = this.props
    if (progress === null) {
      return null
    }

    const { filesResolved, filesTotal } = progress
    return (
      <p className="copilot-conflicts-loading-progress">
        {t(
          'copilot-conflicts-loading-dialog.progress',
          '{0} of {1} files resolved',
          {
            0: filesResolved,
            1: filesTotal,
          }
        )}
      </p>
    )
  }

  public render() {
    return (
      <Dialog
        dismissDisabled={true}
        id="copilot-conflicts-loading"
        title={t('copilot-conflicts-loading-dialog.title', 'Copilot')}
      >
        <DialogContent>
          <div className="copilot-conflicts-loading-content">
            <Octicon symbol={octicons.copilot} />
            <p>
              {t(
                'copilot-conflicts-loading-dialog.resolving',
                'Resolving conflicts with Copilot…'
              )}
            </p>
            {this.renderProgress()}
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            cancelButtonText={t('common.cancel', 'Cancel')}
            onCancelButtonClick={this.onCancel}
            okButtonDisabled={true}
            okButtonText={t('common.continue', 'Continue')}
          />
        </DialogFooter>
      </Dialog>
    )
  }
}
