import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../../dialog'
import { Dispatcher } from '../../dispatcher'
import { Repository } from '../../../models/repository'
import { MultiCommitOperationStepKind } from '../../../models/multi-commit-operation'
import { MultiCommitOperationConflictState } from '../../../lib/app-state'
import {
  WorkingDirectoryStatus,
  WorkingDirectoryFileChange,
} from '../../../models/status'
import { getUnmergedFiles, isConflictedFile } from '../../../lib/status'
import { OkCancelButtonGroup } from '../../dialog/ok-cancel-button-group'
import { Button } from '../../lib/button'
import { Octicon } from '../../octicons'
import * as octicons from '../../octicons/octicons.generated'
import { PathText } from '../../lib/path-text'
import { t } from 'i18next'

interface ICopilotConflictsDialogProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  readonly conflictState: MultiCommitOperationConflictState
  readonly workingDirectory: WorkingDirectoryStatus
  readonly operationKind: string
  readonly onContinueAfterConflicts: () => Promise<void>
  readonly onAbort: () => Promise<void>
}

interface ICopilotConflictsDialogState {
  readonly isContinuing: boolean
}

/**
 * Dialog shown after Copilot has resolved conflicts.
 *
 * Displays the list of conflicted files with Copilot resolution indicators
 * and allows the user to continue the operation or go back to manual
 * resolution.
 */
export class CopilotConflictsDialog extends React.Component<
  ICopilotConflictsDialogProps,
  ICopilotConflictsDialogState
> {
  public constructor(props: ICopilotConflictsDialogProps) {
    super(props)
    this.state = { isContinuing: false }
  }

  private onBackToManual = () => {
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

  private onContinue = async () => {
    this.setState({ isContinuing: true })
    // Write Copilot resolutions to disk before continuing the operation.
    // Done here (shared) so it works for merge, rebase, and cherry-pick.
    await this.props.dispatcher.applyCopilotConflictResolutions(
      this.props.repository
    )
    await this.props.onContinueAfterConflicts()
  }

  private renderFileList(
    files: ReadonlyArray<WorkingDirectoryFileChange>
  ): JSX.Element {
    const conflictedFiles = files.filter(f => isConflictedFile(f.status))

    return (
      <ul className="copilot-conflicts-file-list">
        {conflictedFiles.map(file => (
          <li key={file.path} className="copilot-conflicts-file-item">
            <Octicon className="copilot-file-icon" symbol={octicons.copilot} />
            <div className="copilot-file-details">
              <PathText path={file.path} />
              <span className="copilot-file-suggestion">
                {t(
                  'copilot-conflicts-dialog.resolved-by-copilot',
                  'Resolved by Copilot'
                )}
              </span>
            </div>
            <span className="copilot-resolution-badge">
              {t('copilot-conflicts-dialog.resolved-by-copilot', 'Copilot')}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  public render() {
    const { operationKind, workingDirectory } = this.props
    const { isContinuing } = this.state

    const unmergedFiles = getUnmergedFiles(workingDirectory)
    const operation = __DARWIN__ ? operationKind : operationKind.toLowerCase()

    return (
      <Dialog
        id="copilot-conflicts-dialog"
        dismissDisabled={isContinuing}
        onDismissed={this.onBackToManual}
        onSubmit={this.onContinue}
        title={t(
          'copilot-conflicts-dialog.resolve-conflicts',
          'Resolve conflicts before {{0}}',
          { 0: operationKind }
        )}
        loading={isContinuing}
        disabled={isContinuing}
      >
        <DialogContent>{this.renderFileList(unmergedFiles)}</DialogContent>
        <DialogFooter>
          <Button onClick={this.onBackToManual} disabled={isContinuing}>
            {t('copilot-conflicts-dialog.back-to-manual', 'Back to manual')}
          </Button>
          <OkCancelButtonGroup
            okButtonText={t(
              'copilot-conflicts-dialog.continue',
              'Continue {{0}}',
              { 0: operation }
            )}
            cancelButtonText={t(
              'copilot-conflicts-dialog.abort',
              'Abort {{0}}',
              { 0: operation }
            )}
            onCancelButtonClick={this.onAbort}
            cancelButtonDisabled={isContinuing}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onAbort = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    await this.props.onAbort()
  }
}
