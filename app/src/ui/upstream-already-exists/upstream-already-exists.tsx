import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Repository } from '../../models/repository'
import { IRemote } from '../../models/remote'
import { Ref } from '../lib/ref'
import { forceUnwrap } from '../../lib/fatal-error'
import { UpstreamRemoteName } from '../../lib/stores'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IUpstreamAlreadyExistsProps {
  readonly repository: Repository
  readonly existingRemote: IRemote

  readonly onDismissed: () => void

  /** Called when the user chooses to update the existing remote. */
  readonly onUpdate: (repository: Repository) => void

  /** Called when the user chooses to ignore the warning. */
  readonly onIgnore: (repository: Repository) => void
}

/**
 * The dialog shown when a repository is a fork but its upstream remote doesn't
 * point to the parent repository.
 */
export class UpstreamAlreadyExists extends React.Component<IUpstreamAlreadyExistsProps> {
  public render() {
    const name = this.props.repository.name
    const gitHubRepository = forceUnwrap(
      t(
        'upstream-already-exists.must-have-a-github-repository',
        'A repository must have a GitHub repository to add an upstream remote'
      ),
      this.props.repository.gitHubRepository
    )
    const parent = forceUnwrap(
      t(
        'upstream-already-exists.must-have-a-parent-repository',
        'A repository must have a parent repository to add an upstream remote'
      ),
      gitHubRepository.parent
    )
    const parentName = parent.fullName
    const existingURL = this.props.existingRemote.url
    const replacementURL = parent.cloneURL
    return (
      <Dialog
        title={
          __DARWIN__
            ? t(
                'upstream-already-exists.upstream-already-exists-darwin',
                'Upstream Already Exists'
              )
            : t(
                'upstream-already-exists.upstream-already-exists',
                'Upstream already exists'
              )
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.onUpdate}
        type="warning"
      >
        <DialogContent>
          <p>
            {t(
              'upstream-already-exists.the-repository-is-a-fork-1',
              'The repository '
            )}
            <Ref>{name}</Ref>
            {t(
              'upstream-already-exists.the-repository-is-a-fork-2',
              ' is a fork of '
            )}
            <Ref>{parentName}</Ref>
            {t(
              'upstream-already-exists.the-repository-is-a-fork-3',
              ', but its '
            )}
            <Ref>{UpstreamRemoteName}</Ref>
            {t(
              'upstream-already-exists.the-repository-is-a-fork-4',
              ' remote points elsewhere.'
            )}
          </p>
          <ul>
            <li>
              {t('upstream-already-exists.current', 'Current: ')}
              <Ref>{existingURL}</Ref>
            </li>
            <li>
              {t('upstream-already-exists.expected', 'Expected: ')}
              <Ref>{replacementURL}</Ref>
            </li>
          </ul>
          <p>
            {t(
              'upstream-already-exists.would-you-like-to-update',
              'Would you like to update the remote to use the expected URL?'
            )}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={t('common.update', 'Update')}
            cancelButtonText={t('common.ignore', 'Ignore')}
            onCancelButtonClick={this.onIgnore}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onUpdate = () => {
    this.props.onUpdate(this.props.repository)
    this.props.onDismissed()
  }

  private onIgnore = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    this.props.onIgnore(this.props.repository)
    this.props.onDismissed()
  }
}
