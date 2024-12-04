import * as React from 'react'
import { DialogContent } from '../dialog'
import { RefNameTextBox } from '../lib/ref-name-text-box'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'
import { Account } from '../../models/account'
import { GitConfigUserForm } from '../lib/git-config-user-form'
import { t } from 'i18next'

interface IGitProps {
  readonly name: string
  readonly email: string
  readonly defaultBranch: string
  readonly isLoadingGitConfig: boolean

  readonly dotComAccount: Account | null
  readonly enterpriseAccount: Account | null

  readonly onNameChanged: (name: string) => void
  readonly onEmailChanged: (email: string) => void
  readonly onDefaultBranchChanged: (defaultBranch: string) => void

  readonly onEditGlobalGitConfig: () => void
}

export class Git extends React.Component<IGitProps> {
  public render() {
    return (
      <DialogContent>
        {this.renderGitConfigAuthorInfo()}
        {this.renderDefaultBranchSetting()}
      </DialogContent>
    )
  }

  private renderGitConfigAuthorInfo() {
    return (
      <GitConfigUserForm
        email={this.props.email}
        name={this.props.name}
        isLoadingGitConfig={this.props.isLoadingGitConfig}
        enterpriseAccount={this.props.enterpriseAccount}
        dotComAccount={this.props.dotComAccount}
        onEmailChanged={this.props.onEmailChanged}
        onNameChanged={this.props.onNameChanged}
      />
    )
  }

  private renderDefaultBranchSetting() {
    return (
      <div className="default-branch-component">
        <h2 id="default-branch-heading">
          {t(
            'git.default-branch-name-for-new-repositories',
            'Default branch name for new repositories'
          )}
        </h2>

        <RefNameTextBox
          initialValue={this.props.defaultBranch}
          onValueChange={this.props.onDefaultBranchChanged}
          ariaLabelledBy={'default-branch-heading'}
          ariaDescribedBy="default-branch-description"
          warningMessageVerb="saved"
        />

        <p id="default-branch-description" className="git-settings-description">
          {t(
            'git.gitHub-default-branch-description-1',
            "GitHub's default branch name is "
          )}
          <Ref>main</Ref>
          {t('git.gitHub-default-branch-description-2', '. ')}
          {t(
            'git.gitHub-default-branch-description-3',
            `You may want to
          change it due to different workflows, or because your integrations
          still require the historical default branch name of `
          )}
          <Ref>master</Ref>
          {t('git.gitHub-default-branch-description-4', '.')}
        </p>

        <p className="git-settings-description">
          {t('git.edit-your-global-git-config-1', 'These preferences will ')}
          <LinkButton onClick={this.props.onEditGlobalGitConfig}>
            {t(
              'git.edit-your-global-git-config-2',
              ' edit your global Git config file'
            )}
          </LinkButton>
          {t('git.edit-your-global-git-config-3', '.')}
        </p>
      </div>
    )
  }
}
