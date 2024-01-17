import * as React from 'react'

import { sanitizedRefName } from '../../lib/sanitize-ref-name'
import { TextBox } from './text-box'
import { Ref } from './ref'
import { t } from 'i18next'
import { InputWarning } from './input-description/input-warning'

interface IRefNameProps {
  /**
   * The initial value for the ref name.
   *
   * Note that updates to this prop will be ignored.
   */
  readonly initialValue?: string

  /**
   * The label of the text box.
   */
  readonly label?: string | JSX.Element

  /**
   * The aria-labelledBy attribute for the text box.
   */
  readonly ariaLabelledBy?: string

  /**
   * The aria-describedby attribute for the text box.
   */
  readonly ariaDescribedBy?: string

  /**
   * Called when the user changes the ref name.
   *
   * A sanitized value for the ref name is passed.
   */
  readonly onValueChange?: (sanitizedValue: string) => void

  /**
   * Optional verb for the warning message.
   *
   * Warning message: Will be {this.props.warningMessageVerb ?? 'saved '} as{'
   * '} <Ref>{sanitizedValue}</Ref>.
   */
  readonly warningMessageVerb?: string

  /**
   * Callback used when the component loses focus.
   *
   * A sanitized value for the ref name is passed.
   */
  readonly onBlur?: (sanitizedValue: string) => void

  /**
   * The placeholder of the text box.
   */
  readonly placeholder?: string
}

interface IRefNameState {
  readonly proposedValue: string
  readonly sanitizedValue: string
}

export class RefNameTextBox extends React.Component<
  IRefNameProps,
  IRefNameState
> {
  private textBoxRef = React.createRef<TextBox>()

  public constructor(props: IRefNameProps) {
    super(props)

    const proposedValue = props.initialValue || ''

    this.state = {
      proposedValue,
      sanitizedValue: sanitizedRefName(proposedValue),
    }
  }

  public componentDidMount() {
    if (
      this.state.sanitizedValue !== this.props.initialValue &&
      this.props.onValueChange !== undefined
    ) {
      this.props.onValueChange(this.state.sanitizedValue)
    }
  }

  public render() {
    return (
      <div className="ref-name-text-box">
        <TextBox
          label={this.props.label}
          placeholder={this.props.placeholder}
          value={this.state.proposedValue}
          ref={this.textBoxRef}
          ariaLabelledBy={this.props.ariaLabelledBy}
          ariaDescribedBy={this.props.ariaDescribedBy}
          onValueChanged={this.onValueChange}
          onBlur={this.onBlur}
        />

        {this.renderRefValueWarning()}
      </div>
    )
  }

  /**
   * Programmatically moves keyboard focus to the inner text input element if it can be focused
   * (i.e. if it's not disabled explicitly or implicitly through for example a fieldset).
   */
  public focus() {
    if (this.textBoxRef.current !== null) {
      this.textBoxRef.current.focus()
    }
  }

  private onValueChange = (proposedValue: string) => {
    const sanitizedValue = sanitizedRefName(proposedValue)
    const previousSanitizedValue = this.state.sanitizedValue

    this.setState({ proposedValue, sanitizedValue })

    if (sanitizedValue === previousSanitizedValue) {
      return
    }

    if (this.props.onValueChange === undefined) {
      return
    }

    this.props.onValueChange(sanitizedValue)
  }

  private onBlur = (proposedValue: string) => {
    if (this.props.onBlur !== undefined) {
      // It's possible (although rare) that we receive the onBlur
      // event before the sanitized value has been committed to the
      // state so we need to use the value received from the onBlur
      // event instead of the one stored in state.
      this.props.onBlur(sanitizedRefName(proposedValue))
    }
  }

  private renderRefValueWarning() {
    const { proposedValue, sanitizedValue } = this.state

    if (proposedValue === sanitizedValue) {
      return null
    }

    return (
      <InputWarning
        id="branch-name-warning"
        className="warning-helper-text"
        trackedUserInput={proposedValue}
        ariaLiveMessage={this.getWarningMessageAsString(
          sanitizedValue,
          proposedValue
        )}
      >
        <p>{this.renderWarningMessage(sanitizedValue, proposedValue)}</p>
      </InputWarning>
    )
  }

  private getWarningMessageAsString(
    sanitizedValue: string,
    proposedValue: string
  ): string {
    // If the proposed value ends up being sanitized as
    // an empty string we show a message saying that the
    // proposed value is invalid.
    if (sanitizedValue.length === 0) {
      return t(
        'ref-name-text-box.warning-not-a-valid-name',
        'Warning: {{0}} is not a valid name.',
        { 0: proposedValue }
      )
    }

    const warningMessage =
      this.props.warningMessageVerb ?? t('ref-name-text-box.created', 'created')
    return t(
      'ref-name-text-box.get-warning-message-as-string',
      'Warning: Will be {{0}} as {{1}} (with spaces replaced by hyphens).',
      { 0: warningMessage, 1: sanitizedValue }
    )
  }

  private renderWarningMessage(sanitizedValue: string, proposedValue: string) {
    // If the proposed value ends up being sanitized as
    // an empty string we show a message saying that the
    // proposed value is invalid.
    if (sanitizedValue.length === 0) {
      return (
        <>
          <Ref>{proposedValue}</Ref>
          {t('ref-name-text-box.is-not-a-valid-name', ' is not a valid name.')}
        </>
      )
    }
    const warningMessage =
      this.props.warningMessageVerb ?? t('ref-name-text-box.created', 'created')
    return (
      <>
        {t('ref-name-text-box.will-be-created-as-1', 'Will be {{0}} as ', {
          0: warningMessage,
        })}
        <Ref>{sanitizedValue}</Ref>
        {t('ref-name-text-box.will-be-created-as-2', '.', {
          0: warningMessage,
        })}
      </>
    )
  }
}
