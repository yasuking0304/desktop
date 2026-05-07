import * as React from 'react'
import { DialogContent } from '../dialog'
import { RefNameTextBox } from '../lib/ref-name-text-box'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'
import { Account } from '../../models/account'
import { GitConfigUserForm } from '../lib/git-config-user-form'
import { t } from 'i18next'
import { TabBar } from '../tab-bar'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Select } from '../lib/select'
import {
  shellFriendlyNames,
  SupportedHooksEnvShell,
} from '../../lib/hooks/config'
import { Dispatcher } from '../dispatcher'
import { formatDate } from '../../lib/format-date'

interface IGitProps {
  readonly dispatcher: Dispatcher
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

  readonly selectedTabIndex?: number
  readonly onSelectedTabIndexChanged: (index: number) => void

  readonly onEnableGitHookEnvChanged: (enableGitHookEnv: boolean) => void
  readonly onCacheGitHookEnvChanged: (cacheGitHookEnv: boolean) => void
  readonly onSelectedShellChanged: (selectedShell: string) => void
  readonly onChatQuotasChanged: (chatQuotas: number) => void
  readonly onAutoSuggestQuotasChanged: (autoSuggestQuotas: number) => void
  readonly onCopilotResetDateChanged: (copilotResetDate: string) => void
  readonly onCopilotLicenseTypeChanged: (copilotLicenseType: string) => void

  readonly enableGitHookEnv: boolean
  readonly cacheGitHookEnv: boolean
  readonly selectedShell: string
  readonly chatQuotas: number
  readonly autoSuggestQuotas: number
  readonly copilotResetDate: string
  readonly copilotLicenseType: string
}

const windowsShells: ReadonlyArray<SupportedHooksEnvShell> = [
  'git-bash',
  'pwsh',
  'powershell',
  'cmd',
]

export class Git extends React.Component<IGitProps> {
  private get selectedTabIndex() {
    return this.props.selectedTabIndex ?? 0
  }

  private onTabClicked = (index: number) => {
    this.props.onSelectedTabIndexChanged?.(index)
    if (index === 3) {
      this.props.dispatcher.getCopilotInformation().then(result => {
        this.props.onChatQuotasChanged(result?.chatQuotas || -1)
        this.props.onAutoSuggestQuotasChanged(result?.autoSuggestQuotas || -1)
        this.props.onCopilotResetDateChanged(result?.copilotResetDate || '')
        this.props.onCopilotLicenseTypeChanged(result?.copilotLicenseType || '')
      })
    }
  }

