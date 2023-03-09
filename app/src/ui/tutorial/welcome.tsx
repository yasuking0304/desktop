import * as React from 'react'
import { t } from 'i18next'

import { encodePathAsUrl } from '../../lib/path'

const CodeImage = encodePathAsUrl(__dirname, 'static/code.svg')
const TeamDiscussionImage = encodePathAsUrl(
  __dirname,
  'static/github-for-teams.svg'
)
const CloudServerImage = encodePathAsUrl(
  __dirname,
  'static/github-for-business.svg'
)

export class TutorialWelcome extends React.Component {
  public render() {
    return (
      <div id="tutorial-welcome">
        <div className="header">
          <h1>{t('welcome.welcome', 'Welcome to GitHub Desktop')}</h1>
          <p>
            {t(
              'welcome.use-this-tutorial',
              `Use this tutorial to get comfortable with Git, GitHub, and GitHub
            Desktop.`
            )}
          </p>
        </div>
        <ul className="definitions">
          <li>
            <img src={CodeImage} alt="Html syntax icon" />
            <p>
              <strong>Git</strong>
              {t('welcome.definitions-git', ` is the version control system.`)}
            </p>
          </li>
          <li>
            <img
              src={TeamDiscussionImage}
              alt="People with discussion bubbles overhead"
            />
            <p>
              <strong>GitHub</strong>
              {t(
                'welcome.definitions-github',
                ` is where you store your code and collaborate with others.`
              )}
            </p>
          </li>
          <li>
            <img src={CloudServerImage} alt="Server stack with cloud" />
            <p>
              <strong>GitHub Desktop</strong>
              {t(
                'welcome.definitions-github-desktop',
                ` helps you work with GitHub locally.`
              )}
            </p>
          </li>
        </ul>
      </div>
    )
  }
}
