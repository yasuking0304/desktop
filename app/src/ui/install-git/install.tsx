import * as React from 'react'

import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { shell } from '../../lib/app-shell'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'

interface IInstallGitProps {
  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the Dialog component's dismissable prop.
   */
  readonly onDismissed: () => void

  /**
   * The path to the current repository, in case the user wants to continue
   * doing whatever they're doing.
   */
  readonly path: string

  /** Called when the user chooses to open the shell. */
  readonly onOpenShell: (path: string) => void
}

/**
 * A dialog indicating that Git wasn't found, to direct the user to an
 * external resource for more information about setting up their environment.
 */
export class InstallGit extends React.Component<IInstallGitProps, {}> {
  public constructor(props: IInstallGitProps) {
    super(props)
  }

  private onSubmit = () => {
    this.props.onOpenShell(this.props.path)
    this.props.onDismissed()
  }

  private onExternalLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    const url = `https://help.github.com/articles/set-up-git/#setting-up-git`
    shell.openExternal(url)
  }

  public render() {
    return (
      <Dialog
        id="install-git"
        type="warning"
        title={
          __DARWIN__
            ? t('install.unable-to-locate-git-darwin.', 'Unable to Locate Git')
            : t('install.unable-to-locate-git', 'Unable to locate Git')
        }
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <p>
            {t(
              'install.we-are-unable-to-locate-git-1',
              `We were unable to locate Git on your system. This means you won't be
              able to execute any Git commands in the `
            )}
            {__DARWIN__ || __LINUX__
              ? t('install.terminal-window', 'Terminal window')
              : t('install.command-prompt', 'command prompt')}
            {t('install.we-are-unable-to-locate-git-2', '.')}
          </p>
          <p>
            {t(
              'install.to-help-you-get-git-installed',
              `To help you get Git installed and configured for your operating
              system, we have some external resources available.`
            )}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={
              __DARWIN__
                ? t('install.open-without-git-darwin', 'Open Without Git')
                : t('install.open-without-git', 'Open without Git')
            }
            cancelButtonText={t('install.install-git', 'Install Git')}
            onCancelButtonClick={this.onExternalLink}
          />
        </DialogFooter>
      </Dialog>
    )
  }
}
