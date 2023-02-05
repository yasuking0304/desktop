import * as React from 'react'
import { encodePathAsUrl } from '../../lib/path'
import { Button } from '../lib/button'
import { t } from 'i18next'

const BlankSlateImage = encodePathAsUrl(
  __dirname,
  'static/empty-no-branches.svg'
)

interface INoBranchesProps {
  /** The callback to invoke when the user wishes to create a new branch */
  readonly onCreateNewBranch: () => void
  /** True to display the UI elements for creating a new branch, false to hide them */
  readonly canCreateNewBranch: boolean
}

export class NoBranches extends React.Component<INoBranchesProps> {
  public render() {
    if (this.props.canCreateNewBranch) {
      return (
        <div className="no-branches">
          <img src={BlankSlateImage} className="blankslate-image" alt="" />

          <div className="title">
            {t(
              'no-branches.i-can-not-find-that-branch',
              `Sorry, I can't find that branch`
            )}
          </div>

          <div className="subtitle">
            {t(
              'no-branches.create-a-new-branch-instead',
              'Do you want to create a new branch instead?'
            )}
          </div>

          <Button
            className="create-branch-button"
            onClick={this.props.onCreateNewBranch}
            type="submit"
          >
            {__DARWIN__
              ? t('no-branches.create-new-branch-darwin', 'Create New Branch')
              : t('no-branches.create-new-branch', 'Create new branch')}
          </Button>

          <div className="protip">
            {t('no-branches.protip-1', `ProTip! Press `)}
            {this.renderShortcut()}
            {t(
              'no-branches.protip-2',
              ` to quickly create a new branch
              from anywhere within the app`
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="no-branches">
        {this.props.noBranchesMessage ?? "Sorry, I can't find that branch"}
      </div>
    )
  }

  private renderShortcut() {
    if (__DARWIN__) {
      return (
        <span>
          <kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>N</kbd>
        </span>
      )
    } else {
      return (
        <span>
          <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd>
        </span>
      )
    }
  }
}
