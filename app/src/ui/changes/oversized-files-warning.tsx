import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { PathText } from '../lib/path-text'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { ICommitContext } from '../../models/commit'
import { DefaultCommitMessage } from '../../models/commit-message'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'

const GitLFSWebsiteURL =
  'https://help.github.com/articles/versioning-large-files/'

interface IOversizedFilesProps {
  readonly oversizedFiles: ReadonlyArray<string>
  readonly onDismissed: () => void
  readonly dispatcher: Dispatcher
  readonly context: ICommitContext
  readonly repository: Repository
}

/** A dialog to display a list of files that are too large to commit. */
export class OversizedFiles extends React.Component<IOversizedFilesProps> {
  public constructor(props: IOversizedFilesProps) {
    super(props)
  }

  public render() {
    return (
      <Dialog
        id="oversized-files"
        title={
          __DARWIN__
            ? t(
                'oversized-files-warning.file-too-large-darwin',
                'Files Too Large'
              )
            : t('oversized-files-warning.file-too-large', 'Files too large')
        }
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        type="warning"
      >
        <DialogContent>
          <p>
            {t(
              'oversized-files-warning.the-following-files',
              'The following files are over 100MB. '
            )}
            <strong>
              {t(
                'oversized-files-warning.if-you-commit-these-files',
                `If you commit these files, you will no longer be able to push
                 this repository to GitHub.com.`
              )}
            </strong>
          </p>
          {this.renderFileList()}
          <p className="recommendation">
            {t(
              'oversized-files-warning.we-recommend-you-avoid-committing-1',
              'We recommend you avoid committing these files or use '
            )}
            <LinkButton uri={GitLFSWebsiteURL}>
              {t('oversized-files-warning.git-lfs', 'Git LFS')}
            </LinkButton>
            {t(
              'oversized-files-warning.we-recommend-you-avoid-committing-2',
              ' to store large files on GitHub.'
            )}
          </p>
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={
              __DARWIN__
                ? t(
                    'oversized-files-warning.commit-anyway-darwin',
                    'Commit Anyway'
                  )
                : t('oversized-files-warning.commit-anyway', 'Commit anyway')
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderFileList() {
    return (
      <div className="files-list">
        <ul>
          {this.props.oversizedFiles.map(fileName => (
            <li key={fileName}>
              <PathText path={fileName} />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  private onSubmit = async () => {
    this.props.onDismissed()

    await this.props.dispatcher.commitIncludedChanges(
      this.props.repository,
      this.props.context
    )

    this.props.dispatcher.setCommitMessage(
      this.props.repository,
      DefaultCommitMessage
    )
  }
}
