import * as React from 'react'

import { encodePathAsUrl } from '../../lib/path'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { PopupType } from '../../models/popup'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { SuggestedAction } from '../suggested-actions'
import { SuggestedActionGroup } from '../suggested-actions'
import { t } from 'i18next'

const ClappingHandsImage = encodePathAsUrl(
  __dirname,
  'static/admin-mentoring.svg'
)

const TelescopeOcticon = <Octicon symbol={OcticonSymbol.telescope} />
const PlusOcticon = <Octicon symbol={OcticonSymbol.plus} />
const FileDirectoryOcticon = <Octicon symbol={OcticonSymbol.fileDirectory} />

interface ITutorialDoneProps {
  readonly dispatcher: Dispatcher

  /**
   * The currently selected repository
   */
  readonly repository: Repository
}
export class TutorialDone extends React.Component<ITutorialDoneProps, {}> {
  public render() {
    return (
      <div id="tutorial-done">
        <div className="content">
          <div className="header">
            <div className="text">
              <h1>{t('done.you-re-done', `You're done!`)}</h1>
              <p>
                {t(
                  'done.you-ve-learned-the-basics',
                  `You’ve learned the basics on how to use GitHub Desktop. Here
                 are some suggestions for what to do next.`
                )}
              </p>
            </div>
            <img
              src={ClappingHandsImage}
              className="image"
              alt="Hands clapping"
            />
          </div>
          <SuggestedActionGroup>
            <SuggestedAction
              title={t(
                'done.explore-projects-on-github',
                'Explore projects on GitHub'
              )}
              description={t(
                'done.contribute-to-a-project',
                'Contribute to a project that interests you'
              )}
              buttonText={
                __DARWIN__
                  ? t('done.open-in-browser-darwin', 'Open in Browser')
                  : t('done.open-in-browser', 'Open in browser')
              }
              onClick={this.openDotcomExplore}
              type="normal"
              image={TelescopeOcticon}
            />
            <SuggestedAction
              title={t(
                'done.create-a-new-repository',
                'Create a new repository'
              )}
              description={t(
                'done.get-started-on a-brand-new-project',
                'Get started on a brand new project'
              )}
              buttonText={
                __DARWIN__
                  ? t('done.create-repository-darwin', 'Create Repository')
                  : t('done.create-repository', 'Create repository')
              }
              onClick={this.onCreateNewRepository}
              type="normal"
              image={PlusOcticon}
            />
            <SuggestedAction
              title={t('done.add-a-local-repository', 'Add a local repository')}
              description={t(
                'done.work-on-an-existing-project',
                'Work on an existing project in GitHub Desktop'
              )}
              buttonText={
                __DARWIN__
                  ? t('done.add-repository-darwin', 'Add Repository')
                  : t('done.add-repository', 'Add repository')
              }
              onClick={this.onAddExistingRepository}
              type="normal"
              image={FileDirectoryOcticon}
            />
          </SuggestedActionGroup>
        </div>
      </div>
    )
  }

  private openDotcomExplore = () => {
    this.props.dispatcher.showGitHubExplore(this.props.repository)
  }

  private onCreateNewRepository = () => {
    this.props.dispatcher.showPopup({
      type: PopupType.CreateRepository,
    })
  }

  private onAddExistingRepository = () => {
    this.props.dispatcher.showPopup({
      type: PopupType.AddRepository,
    })
  }
}
