import * as React from 'react'
import { DialogContent } from '../dialog'
import { RefNameTextBox } from '../lib/ref-name-text-box'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'
import { Account } from '../../models/account'
import { GitConfigUserForm } from '../lib/git-config-user-form'
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
          Default branch name for new repositories
        </h2>

        <RefNameTextBox
          initialValue={this.props.defaultBranch}
          onValueChange={this.props.onDefaultBranchChanged}
          ariaLabelledBy={'default-branch-heading'}
          ariaDescribedBy="default-branch-description"
          warningMessageVerb="saved"
        />

        <p id="default-branch-description" className="git-settings-description">
          GitHub's default branch name is <Ref>main</Ref>. You may want to
          change it due to different workflows, or because your integrations
          still require the historical default branch name of <Ref>master</Ref>.
        </p>
      </div>
    )
  }

  private renderEditYourGlobalGitConfig() {
    return (
      <div className="edit-global-git-config-component">
        <p className="git-settings-description">
          These preferences will{' '}
          <LinkButton onClick={this.props.onEditGlobalGitConfig}>
            edit your global Git config file
          </LinkButton>
          .
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
        <h2 id="git-settings-path-heading">Settings related to the path</h2>

        <div className="git-setting-path-section">
          <div role="group" aria-labelledby="git-settings-path-heading">
            {__WIN32__ ? (
              <Checkbox
                label="Enable paths longer than 260 characters on Windows"
                value={
                  this.props.coreLongpaths
                    ? CheckboxValue.On
                    : CheckboxValue.Off
                }
                onChange={this.onCoreLongpathsChanged}
              />
            ) : null}
            <Checkbox
              label={
                'Display escaped non-ASCII characters in path names ' +
                '(recommended to turn off for users in the Asian region)'
              }
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
