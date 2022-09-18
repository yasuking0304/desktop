import * as React from 'react'
import { IStashEntry } from '../../models/stash-entry'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { PopupType } from '../../models/popup'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IStashDiffHeaderProps {
  readonly stashEntry: IStashEntry
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  readonly isWorkingTreeClean: boolean
}

interface IStashDiffHeaderState {
  readonly isRestoring: boolean
}

/**
 * Component to provide the actions that can be performed
 * on a stash while viewing a stash diff
 */
export class StashDiffHeader extends React.Component<
  IStashDiffHeaderProps,
  IStashDiffHeaderState
> {
  public constructor(props: IStashDiffHeaderProps) {
    super(props)

    this.state = {
      isRestoring: false,
    }
  }

  public render() {
    const { isWorkingTreeClean } = this.props
    const { isRestoring } = this.state

    return (
      <div className="header">
        <h3>{t('stash-diff-header.stashed-changes', 'Stashed changes')}</h3>
        <div className="row">
          <OkCancelButtonGroup
            okButtonText={t('stash-diff-header.restore', 'Restore')}
            okButtonDisabled={isRestoring || !isWorkingTreeClean}
            onOkButtonClick={this.onRestoreClick}
            cancelButtonText={t('stash-diff-header.discard', 'Discard')}
            cancelButtonDisabled={isRestoring}
            onCancelButtonClick={this.onDiscardClick}
          />
          {this.renderExplanatoryText()}
        </div>
      </div>
    )
  }

  private renderExplanatoryText() {
    const { isWorkingTreeClean } = this.props

    if (isWorkingTreeClean || this.state.isRestoring) {
      return (
        <div className="explanatory-text">
          <span className="text">
            <strong>{t('stash-diff-header.restore', 'Restore')}</strong>
            {t(
              'stash-diff-header.will-move-your-stashed-files',
              ` will move your stashed files to the Changes list.`
            )}
          </span>
        </div>
      )
    }

    return (
      <div className="explanatory-text">
        <Octicon symbol={OcticonSymbol.alert} />
        <span className="text">
          {t(
            'stash-diff-header.unable-to-restore-stash',
            'Unable to restore stash when changes are present on your branch.'
          )}
        </span>
      </div>
    )
  }

  private onDiscardClick = () => {
    const { dispatcher, repository, stashEntry } = this.props
    dispatcher.showPopup({
      type: PopupType.ConfirmDiscardStash,
      stash: stashEntry,
      repository,
    })
  }

  private onRestoreClick = async () => {
    const { dispatcher, repository, stashEntry } = this.props

    this.setState({ isRestoring: true }, () => {
      dispatcher.popStash(repository, stashEntry)
    })
  }
}
