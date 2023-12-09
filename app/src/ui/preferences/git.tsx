import * as React from 'react'
import { DialogContent } from '../dialog'
import { SuggestedBranchNames } from '../../lib/helpers/default-branch'
import { RefNameTextBox } from '../lib/ref-name-text-box'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'
import { Account } from '../../models/account'
import { GitConfigUserForm } from '../lib/git-config-user-form'
import { t } from 'i18next'
import { RadioGroup } from '../lib/radio-group'

const otherOption = t('git.radio-button-other', 'Other…')

interface IGitProps {
  readonly name: string
  readonly email: string
  readonly defaultBranch: string
  readonly isLoadingGitConfig: boolean
  readonly globalGitConfigPath: string | null

  readonly dotComAccount: Account | null
  readonly enterpriseAccount: Account | null

  readonly onNameChanged: (name: string) => void
  readonly onEmailChanged: (email: string) => void
  readonly onDefaultBranchChanged: (defaultBranch: string) => void

  readonly selectedExternalEditor: string | null
  readonly onOpenFileInExternalEditor: (path: string) => void
}

interface IGitState {
  /**
   * True if the default branch setting is not one of the suggestions.
   * It's used to display the "Other" text box that allows the user to
   * enter a custom branch name.
   */
  readonly defaultBranchIsOther: boolean
}

// This will be the prepopulated branch name on the "other" input
// field when the user selects it.
const OtherNameForDefaultBranch = ''

export class Git extends React.Component<IGitProps, IGitState> {
  private defaultBranchInputRef = React.createRef<RefNameTextBox>()

  public constructor(props: IGitProps) {
    super(props)

    this.state = {
      defaultBranchIsOther: this.isDefaultBranchOther(),
    }
  }

  private isDefaultBranchOther = () => {
    return (
      !this.props.isLoadingGitConfig &&
      !SuggestedBranchNames.includes(this.props.defaultBranch)
    )
  }

  public componentDidUpdate(prevProps: IGitProps) {
    if (this.props.defaultBranch === prevProps.defaultBranch) {
      return
    }

    this.setState({
      defaultBranchIsOther: this.isDefaultBranchOther(),
    })

    // Focus the text input that allows the user to enter a custom
    // branch name when the user has selected "Other...".
    if (
      this.props.defaultBranch === OtherNameForDefaultBranch &&
      this.defaultBranchInputRef.current !== null
    ) {
      this.defaultBranchInputRef.current.focus()
    }
  }

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

  private renderWarningMessage = (
    sanitizedBranchName: string,
    proposedBranchName: string
  ) => {
    if (sanitizedBranchName === '') {
      return (
        <>
          {t('git.invalid-branch-name-1', ' ')}
          <Ref>{proposedBranchName}</Ref>
          {t('git.invalid-branch-name-2', ' is an invalid branch name.')}
        </>
      )
    }

    return (
      <>
        {t('git.save-sanitized-branch-name-1', 'Will be saved as ')}
        <Ref>{sanitizedBranchName}</Ref>.
        {t('git.save-sanitized-branch-name-2', ' ')}
      </>
    )
  }

  private renderBranchNameOption = (branchName: string) => {
    return branchName === otherOption ? (
      <span id="other-branch-name-label">{branchName}</span>
    ) : (
      branchName
    )
  }

  private renderDefaultBranchSetting() {
    const { defaultBranchIsOther } = this.state

    const branchNameOptions = [...SuggestedBranchNames, otherOption]
    const selectedKey = defaultBranchIsOther
      ? otherOption
      : SuggestedBranchNames.find(n => n === this.props.defaultBranch) ??
        SuggestedBranchNames.at(0) ??
        otherOption // Should never happen, but TypeScript doesn't know that.

    return (
      <div className="default-branch-component">
        <h2 id="default-branch-heading">
          {t(
            'git.default-branch-name-for-new-repositories',
            'Default branch name for new repositories'
          )}
        </h2>
        <RadioGroup<string>
          ariaLabelledBy="default-branch-heading"
          selectedKey={selectedKey}
          radioButtonKeys={branchNameOptions}
          onSelectionChanged={this.onDefaultBranchChanged}
          renderRadioButtonLabelContents={this.renderBranchNameOption}
        />

        {defaultBranchIsOther && (
          <RefNameTextBox
            initialValue={this.props.defaultBranch}
            renderWarningMessage={this.renderWarningMessage}
            onValueChange={this.props.onDefaultBranchChanged}
            ref={this.defaultBranchInputRef}
            ariaLabelledBy={'other-branch-name-label'}
          />
        )}

        <p className="git-settings-description">
          {t('git.edit-your-global-git-config-1', 'These preferences will ')}
          {this.props.selectedExternalEditor &&
          this.props.globalGitConfigPath ? (
            <LinkButton onClick={this.openGlobalGitConfigInEditor}>
              {t(
                'git.edit-your-global-git-config-2',
                'edit your global Git config'
              )}
            </LinkButton>
          ) : (
            <>
              {t(
                'git.edit-your-global-git-config-2',
                'edit your global Git config'
              )}
            </>
          )}
          {t('git.edit-your-global-git-config-3', '.')}
        </p>
      </div>
    )
  }

  /**
   * Handler to make sure that we show/hide the text box to enter a custom
   * branch name when the user clicks on one of the radio buttons.
   *
   * We don't want to call this handler on changes to the text box since that
   * will cause the text box to be hidden if the user types a branch name
   * that starts with one of the suggested branch names (e.g `mainXYZ`).
   *
   * @param defaultBranch string the selected default branch
   */
  private onDefaultBranchChanged = (defaultBranch: string) => {
    this.setState({
      defaultBranchIsOther: !SuggestedBranchNames.includes(defaultBranch),
    })

    this.props.onDefaultBranchChanged(
      defaultBranch === otherOption ? '' : defaultBranch
    )
  }

  // This function is called to open the global git config file in the
  // user's default editor.
  private openGlobalGitConfigInEditor = () => {
    if (this.props.globalGitConfigPath) {
      this.props.onOpenFileInExternalEditor(this.props.globalGitConfigPath)
    }
  }
}
