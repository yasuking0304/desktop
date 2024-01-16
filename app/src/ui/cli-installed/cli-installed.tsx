import * as React from 'react'
import { Dialog, DialogContent, DefaultDialogFooter } from '../dialog'
import { InstalledCLIPath } from '../lib/install-cli'
import { t } from 'i18next'

interface ICLIInstalledProps {
  /** Called when the popup should be dismissed. */
  readonly onDismissed: () => void
}

/** Tell the user the CLI tool was successfully installed. */
export class CLIInstalled extends React.Component<ICLIInstalledProps, {}> {
  public render() {
    return (
      <Dialog
        title={
          __DARWIN__
            ? t(
                'cli-installed.command-line-tool-installed-darwin',
                'Command Line Tool Installed'
              )
            : t(
                'cli-installed.command-line-tool-installed',
                'Command line tool installed'
              )
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.props.onDismissed}
      >
        <DialogContent>
          <div>
            {t(
              'cli-installed.the-command-line-tool-has-been-installed-1',
              'The command line tool has been installed at '
            )}
            <strong>{InstalledCLIPath}</strong>
            {t('cli-installed.the-command-line-tool-has-been-installed-2', '.')}
          </div>
        </DialogContent>
        <DefaultDialogFooter buttonText={t('common.ok', 'Ok')} />
      </Dialog>
    )
  }
}
