import * as React from 'react'
import { IRemote } from '../../models/remote'
import { TextBox } from '../lib/text-box'
import { DialogContent } from '../dialog'
import { t } from 'i18next'

interface IRemoteProps {
  /** The remote being shown. */
  readonly remote: IRemote

  /** The function to call when the remote URL is changed by the user. */
  readonly onRemoteUrlChanged: (url: string) => void
}

/** The Remote component. */
export class Remote extends React.Component<IRemoteProps, {}> {
  public render() {
    const remote = this.props.remote
    return (
      <DialogContent>
        <p>
          {t(
            'remote.primary-remote-repository',
            'Primary remote repository ({{0}})',
            { 0: remote.name }
          )}
        </p>
        <TextBox
          placeholder={t('remote.placeholder-remote-url', 'Remote URL')}
          value={remote.url}
          onValueChanged={this.props.onRemoteUrlChanged}
        />
      </DialogContent>
    )
  }
}
