import * as React from 'react'
import * as Path from 'path'
import { Dispatcher } from '../dispatcher'
import { addSafeDirectory, getRepositoryType } from '../../lib/git'
import { Button } from '../lib/button'
import { TextBox } from '../lib/text-box'
import { Row } from '../lib/row'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { LinkButton } from '../lib/link-button'
import { PopupType } from '../../models/popup'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

import untildify from 'untildify'
import { showOpenDialog } from '../main-process-proxy'
import { Ref } from '../lib/ref'
import { t } from 'i18next'

interface IAddExistingRepositoryProps {
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void

  /** An optional path to prefill the path text box with.
   * Defaults to the empty string if not defined.
   */
  readonly path?: string
}

interface IAddExistingRepositoryState {
  readonly path: string

  /**
   * Indicates whether or not the path provided in the path state field exists and
   * is a valid Git repository. This value is immediately switched
   * to false when the path changes and updated (if necessary) by the
   * function, checkIfPathIsRepository.
   *
   * If set to false the user will be prevented from submitting this dialog
   * and given the option to create a new repository instead.
   */
  readonly isRepository: boolean

  /**
   * Indicates whether or not to render a warning message about the entered path
   * not containing a valid Git repository. This value differs from `isGitRepository` in that it holds
   * its value when the path changes until we've gotten a definitive answer from the asynchronous
   * method that the path is, or isn't, a valid repository path. Separating the two means that
   * we don't toggle visibility of the warning message until it's really necessary, preventing
   * flickering for our users as they type in a path.
   */
  readonly showNonGitRepositoryWarning: boolean
  readonly isRepositoryBare: boolean
  readonly isRepositoryUnsafe: boolean
  readonly repositoryUnsafePath?: string
  readonly isTrustingRepository: boolean
}

/** The component for adding an existing local repository. */
export class AddExistingRepository extends React.Component<
  IAddExistingRepositoryProps,
  IAddExistingRepositoryState
