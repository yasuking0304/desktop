import * as React from 'react'
import { encodePathAsUrl } from '../../lib/path'
import { t } from 'i18next'

const BlankSlateImage = encodePathAsUrl(
  __dirname,
  'static/multiple-files-selected.svg'
)

interface IMultipleSelectionProps {
  /** Called when the user chooses to open the repository. */
  readonly count: number
}
/** The component to display when there are no local changes. */
export class MultipleSelection extends React.Component<
  IMultipleSelectionProps,
  {}
> {
  public render() {
    return (
      <div className="panel blankslate" id="no-changes">
        <img src={BlankSlateImage} className="blankslate-image" alt="" />
        <div>
          {t(
            'multiple-selection.number-files-seletced',
            '{{0}} files selected',
            { 0: this.props.count }
          )}
        </div>
      </div>
    )
  }
}
