import * as React from 'react'
import { DialogContent } from '../dialog'
import { RefNameTextBox } from '../lib/ref-name-text-box'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'
import { Account } from '../../models/account'
import { GitConfigUserForm } from '../lib/git-config-user-form'
import { t } from 'i18next'
import { Checkbox, CheckboxValue } from '../lib/checkbox'

interface IGitProps {
  readonly name: string
  readonly email: string
  readonly defaultBranch: string
  readonly coreLongpaths: boolean
  readonly coreQuotepath: boolean
  readonly isLoadingGitConfig: boolean

  readonly accounts: ReadonlyArray<Account>

  readonly onNameChanged: (name: string) => void
  readonly onEmailChanged: (email: string) => void
  readonly onDefaultBranchChanged: (defaultBranch: string) => void
  readonly onCoreLongpathsChanged: (coreLongpaths: boolean) => void
  readonly onCoreQuotepathChanged: (coreQuotepath: boolean) => void

  readonly onEditGlobalGitConfig: () => void
}

export class Git extends React.Component<IGitProps> {
  public render() {
    return (
      <DialogContent>
        {this.renderGitConfigAuthorInfo()}
        {this.renderDefaultBranchSetting()}
        {this.renderCorePathsSetting()}
        {this.renderEditYourGlobalGitConfig()}
      </DialogContent>
    )
  }

  private renderGitConfigAuthorInfo() {
    return (
      <GitConfigUserForm
        email={this.props.email}
        name={this.props.name}
        isLoadingGitConfig={this.props.isLoadingGitConfig}
        accounts={this.props.accounts}
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
      </div>
    )
  }

  private renderEditYourGlobalGitConfig() {
    return (
      <div className="edit-global-git-config-component">
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

  private onCoreLongpathsChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onCoreLongpathsChanged(event.currentTarget.checked)
  }

  private onCoreQuotepathChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onCoreQuotepathChanged(event.currentTarget.checked)
  }

  private renderCorePathsSetting() {
    return (
      <div className="git-settings-path-component">
        <h2 id="git-settings-path-heading">
          {t(
            'git.settings-related-to-the-path',
            'Settings related to the path'
          )}
        </h2>

        <div className="git-setting-path-section">
          <div role="group" aria-labelledby="git-settings-path-heading">
            {__WIN32__ ? (
              <Checkbox
                label={t(
                  'git.enable-paths-lt-260-characters',
                  'Enable paths longer than 260 characters on Windows'
                )}
                value={
                  this.props.coreLongpaths ? CheckboxValue.On : CheckboxValue.Off
                }
                onChange={this.onCoreLongpathsChanged}
              />
            ) : null}
            <Checkbox
              label={t(
                'git.display-escaped-non-ascii-characters',
                'Display escaped non-ASCII characters in path names\n(recommended to turn off for users in the Asian double-byte character region)'
              )}
              value={
                this.props.coreQuotepath ? CheckboxValue.On : CheckboxValue.Off
              }
              onChange={this.onCoreQuotepathChanged}
            />
          </div>
        </div>
      </div>
    )
  }
}