> {
  public constructor(props: IAddExistingRepositoryProps) {
    super(props)

    const path = this.props.path ? this.props.path : ''

    this.state = {
      path,
      isRepository: false,
      showNonGitRepositoryWarning: false,
      isRepositoryBare: false,
      isRepositoryUnsafe: false,
      isTrustingRepository: false,
    }
  }

  public async componentDidMount() {
    const { path } = this.state

    if (path.length !== 0) {
      await this.validatePath(path)
    }
  }

  private onTrustDirectory = async () => {
    this.setState({ isTrustingRepository: true })
    const { repositoryUnsafePath, path } = this.state
    if (repositoryUnsafePath) {
      await addSafeDirectory(repositoryUnsafePath)
    }
    await this.validatePath(path)
    this.setState({ isTrustingRepository: false })
  }

  private async updatePath(path: string) {
    this.setState({ path, isRepository: false })
    await this.validatePath(path)
  }

  private async validatePath(path: string) {
    if (path.length === 0) {
      this.setState({
        isRepository: false,
        isRepositoryBare: false,
        showNonGitRepositoryWarning: false,
      })
      return
    }

    const type = await getRepositoryType(path)

    const isRepository = type.kind !== 'missing' && type.kind !== 'unsafe'
    const isRepositoryUnsafe = type.kind === 'unsafe'
    const isRepositoryBare = type.kind === 'bare'
    const showNonGitRepositoryWarning = !isRepository || isRepositoryBare
    const repositoryUnsafePath = type.kind === 'unsafe' ? type.path : undefined

    this.setState(state =>
      path === state.path
        ? {
            isRepository,
            isRepositoryBare,
            isRepositoryUnsafe,
            showNonGitRepositoryWarning,
            repositoryUnsafePath,
          }
        : null
    )
  }

  private renderWarning() {
    if (!this.state.path.length || !this.state.showNonGitRepositoryWarning) {
      return null
    }

    if (this.state.isRepositoryBare) {
      return (
        <Row className="warning-helper-text">
          <Octicon symbol={OcticonSymbol.alert} />
          <p>
            {t(
              'add-existing-repository.warning-helper-bare-repository',
              `This directory appears to be a bare repository. Bare repositories
               are not currently supported.`
            )}
          </p>
        </Row>
      )
    }

    const { isRepositoryUnsafe, repositoryUnsafePath, path } = this.state

    if (isRepositoryUnsafe && repositoryUnsafePath !== undefined) {
      // Git for Windows will replace backslashes with slashes in the error
      // message so we'll do the same to not show "the repo at path c:/repo"
      // when the entered path is `c:\repo`.
      const convertedPath = __WIN32__ ? path.replaceAll('\\', '/') : path

      return (
        <Row className="warning-helper-text">
          <Octicon symbol={OcticonSymbol.alert} />
          <div>
            <p>
              {t(
                'add-existing-repository.warning-helper-text1-1',
                'The Git repository'
              )}
              {repositoryUnsafePath !== convertedPath && (
                <>
                  {t('add-existing-repository.warning-helper-text1-2', ' at ')}
                  <Ref>{repositoryUnsafePath}</Ref>
                </>
              )}
              {t(
                'add-existing-repository.warning-helper-text1-3',
                ` appears to be owned by another user on your machine. Adding
                  untrusted repositories may automatically execute files in the
                  repository.`
              )}
            </p>
            <p>
              {t(
                'add-existing-repository.warning-helper-text2-1',
                'If you trust the owner of the directory you can'
              )}
              <LinkButton onClick={this.onTrustDirectory}>
                {t(
                  'add-existing-repository.warning-helper-text2-2',
                  'add an exception for this directory'
                )}
              </LinkButton>
              {t(
                'add-existing-repository.warning-helper-text2-3',
                ' in order to continue.'
              )}
            </p>
          </div>
        </Row>
      )
    }

    return (
      <Row className="warning-helper-text">
        <Octicon symbol={OcticonSymbol.alert} />
        <p>
          {t(
            'add-existing-repository.warning-helper-text3-1',
            'This directory does not appear to be a Git repository.'
          )}
          <br />
          {t(
            'add-existing-repository.warning-helper-text3-2',
            'Would you like to '
          )}
          <LinkButton onClick={this.onCreateRepositoryClicked}>
            {t(
              'add-existing-repository.create-a-repository',
              'create a repository'
            )}
          </LinkButton>
          {t(
            'add-existing-repository.warning-helper-text3-3',
            ' here instead?'
          )}
        </p>
      </Row>
    )
  }

  public render() {
    const disabled =
      this.state.path.length === 0 ||
      !this.state.isRepository ||
      this.state.isRepositoryBare

    return (
      <Dialog
        id="add-existing-repository"
        title={
          __DARWIN__
            ? t(
                'add-existing-repository.add-local-repository-darwin',
                'Add Local Repository'
              )
            : t(
                'add-existing-repository.add-local-repository',
                'Add local repository'
              )
        }
        onSubmit={this.addRepository}
        onDismissed={this.props.onDismissed}
        loading={this.state.isTrustingRepository}
      >
        <DialogContent>
          <Row>
            <TextBox
              value={this.state.path}
              label={
                __DARWIN__
                  ? t('common.local-path-darwin', 'Local Path')
                  : t('common.local-path', 'Local path')
              }
              placeholder={t('common.repository-path', 'repository path')}
              onValueChanged={this.onPathChanged}
            />
            <Button onClick={this.showFilePicker}>
              {t('common.choose', 'Choose…')}
            </Button>
          </Row>
          {this.renderWarning()}
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={
              __DARWIN__
                ? t(
                    'add-existing-repository.add-repository-darwin',
                    'Add Repository'
                  )
                : t('add-existing-repository.add-repository', 'Add repository')
            }
            okButtonDisabled={disabled}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onPathChanged = async (path: string) => {
    if (this.state.path !== path) {
      this.updatePath(path)
    }
  }

  private showFilePicker = async () => {
    const path = await showOpenDialog({
      properties: ['createDirectory', 'openDirectory'],
    })

    if (path === null) {
      return
    }

    this.updatePath(path)
  }

  private resolvedPath(path: string): string {
    return Path.resolve('/', untildify(path))
  }

  private addRepository = async () => {
    this.props.onDismissed()
    const { dispatcher } = this.props

    const resolvedPath = this.resolvedPath(this.state.path)
    const repositories = await dispatcher.addRepositories([resolvedPath])

    if (repositories.length > 0) {
      dispatcher.selectRepository(repositories[0])
      dispatcher.recordAddExistingRepository()
    }
  }

  private onCreateRepositoryClicked = () => {
    const resolvedPath = this.resolvedPath(this.state.path)

    return this.props.dispatcher.showPopup({
      type: PopupType.CreateRepository,
      path: resolvedPath,
    })
  }
}
