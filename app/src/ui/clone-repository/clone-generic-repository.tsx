import * as React from 'react'
import { TextBox } from '../lib/text-box'
import { Button } from '../lib/button'
import { Row } from '../lib/row'
import { DialogContent } from '../dialog'
import { Ref } from '../lib/ref'
import { t } from 'i18next'

interface ICloneGenericRepositoryProps {
  /** The URL to clone. */
  readonly url: string

  /** The path to which the repository should be cloned. */
  readonly path: string

  /** Called when the destination path changes. */
  readonly onPathChanged: (path: string) => void

  /** Called when the URL to clone changes. */
  readonly onUrlChanged: (url: string) => void

  /**
   * Called when the user should be prompted to choose a directory to clone to.
   */
  readonly onChooseDirectory: () => Promise<string | undefined>
}

/** The component for cloning a repository. */
export class CloneGenericRepository extends React.Component<
  ICloneGenericRepositoryProps,
  {}
> {
  public render() {
    return (
      <DialogContent className="clone-generic-repository-content">
        <Row>
          <TextBox
            placeholder={t(
              'clone-generic-repository.placeholder-url-or-user-repository',
              'URL or username/repository'
            )}
            value={this.props.url}
            onValueChanged={this.onUrlChanged}
            autoFocus={true}
            label={
              <div className="clone-url-textbox-label">
                <p>
                  {t(
                    'clone-generic-repository.url-or-user-repository',
                    'Repository URL or GitHub username and repository'
                  )}
                </p>
                <p>
                  (
                  <Ref>
                    {t(
                      'clone-generic-repository.hubot-cool-repo',
                      'hubot/cool-repo'
                    )}
                  </Ref>
                </p>
                )
              </div>
            }
          />
        </Row>

        <Row>
          <TextBox
            value={this.props.path}
            label={
              __DARWIN__
                ? t('common.local-path-darwin', 'Local Path')
                : t('common.local-path', 'Local path')
            }
            placeholder="repository path"
            onValueChanged={this.props.onPathChanged}
          />
          <Button onClick={this.props.onChooseDirectory}>
            {t('common.choose', 'Choose…')}
          </Button>
        </Row>
      </DialogContent>
    )
  }

  private onUrlChanged = (url: string) => {
    this.props.onUrlChanged(url)
  }
}
