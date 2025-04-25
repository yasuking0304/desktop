import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  OkCancelButtonGroup,
} from '../dialog'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { WorkingDirectoryFileChange } from '../../models/status'
import { LinkButton } from '../lib/link-button'
import { t } from 'i18next'

interface IGenerateCommitMessageDisclaimerProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly filesSelected: ReadonlyArray<WorkingDirectoryFileChange>

  /**
   * Callback to use when the dialog gets closed.
   */
  readonly onDismissed: () => void
}

export class GenerateCommitMessageDisclaimer extends React.Component<IGenerateCommitMessageDisclaimerProps> {
  public constructor(props: IGenerateCommitMessageDisclaimerProps) {
    super(props)
  }

  public render() {
    return (
      <Dialog
        title={t(
          'generate-commit-message-disclaimer.github-copilot',
          'GitHub Copilot'
        )}
        id="generate-commit-message-disclaimer"
        type="warning"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        ariaDescribedBy="generate-commit-message-disclaimer-body"
        role="alertdialog"
      >
        <DialogContent>
          <p id="generate-commit-message-disclaimer-body">
            {t(
              'generate-commit-message-disclaimer.copilot-is-powered-by-ai',
              `Copilot is powered by AI, so mistakes are possible. Review and edit
              the generated message carefully before use. `
            )}
            <LinkButton uri="https://gh.io/copilot-for-desktop-transparency">
              {t(
                'generate-commit-message-disclaimer.learn-more-about-copilot',
                'Learn more about Copilot in GitHub Desktop.'
              )}
            </LinkButton>
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={t('common.i-understand', 'I understand')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSubmit = async () => {
    this.props.dispatcher.updateCommitMessageGenerationDisclaimerLastSeen()
    this.props.dispatcher.generateCommitMessage(
      this.props.repository,
      this.props.filesSelected
    )
    this.props.onDismissed()
  }
}
