import * as React from 'react'

interface IKeyboardShortCutProps {
  /** Windows/Linux keyboard shortcut */
  readonly keys: ReadonlyArray<string>
  /** MacOS keyboard shortcut */
  readonly darwinKeys: ReadonlyArray<string>
  /** Whether the shortcut character is a symbol */
  readonly isSymbol?: boolean
}

export class KeyboardShortcut extends React.Component<IKeyboardShortCutProps> {
  public render() {
    const keys = __DARWIN__ ? this.props.darwinKeys : this.props.keys
    const className = this.props.isSymbol
      ? 'symbol-keyboard-shortcut'
      : undefined
    return keys.map((k, i) => {
      return (
        <React.Fragment key={k + i}>
          <kbd className={className}>{k}</kbd>
          {!__DARWIN__ && i < keys.length - 1 ? <>+</> : null}
        </React.Fragment>
      )
    })
  }
}