  private onEnableGitHookEnvChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onEnableGitHookEnvChanged(event.currentTarget.checked)
  }

  private onCacheGitHookEnvChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onCacheGitHookEnvChanged(event.currentTarget.checked)
  }

  private onSelectedShellChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    this.props.onSelectedShellChanged(event.currentTarget.value)
  }

  private renderHooksSettings() {
    return (
      <>
        <Checkbox
          label={t(
            'git.load-git-hook-env-from-shell',
            'Load Git hook environment variables from shell'
          )}
          ariaDescribedBy="git-hooks-env-description"
          value={
            this.props.enableGitHookEnv ? CheckboxValue.On : CheckboxValue.Off
          }
          onChange={this.onEnableGitHookEnvChanged}
        />
        <p id="git-hooks-env-description" className="git-hooks-env-description">
          {t(
            'git.when-enabled-attempt-to-load-env-variables',
            `When enabled, GitHub Desktop will attempt to load environment
             variables from your shell when executing Git hooks. This is useful
             if your Git hooks depend on environment variables set in your
             shell configuration files, a common practive for version managers
             such as nvm, rbenv, asdf, etc.`
          )}
        </p>

        {this.props.enableGitHookEnv && __WIN32__ && (
          <>
            <Select
              className="git-hook-shell-select"
              label={t(
                'git.shell-to-use-when-loading-env',
                'Shell to use when loading environment'
              )}
              value={this.props.selectedShell}
              onChange={this.onSelectedShellChanged}
            >
              {windowsShells
                .map(s => ({ key: s, title: shellFriendlyNames[s] }))
                .map(s => (
                  <option key={s.key} value={s.key}>
                    {s.title}
                  </option>
                ))}
            </Select>
          </>
        )}

        {this.props.enableGitHookEnv && (
          <>
            <Checkbox
              label={t(
                'git.cache-git-hook-env-variables',
                'Cache Git hook environment variables'
              )}
              ariaDescribedBy="git-hooks-cache-description"
              onChange={this.onCacheGitHookEnvChanged}
              value={
                this.props.cacheGitHookEnv
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
            />

            <div
              id="git-hooks-cache-description"
              className="git-settings-description"
            >
              {t(
                'git.cache-hook-env-description',
                `Cache hook environment variables to improve performance. Disable
              if your hooks rely on frequently changing environment variables.`
              )}
            </div>
          </>
        )}
      </>
    )
  }

  public render() {
    return (
      <DialogContent className="git-preferences">
        <TabBar
          selectedIndex={this.selectedTabIndex}
          onTabClicked={this.onTabClicked}
        >
          <span>{t('git.author', 'Author')}</span>
          <span>{t('git.default-branch', 'Default branch')}</span>
          <span>{t('git.hooks', 'Hooks')}</span>
          <span>{t('git.other-settings', 'Other Settings')}</span>
        </TabBar>
        <div className="git-preferences-content">{this.renderCurrentTab()}</div>
      </DialogContent>
    )
  }

  private renderCurrentTab() {
    if (this.selectedTabIndex === 0) {
      return this.renderGitConfigAuthorInfo()
    } else if (this.selectedTabIndex === 1) {
      return this.renderDefaultBranchSetting()
    } else if (this.selectedTabIndex === 2) {
      return this.renderHooksSettings()
    } else if (this.selectedTabIndex === 3) {
      return this.renderOtherSetting()
    }

    return null
  }

  private renderGitConfigAuthorInfo() {
    return (
      <>
        <GitConfigUserForm
          email={this.props.email}
          name={this.props.name}
          isLoadingGitConfig={this.props.isLoadingGitConfig}
          accounts={this.props.accounts}
          onEmailChanged={this.props.onEmailChanged}
          onNameChanged={this.props.onNameChanged}
        />
        {this.renderEditGlobalGitConfigInfo()}
      </>
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
        {this.renderEditGlobalGitConfigInfo()}
      </div>
    )
  }

  private renderEditGlobalGitConfigInfo() {
    return (
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

  private renderOtherSetting() {
    return (
      <div className="other">
        {this.renderCorePathsSetting()}
        {this.renderCopilotInfo()}
      </div>
    )
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
                  this.props.coreLongpaths
                    ? CheckboxValue.On
                    : CheckboxValue.Off
                }
                onChange={this.onCoreLongpathsChanged}
              />
            ) : null}
            <Checkbox
              label={t(
                'git.display-escaped-non-ascii-characters',
                'Display escaped non-ASCII characters in path names\n(recommended to turn off for users in the Asian region)'
              )}
              value={
                this.props.coreQuotepath ? CheckboxValue.On : CheckboxValue.Off
              }
              onChange={this.onCoreQuotepathChanged}
            />
          </div>
        </div>
        {this.renderEditGlobalGitConfigInfo()}
      </div>
    )
  }

  private renderCopilotInfo() {
    if (this.props.chatQuotas < 0 || this.props.autoSuggestQuotas < 0) {
      return null
    }
    const chatQuotas = `${Math.round(this.props.chatQuotas * 100)}%`
    const autoSuggestQuotas = `${Math.round(
      this.props.autoSuggestQuotas * 100
    )}%`
    return (
      <div className="git-copilot-info-component">
        <div className="git-copilot-info-description">
          <h2 id="git-show-copilot-heading">
            {t('git.show-copilot-information', 'Show Copilot Information', {
              0: this.props.copilotLicenseType,
            })}
          </h2>
          <span className="git-copilot-license-type">
            {this.props.copilotLicenseType}
          </span>
        </div>
        <div className="git-show-copilot-section">
          <div
            role="group"
            className="git-show-copilot-component"
            aria-labelledby="git-show-copilot-heading"
          >
            <div className="git-copilot-info">
              <div className="git-copilot-info-usage">
                <span>
                  {t('git.copilot-code-completions', 'Code completions')}
                </span>
                <span>{autoSuggestQuotas}</span>
              </div>
              <span className="guage">
                <span
                  className="guage-progress"
                  style={{ width: `${autoSuggestQuotas}` }}
                ></span>
              </span>
            </div>
            <div className="git-copilot-info">
              <div className="git-copilot-info-usage">
                <span>{t('git.copilot-chat-messages', 'Chat messages')}</span>
                <span>{chatQuotas}</span>
              </div>
              <span className="guage">
                <span
                  className="guage-progress"
                  style={{ width: `${chatQuotas}` }}
                ></span>
              </span>
            </div>
          </div>
        </div>
        <div className="git-copilot-generates-comments-info">
          {t(
            'git.generates-comments-using-copilot',
            `GitHub Desktop generates comments using Copilot's chat messages.
             Copilot quota will be reset on {{0}}.`,
            {
              0: formatDate(new Date(this.props.copilotResetDate), {
                time: false,
                dateStyle: 'long',
              }),
            }
          )}
        </div>
      </div>
    )
  }
}
