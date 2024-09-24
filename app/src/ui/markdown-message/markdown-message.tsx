import * as React from 'react'
import { Dialog, DialogContent, DefaultDialogFooter } from '../dialog'
import { SandboxedMarkdown } from '../lib/sandboxed-markdown'
import { Emoji } from '../../lib/emoji'

interface IMarkdownMessageDialogProps {
  readonly title: string
  readonly markdownBody: string
  /** Map from the emoji shortcut (e.g., :+1:) to the image's local path. */
  readonly emoji: Map<string, Emoji>

  /**
   * Callback to use when the dialog gets closed.
   */
  readonly onDismissed: () => void
}

export class MarkdownMessageDialog extends React.Component<IMarkdownMessageDialogProps> {
  public constructor(props: IMarkdownMessageDialogProps) {
    super(props)
  }

  public render() {
    return (
      <Dialog
        title={this.props.title}
        id="markdown-message"
        onDismissed={this.props.onDismissed}
        // onSubmit={this.onSubmit}
        ariaDescribedBy="markdown-message-body"
      >
        <DialogContent>
          <div id="markdown-message-body">
            <SandboxedMarkdown
              emoji={this.props.emoji}
              markdown={this.props.markdownBody}
              underlineLinks={true}
              ariaLabel={this.props.title}
            />
          </div>
        </DialogContent>
        <DefaultDialogFooter />
      </Dialog>
    )
  }
}
