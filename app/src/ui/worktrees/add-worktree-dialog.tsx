import * as React from 'react'

import { Branch, BranchType } from '../../models/branch'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { RefNameTextBox } from '../lib/ref-name-text-box'
import { Row } from '../lib/row'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { addWorktree, listWorktrees } from '../../lib/git/worktree'
import { BranchAutocompletionProvider } from '../autocompletion/branch-autocompletion-provider'
import memoizeOne from 'memoize-one'
import { RepositoryPath } from '../lib/repository-path'
import { Ref } from '../lib/ref'
import { sanitizedRefName } from '../../lib/sanitize-ref-name'
import { t } from 'i18next'

interface IAddWorktreeDialogProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void
  readonly initialBranchName?: string
  readonly initialWorktreeName?: string
  readonly allBranches: ReadonlyArray<Branch>
}

interface IAddWorktreeDialogState {
  readonly fullPath: string | null
  readonly worktreeName: string
  readonly branchName: string
  readonly creating: boolean
}

export class AddWorktreeDialog extends React.Component<
  IAddWorktreeDialogProps,
  IAddWorktreeDialogState
> {
  private getAutocompletionProvider = memoizeOne(
    (branches: ReadonlyArray<Branch>) =>
      new BranchAutocompletionProvider(branches)
  )

  public constructor(props: IAddWorktreeDialogProps) {
    super(props)

    this.state = {
      fullPath: null,
      worktreeName: '',
      branchName: props.initialBranchName ?? '',
      creating: false,
    }
  }

  private onFullPathChanged = (fullPath: string | null) => {
    this.setState({ fullPath })
  }

  private onWorktreeNameChanged = (worktreeName: string) => {
    this.setState({ worktreeName })
  }

  private onBranchNameChanged = (branchName: string) => {
    this.setState({ branchName })
  }

  /**
   * Returns the effective branch name to use. If the user has explicitly
   * entered a branch name, that is used. Otherwise, fall back to the
   * sanitized worktree name.
   */
  private getEffectiveBranchName(): string {
    const { branchName, worktreeName } = this.state
    if (branchName.length > 0) {
      return branchName
    }
    return sanitizedRefName(worktreeName)
  }

  private onSubmit = async () => {
    const { fullPath } = this.state

    if (fullPath === null) {
      return
    }

    const effectiveBranchName = this.getEffectiveBranchName()

    this.setState({ creating: true })

    const branch = this.props.allBranches.find(
      b => b.name === effectiveBranchName
    )

    try {
      if (branch?.type === BranchType.Remote) {
        // Remote branch: create a new local branch from the remote ref
        await addWorktree(this.props.repository, fullPath, {
          createBranch: branch.nameWithoutRemote,
          commitish: branch.ref,
        })
      } else if (branch) {
        // Existing local branch: check it out in the new worktree
        await addWorktree(this.props.repository, fullPath, {
          commitish: branch.name,
        })
      } else {
        // New branch: create it in the new worktree
        await addWorktree(this.props.repository, fullPath, {
          createBranch: effectiveBranchName,
        })
      }
    } catch (e) {
      this.props.dispatcher.postError(e)
      this.setState({ creating: false })
      return
    }

    const { dispatcher, repository } = this.props
    const worktrees = await listWorktrees(repository)
    const worktree = worktrees.find(wt => wt.path === fullPath)

    if (!worktree) {
      this.props.dispatcher.postError(
        new Error('Failed to find the newly created worktree')
      )
      this.setState({ creating: false })
      return
    }

    dispatcher.incrementMetric('worktreeCreatedCount')
    await dispatcher.switchWorktree(repository, worktree)

    this.setState({ creating: false })
    this.props.onDismissed()
  }

  private renderBranchStatus() {
    const effectiveName = this.getEffectiveBranchName()

    if (effectiveName.length === 0) {
      return null
    }

    const branch = this.props.allBranches.find(b => b.name === effectiveName)

    if (!branch) {
      return null
    }

    return (
      <Row>
        <p className="branch-status-hint">
          {branch.type === BranchType.Remote ? (
            <>
              {t(
                'add-worktree-dialog.will-check-out-remote-branch-1',
                'Will check out remote branch '
              )}
              <Ref>{effectiveName}</Ref>
              {t('add-worktree-dialog.will-check-out-remote-branch-2', '.')}
            </>
          ) : (
            <>
              {t(
                'add-worktree-dialog.will-check-out-existing-branch-1',
                'Will check out existing branch '
              )}
              <Ref>{effectiveName}</Ref>
              {t('add-worktree-dialog.will-check-out-existing-branch-2', '.')}
            </>
          )}
        </p>
      </Row>
    )
  }

  private renderPathMessage() {
    const { fullPath } = this.state
    if (fullPath === null) {
      return null
    }

    return (
      <div id="add-worktree-path-msg">
        {t(
          'add-worktree-dialog.worktree-path-message-1',
          'Worktree will be created at '
        )}
        <Ref>{fullPath}</Ref>
        {t('add-worktree-dialog.worktree-path-message-2', '.')}
      </div>
    )
  }

  public render() {
    const disabled =
      this.state.fullPath === null ||
      this.state.creating ||
      this.getEffectiveBranchName().length === 0
    const branchPlaceholder = sanitizedRefName(this.state.worktreeName)

    return (
      <Dialog
        id="add-worktree"
        title={
          __DARWIN__
            ? t('add-worktree-dialog.title-darwin', 'Add Worktree')
            : t('add-worktree-dialog.title', 'Add worktree')
        }
        loading={this.state.creating}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <RepositoryPath
            initialName={
              this.props.initialWorktreeName ?? this.props.initialBranchName
            }
            onFullPathChanged={this.onFullPathChanged}
            onNameChanged={this.onWorktreeNameChanged}
            nameLabel={
              __DARWIN__
                ? t(
                    'add-worktree-dialog.worktree-name-label-darwin',
                    'Worktree Name'
                  )
                : t('add-worktree-dialog.worktree-name-label', 'Worktree name')
            }
            namePlaceholder={
              __DARWIN__
                ? t(
                    'add-worktree-dialog.worktree-name-placeholder-darwin',
                    'Worktree name'
                  )
                : t(
                    'add-worktree-dialog.worktree-name-placeholder',
                    'Worktree name'
                  )
            }
            pathPlaceholder={
              __DARWIN__
                ? t(
                    'add-worktree-dialog.worktree-path-placeholder-darwin',
                    'Worktree path'
                  )
                : t(
                    'add-worktree-dialog.worktree-path-placeholder',
                    'Worktree path'
                  )
            }
          />

          <Row>
            <RefNameTextBox
              label={
                __DARWIN__
                  ? t(
                      'add-worktree-dialog.branch-name-label-darwin',
                      'Branch Name'
                    )
                  : t('add-worktree-dialog.branch-name-label', 'Branch name')
              }
              placeholder={branchPlaceholder}
              initialValue={this.state.branchName}
              onValueChange={this.onBranchNameChanged}
              autocompletionProvider={this.getAutocompletionProvider(
                this.props.allBranches
              )}
            />
          </Row>
          {this.renderBranchStatus()}
        </DialogContent>

        <DialogFooter>
          {this.renderPathMessage()}
          <OkCancelButtonGroup
            okButtonText={
              __DARWIN__
                ? t(
                    'add-worktree-dialog.create-worktree-darwin',
                    'Create Worktree'
                  )
                : t('add-worktree-dialog.create-worktree', 'Create worktree')
            }
            okButtonDisabled={disabled}
          />
        </DialogFooter>
      </Dialog>
    )
  }
}
