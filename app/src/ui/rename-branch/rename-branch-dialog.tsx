import * as React from 'react'

import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { Branch } from '../../models/branch'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { renderBranchHasRemoteWarning } from '../lib/branch-name-warnings'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { RefNameTextBox } from '../lib/ref-name-text-box'
import { t } from 'i18next'

interface IRenameBranchProps {
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void
  readonly repository: Repository
  readonly branch: Branch
}

interface IRenameBranchState {
  readonly newName: string
}

export class RenameBranch extends React.Component<
  IRenameBranchProps,
  IRenameBranchState
> {
  public constructor(props: IRenameBranchProps) {
    super(props)

    this.state = { newName: props.branch.name }
  }

  public render() {
    return (
      <Dialog
        id="rename-branch"
        title={
          __DARWIN__
            ? t('rename-branch-dialog.rename-branch-darwin', 'Rename Branch')
            : t('rename-branch-dialog.rename-branch', 'Rename branch')
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.renameBranch}
        focusCloseButtonOnOpen={true}
      >
        <DialogContent>
          {renderBranchHasRemoteWarning(this.props.branch)}
          <RefNameTextBox
            label={t('common.name', 'Name')}
            placeholder={
              __DARWIN__
                ? t('common.branch-name-darwin', 'Branch Name')
                : t('common.branch-name', 'Branch name')
            }
            initialValue={this.props.branch.name}
            onValueChange={this.onNameChange}
          />
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={t(
              'rename-branch-dialog.rename-branch-name',
              `Rename {{0}}`,
              { 0: this.props.branch.name }
            )}
            okButtonDisabled={this.state.newName.length === 0}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onNameChange = (name: string) => {
    this.setState({ newName: name })
  }

  private renameBranch = () => {
    this.props.dispatcher.renameBranch(
      this.props.repository,
      this.props.branch,
      this.state.newName
    )
    this.props.onDismissed()
  }
}
