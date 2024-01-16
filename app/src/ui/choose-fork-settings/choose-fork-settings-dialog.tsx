import * as React from 'react'

import {
  RepositoryWithForkedGitHubRepository,
  getForkContributionTarget,
} from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Row } from '../lib/row'
import { Dialog, DialogContent, DialogFooter } from '../dialog'

import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { ForkContributionTarget } from '../../models/workflow-preferences'
import { VerticalSegmentedControl } from '../lib/vertical-segmented-control'
import { ForkSettingsDescription } from '../repository-settings/fork-contribution-target-description'
import { t } from 'i18next'

interface IChooseForkSettingsProps {
  readonly dispatcher: Dispatcher
  /**
   * The current repository.
   * It needs to be a forked GitHub-based repository
   */
  readonly repository: RepositoryWithForkedGitHubRepository
  /**
   * Event triggered when the dialog is dismissed by the user.
   * This happens both when the user clicks on "Continue" to
   * save their changes or when they click on "Cancel".
   */
  readonly onDismissed: () => void
}

interface IChooseForkSettingsState {
  /** The currently selected ForkContributionTarget value */
  readonly forkContributionTarget: ForkContributionTarget
}

export class ChooseForkSettings extends React.Component<
  IChooseForkSettingsProps,
  IChooseForkSettingsState
> {
  public constructor(props: IChooseForkSettingsProps) {
    super(props)

    this.state = {
      forkContributionTarget: getForkContributionTarget(props.repository),
    }
  }

  public render() {
    const items = [
      {
        title: t(
          'choose-fork-settings-dialog.contribute-to-parent-project',
          'To contribute to the parent project'
        ),
        description: (
          <>
            {t(
              'choose-fork-settings-dialog.we-will-help-you-contribute-1',
              'We will help you contribute to the '
            )}
            <strong>
              {this.props.repository.gitHubRepository.parent.fullName}
            </strong>
            {t(
              'choose-fork-settings-dialog.we-will-help-you-contribute-2',
              ' repository'
            )}
          </>
        ),
        key: ForkContributionTarget.Parent,
      },
      {
        title: t(
          'choose-fork-settings-dialog.for-my-own-purposes',
          'For my own purposes'
        ),
        description: (
          <>
            {t(
              'choose-fork-settings-dialog.we-will-for-my-own-purposes-1',
              'We will help you contribute to the '
            )}
            <strong>{this.props.repository.gitHubRepository.fullName}</strong>
            {t(
              'choose-fork-settings-dialog.we-will-for-my-own-purposes-2',
              ' repository'
            )}
          </>
        ),
        key: ForkContributionTarget.Self,
      },
    ]

    return (
      <Dialog
        id="fork-settings"
        title={t(
          'choose-fork-settings-dialog.you-planning-to-use-this-fork',
          'How are you planning to use this fork?'
        )}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <Row>
            <VerticalSegmentedControl
              label={t(
                'choose-fork-settings-dialog.you-have-changes-on-this-branch',
                'You have changes on this branch. What would you like to do with them?'
              )}
              items={items}
              selectedKey={this.state.forkContributionTarget}
              onSelectionChanged={this.onSelectionChanged}
            />
          </Row>
          <Row>
            <ForkSettingsDescription
              repository={this.props.repository}
              forkContributionTarget={this.state.forkContributionTarget}
            />
          </Row>
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={t('common.continue', 'Continue')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSelectionChanged = (value: ForkContributionTarget) => {
    this.setState({
      forkContributionTarget: value,
    })
  }

  private onSubmit = async () => {
    this.props.dispatcher.updateRepositoryWorkflowPreferences(
      this.props.repository,
      {
        forkContributionTarget: this.state.forkContributionTarget,
      }
    )
    this.props.onDismissed()
  }
}
