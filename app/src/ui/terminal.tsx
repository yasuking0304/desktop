import {
  ITerminalOptions,
  ITerminalInitOnlyOptions,
  Terminal as XTermTerminal,
} from '@xterm/xterm'
import React from 'react'
import { getMonospaceFontFamily } from './get-monospace-font-family'
import { TerminalOutput } from '../lib/git'

export const defaultTerminalOptions: Readonly<ITerminalOptions> = {
  convertEol: true,
  fontFamily: getMonospaceFontFamily(),
  fontSize: 12,
  screenReaderMode: true,
}

export type TerminalProps = ITerminalOptions &
  ITerminalInitOnlyOptions & {
    readonly terminalOutput?: TerminalOutput
    readonly hideCursor?: boolean
  }

export class Terminal extends React.Component<TerminalProps> {
  private terminalRef = React.createRef<HTMLDivElement>()
  private terminal: XTermTerminal | null = null

  public get Terminal() {
    return this.terminal
  }

  public write(data: TerminalOutput) {
    if (Array.isArray(data)) {
      data.forEach(chunk => this.terminal?.write(chunk))
    } else {
      this.terminal?.write(data)
    }
  }

  public componentWillUnmount(): void {
    this.terminal?.dispose()
  }

  public componentDidMount() {
    const { terminalOutput, hideCursor, ...initOpts } = this.props
    this.terminal = new XTermTerminal({
      ...defaultTerminalOptions,
      ...initOpts,

      rows: this.props.rows ?? 20,
      cols: this.props.cols ?? 80,
    })

    if (this.terminalRef.current) {
      this.terminal.open(this.terminalRef.current)

      if (this.terminal.textarea) {
        this.terminal.textarea.disabled = true
      }

      if (hideCursor !== false) {
        this.terminal.write('\x1b[?25l') // hide cursor
        if (terminalOutput) {
          this.write(terminalOutput)
        }
      }
    }
  }

  public render() {
    return <div ref={this.terminalRef}></div>
  }
}
