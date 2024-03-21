import * as React from 'react'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { t } from 'i18next'

interface IAccessibilityPreferencesProps {
  readonly underlineLinks: boolean
  readonly onUnderlineLinksChanged: (value: boolean) => void

  readonly showDiffCheckMarks: boolean
  readonly onShowDiffCheckMarksChanged: (value: boolean) => void
}

export class Accessibility extends React.Component<
  IAccessibilityPreferencesProps,
  {}
> {
  public constructor(props: IAccessibilityPreferencesProps) {
    super(props)
  }

  public render() {
    return (
      <DialogContent>
        <div className="advanced-section">
          <h2>{t('accessibility.accessibility', 'Accessibility')}</h2>
          <Checkbox
            label={t('accessibility.underline-links', 'Underline links')}
            value={
              this.props.underlineLinks ? CheckboxValue.On : CheckboxValue.Off
            }
            onChange={this.onUnderlineLinksChanged}
            ariaDescribedBy="underline-setting-description"
          />
          <p
            id="underline-setting-description"
            className="git-settings-description"
          >
            {t(
              'accessibility.underline-links-in-commit-messages',
              `When enabled, GitHub Desktop will underline links in commit
              messages, comments, and other text fields. This can help make links
              easier to distinguish.`
            )}
            {this.renderExampleLink()}
          </p>

          <Checkbox
            label={t(
              'accessibility.show-check-marks-in-the-diff',
              'Show check marks in the diff'
            )}
            value={
              this.props.showDiffCheckMarks
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onShowDiffCheckMarksChanged}
            ariaDescribedBy="diff-checkmarks-setting-description"
          />
          <p
            id="diff-checkmarks-setting-description"
            className="git-settings-description"
          >
            {t(
              'accessibility.check-marks-will-be-displayed',
              `When enabled, check marks will be displayed along side the line
              numbers and groups of line numbers in the diff when committing. When
              disabled, the line number controls will be less prominent.`
            )}
          </p>
        </div>
      </DialogContent>
    )
  }

  private renderExampleLink() {
    // The example link is rendered with inline style to override the global setting.
    const style = {
      textDecoration: this.props.underlineLinks ? 'underline' : 'none',
    }

    return (
      <span className="link-button-component" style={style}>
        {t('accessibility.this-is-an-example-link', 'This is an example link')}
      </span>
    )
  }

  private onUnderlineLinksChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onUnderlineLinksChanged(event.currentTarget.checked)
  }

  private onShowDiffCheckMarksChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onShowDiffCheckMarksChanged(event.currentTarget.checked)
  }
}
