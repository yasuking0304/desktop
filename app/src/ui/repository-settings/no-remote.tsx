import * as React from 'react'
import { DialogContent } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { CallToAction } from '../lib/call-to-action'
import { t } from 'i18next'

const HelpURL = 'https://help.github.com/articles/about-remote-repositories/'

interface INoRemoteProps {
  /** The function to call when the users chooses to publish. */
  readonly onPublish: () => void
}

/** The component for when a repository has no remote. */
export class NoRemote extends React.Component<INoRemoteProps, {}> {
  public render() {
    return (
      <DialogContent>
        <CallToAction
          actionTitle={t('no-remote.publish', 'Publish')}
          onAction={this.props.onPublish}
        >
          <div className="no-remote-publish-message">
            {t(
              'no-remote.publish-your-repository-to-github',
              'Publish your repository to GitHub. Need help? '
            )}
            <LinkButton uri={HelpURL}>
              {t(
                'no-remote.learn-more-about',
                'Learn more about remote repositories.'
              )}
            </LinkButton>
          </div>
        </CallToAction>
      </DialogContent>
    )
  }
}
