import * as React from 'react'
import { DialogContent } from '../dialog'
import { TextArea } from '../lib/text-area'
import { LinkButton } from '../lib/link-button'
import { Ref } from '../lib/ref'
import { t } from 'i18next'

interface IGitIgnoreProps {
  readonly text: string | null
  readonly onIgnoreTextChanged: (text: string) => void
  readonly onShowExamples: () => void
}

/** A view for creating or modifying the repository's gitignore file */
export class GitIgnore extends React.Component<IGitIgnoreProps, {}> {
  public render() {
    return (
      <DialogContent>
        <p>
          {t('git-ignore.gitignore-message-1', 'Editing ')}
          <Ref>.gitignore</Ref>
          {t(
            'git-ignore.gitignore-message-2',
            `. This file specifies intentionally
          untracked files that Git should ignore. Files already tracked by Git
          are not affected. `
          )}
          <LinkButton onClick={this.props.onShowExamples}>
            {t('git-ignore.gitignore-learn-more', 'Learn more')}
          </LinkButton>
        </p>

        <TextArea
          placeholder={t(
            'git-ignore.placeholder-ignored-files',
            'Ignored files'
          )}
          value={this.props.text || ''}
          onValueChanged={this.props.onIgnoreTextChanged}
          textareaClassName="gitignore"
        />
      </DialogContent>
    )
  }
}
