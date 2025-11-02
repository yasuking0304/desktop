import * as React from 'react'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'

/**
 * A component used for displaying short danger messages inline
 * in a dialog. These danger messages (there can be more than one)
 * should be rendered as the first child of the <Dialog> component
 * and support arbitrary content.
 *
 * The content (danger message) is paired with a blocked icon and receive
 * special styling.
 *
 * Provide `children` to display content inside the danger dialog.
 */
export class DialogDanger extends React.Component {
  public render() {
    return (
      <div className="dialog-banner dialog-danger" role="alert">
        <Octicon symbol={octicons.blocked} />
        <div>{this.props.children}</div>
      </div>
    )
  }
}
