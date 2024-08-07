import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DefaultDialogFooter,
} from '../dialog'
import { Dispatcher } from '../dispatcher'
import {
  RepositoryWithGitHubRepository,
  isRepositoryWithForkedGitHubRepository,
} from '../../models/repository'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { sendNonFatalException } from '../../lib/helpers/non-fatal-exception'
import { Account } from '../../models/account'
import { API } from '../../lib/api'
import { LinkButton } from '../lib/link-button'
import { PopupType } from '../../models/popup'
import { t } from 'i18next'

interface ICreateForkDialogProps {
  readonly dispatcher: Dispatcher
  readonly repository: RepositoryWithGitHubRepository
  readonly account: Account
  readonly onDismissed: () => void
}

interface ICreateForkDialogState {
  readonly loading: boolean
  readonly error?: Error
}

/**
 * Dialog offering to create a fork of the given repository
 */
export class CreateForkDialog extends React.Component<
  ICreateForkDialogProps,
  ICreateForkDialogState
> {
  public constructor(props: ICreateForkDialogProps) {
    super(props)
    this.state = { loading: false }
  }
  /**
   *  Starts fork process on GitHub!
   */
  private onSubmit = async () => {
    this.setState({ loading: true })
    const { gitHubRepository } = this.props.repository
    const api = API.fromAccount(this.props.account)
    try {
      const fork = await api.forkRepository(
        gitHubRepository.owner.login,
        gitHubRepository.name
      )
      this.props.dispatcher.incrementMetric('forksCreated')
      const updatedRepository =
        await this.props.dispatcher.convertRepositoryToFork(
          this.props.repository,
          fork
        )
      this.setState({ loading: false })
      this.props.onDismissed()

      if (isRepositoryWithForkedGitHubRepository(updatedRepository)) {
        this.props.dispatcher.showPopup({
          type: PopupType.ChooseForkSettings,
          repository: updatedRepository,
        })
      }
    } catch (e) {
      log.error(`Fork creation through API failed (${e})`)
      sendNonFatalException('forkCreation', e)
      this.setState({ error: e, loading: false })
    }
  }

  public render() {
    return (
      <Dialog
        title={t(
          'create-fork-dialog.do-you-want-to-fork-title',
          'Do you want to fork this repository?'
        )}
        onDismissed={this.props.onDismissed}
        onSubmit={this.state.error ? undefined : this.onSubmit}
        dismissDisabled={this.state.loading}
        loading={this.state.loading}
        type={this.state.error ? 'error' : 'normal'}
        key={this.props.repository.name}
        id="create-fork"
      >
        {this.state.error !== undefined
          ? renderCreateForkDialogError(
              this.props.repository,
              this.props.account,
              this.state.error
            )
          : renderCreateForkDialogContent(
              this.props.repository,
              this.props.account,
              this.state.loading
            )}
      </Dialog>
    )
  }
}

/** Standard (non-error) message and buttons for `CreateForkDialog` */
function renderCreateForkDialogContent(
  repository: RepositoryWithGitHubRepository,
  account: Account,
  loading: boolean
) {
  return (
    <>
      <DialogContent>
        <p>
          {t(
            'create-fork-dialog.donot-have-write-access-1',
            `It looks like you don’t have write access to `
          )}
          <strong>{repository.gitHubRepository.fullName}</strong>
          {t(
            'create-fork-dialog.donot-have-write-access-2',
            `. If you should, please check with a repository administrator.`
          )}
        </p>
        <p>
          {t(
            'create-fork-dialog.do-you-want-to-fork-1',
            ` Do you want to create a fork of this repository at `
          )}
          <strong>
            {`${account.login}/${repository.gitHubRepository.name}`}
          </strong>
          {t('create-fork-dialog.do-you-want-to-fork-2', ` to continue?`)}
        </p>
      </DialogContent>
      <DialogFooter>
        <OkCancelButtonGroup
          destructive={true}
          okButtonText={
            __DARWIN__
              ? t(
                  'create-fork-dialog.fork-this-repository-darwin',
                  'Fork This Repository'
                )
              : t(
                  'create-fork-dialog.fork-this-repository',
                  'Fork this repository'
                )
          }
          okButtonDisabled={loading}
          cancelButtonDisabled={loading}
        />
      </DialogFooter>
    </>
  )
}

/** Error state message (and buttons) for `CreateForkDialog` */
function renderCreateForkDialogError(
  repository: RepositoryWithGitHubRepository,
  account: Account,
  error: Error
) {
  const suggestion =
    repository.gitHubRepository.htmlURL !== null ? (
      <>
        {t('create-fork-dialog.error.you-can-try-1', `You can try `)}
        <LinkButton uri={repository.gitHubRepository.htmlURL}>
          {t(
            'create-fork-dialog.error.you-can-try-2',
            'creating the fork manually on GitHub'
          )}
        </LinkButton>
        {t('create-fork-dialog.error.you-can-try-3', '.')}
      </>
    ) : undefined
  return (
    <>
      <DialogContent>
        <div>
          {t(
            'create-fork-dialog.error.create-fork-failed-1',
            `Creating your fork `
          )}
          <strong>
            {`${account.login}/${repository.gitHubRepository.name}`}
          </strong>
          {t('create-fork-dialog.error.create-fork-failed-2', ` failed. `)}
          {suggestion}
        </div>
        <details>
          <summary>
            {t('create-fork-dialog.error-details', 'Error details')}
          </summary>
          <pre className="error">{error.message}</pre>
        </details>
      </DialogContent>
      <DefaultDialogFooter />
    </>
  )
}
