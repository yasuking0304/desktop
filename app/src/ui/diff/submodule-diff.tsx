import React from 'react'
import { parseRepositoryIdentifier } from '../../lib/remote-parsing'
import { ISubmoduleDiff } from '../../models/diff'
import { LinkButton } from '../lib/link-button'
import { TooltippedCommitSHA } from '../lib/tooltipped-commit-sha'
import { Octicon } from '../octicons'
import * as OcticonSymbol from '../octicons/octicons.generated'
import { SuggestedAction } from '../suggested-actions'
import { t } from 'i18next'

type SubmoduleItemIcon =
  | {
      readonly octicon: typeof OcticonSymbol.info
      readonly className: 'info-icon'
    }
  | {
      readonly octicon: typeof OcticonSymbol.diffModified
      readonly className: 'modified-icon'
    }
  | {
      readonly octicon: typeof OcticonSymbol.diffAdded
      readonly className: 'added-icon'
    }
  | {
      readonly octicon: typeof OcticonSymbol.diffRemoved
      readonly className: 'removed-icon'
    }
  | {
      readonly octicon: typeof OcticonSymbol.fileDiff
      readonly className: 'untracked-icon'
    }

interface ISubmoduleDiffProps {
  readonly onOpenSubmodule?: (fullPath: string) => void
  readonly diff: ISubmoduleDiff

  /**
   * Whether the diff is readonly, e.g., displaying a historical diff, or the
   * diff's content can be committed, e.g., displaying a change in the working
   * directory.
   */
  readonly readOnly: boolean
}

export class SubmoduleDiff extends React.Component<ISubmoduleDiffProps> {
  public constructor(props: ISubmoduleDiffProps) {
    super(props)
  }

  public render() {
    return (
      <div className="changes-interstitial submodule-diff">
        <div className="content">
          <div className="interstitial-header">
            <div className="text">
              <h1>
                {t('submodule-diff.submodule-changes', 'Submodule changes')}
              </h1>
            </div>
          </div>
          {this.renderSubmoduleInfo()}
          {this.renderCommitChangeInfo()}
          {this.renderSubmodulesChangesInfo()}
          {this.renderOpenSubmoduleAction()}
        </div>
      </div>
    )
  }

  private renderSubmoduleInfo() {
    if (this.props.diff.url === null) {
      return null
    }

    const repoIdentifier = parseRepositoryIdentifier(this.props.diff.url)
    if (repoIdentifier === null) {
      return null
    }

    const hostname =
      repoIdentifier.hostname === 'github.com'
        ? ''
        : ` (${repoIdentifier.hostname})`

    return this.renderSubmoduleDiffItem(
      { octicon: OcticonSymbol.info, className: 'info-icon' },
      <>
        {t(
          'submodule-diff.this-is-a-submodule-based-on-the-repository-1',
          'This is a submodule based on the repository '
        )}
        <LinkButton
          uri={`https://${repoIdentifier.hostname}/${repoIdentifier.owner}/${repoIdentifier.name}`}
        >
          {repoIdentifier.owner}/{repoIdentifier.name}
          {hostname}
        </LinkButton>
        {t('submodule-diff.this-is-a-submodule-based-on-the-repository-2', '.')}
      </>
    )
  }

  private renderCommitChangeInfo() {
    const { diff, readOnly } = this.props
    const { oldSHA, newSHA } = diff

    const verb = readOnly ? 'was' : 'has been'
    const suffix = readOnly
      ? ''
      : ' This change can be committed to the parent repository.'

    if (oldSHA !== null && newSHA !== null) {
      return this.renderSubmoduleDiffItem(
        { octicon: OcticonSymbol.diffModified, className: 'modified-icon' },
        <>
          This submodule changed its commit from{' '}
          {this.renderTooltippedCommitSHA(oldSHA)} to{' '}
          {this.renderTooltippedCommitSHA(newSHA)}.{suffix}
        </>
      )
    } else if (oldSHA === null && newSHA !== null) {
      return this.renderSubmoduleDiffItem(
        { octicon: OcticonSymbol.diffAdded, className: 'added-icon' },
        <>
          This submodule {verb} added pointing at commit{' '}
          {this.renderTooltippedCommitSHA(newSHA)}.{suffix}
        </>
      )
    } else if (oldSHA !== null && newSHA === null) {
      return this.renderSubmoduleDiffItem(
        { octicon: OcticonSymbol.diffRemoved, className: 'removed-icon' },
        <>
          This submodule {verb} removed while it was pointing at commit{' '}
          {this.renderTooltippedCommitSHA(oldSHA)}.{suffix}
        </>
      )
    }

    return null
  }

  private renderTooltippedCommitSHA(sha: string) {
    return <TooltippedCommitSHA commit={sha} asRef={true} />
  }

  private renderSubmodulesChangesInfo() {
    const { diff } = this.props

    if (!diff.status.untrackedChanges && !diff.status.modifiedChanges) {
      return null
    }

    const changes =
      diff.status.untrackedChanges && diff.status.modifiedChanges
        ? t('submodule-diff.modified-and-untracked', 'modified and untracked')
        : diff.status.untrackedChanges
        ? t('submodule-diff.untracked', 'untracked')
        : t('submodule-diff.modified', 'modified')

    return this.renderSubmoduleDiffItem(
      { octicon: OcticonSymbol.fileDiff, className: 'untracked-icon' },
      <>
        {t(
          'submodule-diff.this-submodule-has-changes',
          `This submodule has {{0}} changes. Those changes must be committed
          inside of the submodule before they can be part of the parent
          repository.`,
          { 0: changes }
        )}
      </>
    )
  }

  private renderSubmoduleDiffItem(
    icon: SubmoduleItemIcon,
    content: React.ReactElement
  ) {
    return (
      <div className="item">
        <Octicon symbol={icon.octicon} className={icon.className} />
        <div className="content">{content}</div>
      </div>
    )
  }

  private renderOpenSubmoduleAction() {
    // If no url is found for the submodule, it means it can't be opened
    // This happens if the user is looking at an old commit which references
    // a submodule that got later deleted.
    if (this.props.diff.url === null) {
      return null
    }

    return (
      <span>
        <SuggestedAction
          title={t(
            'submodule-diff.open-this-submodule-on-gitHub-desktop',
            'Open this submodule on GitHub Desktop'
          )}
          description={t(
            'submodule-diff.you-can-open-this-submodule-on-gitHub-desktop',
            'You can open this submodule on GitHub Desktop as a normal repository to manage and commit any changes in it.'
          )}
          buttonText={
            __DARWIN__
              ? t('submodule-diff.open-repository-darwin', 'Open Repository')
              : t('submodule-diff.open-repository', 'Open repository')
          }
          type="primary"
          onClick={this.onOpenSubmoduleClick}
        />
      </span>
    )
  }

  private onOpenSubmoduleClick = () => {
    this.props.onOpenSubmodule?.(this.props.diff.fullPath)
  }
}
