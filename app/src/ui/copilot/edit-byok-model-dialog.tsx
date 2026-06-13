import * as React from 'react'
import { Dialog, DialogContent, DialogFooter, DialogError } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { TextBox } from '../lib/text-box'
import { Select } from '../lib/select'
import { Row } from '../lib/row'
import { IBYOKModel } from '../../lib/copilot/byok'
import {
  formatReasoningEffort,
  ReasoningEffort,
  ReasoningEffortOrder,
} from '../../lib/stores/copilot-store'
import { t } from 'i18next'

const NoReasoningEffort = '__none__'

interface IEditCopilotBYOKModelDialogProps {
  /** The model being edited, or `null` when adding a new model. */
  readonly model: IBYOKModel | null
  /**
   * Existing model IDs in the same provider, used to detect duplicates.
   * Excludes the model being edited.
   */
  readonly otherModelIds: ReadonlyArray<string>
  readonly onSave: (model: IBYOKModel) => void
  readonly onDismissed: () => void
}

interface IEditCopilotBYOKModelDialogState {
  readonly id: string
  readonly name: string
  readonly reasoningEffort: ReasoningEffort | typeof NoReasoningEffort
  readonly errorMessage: string | null
}

/**
 * Add/edit dialog for a single model belonging to a BYOK Copilot provider.
 * The model is returned to the parent via the `onSave` callback prop and is
 * not persisted directly.
 */
export class EditCopilotBYOKModelDialog extends React.Component<
  IEditCopilotBYOKModelDialogProps,
  IEditCopilotBYOKModelDialogState
> {
  public constructor(props: IEditCopilotBYOKModelDialogProps) {
    super(props)
    this.state = {
      id: props.model?.id ?? '',
      name: props.model?.name ?? '',
      reasoningEffort: props.model?.reasoningEffort ?? NoReasoningEffort,
      errorMessage: null,
    }
  }

  public render() {
    const isEditing = this.props.model !== null
    const title = isEditing
      ? __DARWIN__
        ? t('edit-byok-model-dialog.edit-model-darwin', 'Edit Model')
        : t('edit-byok-model-dialog.edit-model', 'Edit model')
      : __DARWIN__
      ? t('edit-byok-model-dialog.add-model-darwin', 'Add Model')
      : t('edit-byok-model-dialog.add-model', 'Add model')

    return (
      <Dialog
        id="edit-copilot-byok-model"
        title={title}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        {this.state.errorMessage !== null && (
          <DialogError>{this.state.errorMessage}</DialogError>
        )}
        <DialogContent>
          <Row className="copilot-byok-field">
            <TextBox
              label={
                __DARWIN__
                  ? t(
                      'edit-byok-model-dialog.display-name-darwin',
                      'Display Name'
                    )
                  : t('edit-byok-model-dialog.display-name', 'Display name')
              }
              value={this.state.name}
              onValueChanged={this.onNameChanged}
              placeholder="GPT-4o"
              autoFocus={true}
            />
            <p className="copilot-byok-field-hint">
              {t(
                'edit-byok-model-dialog.the-friendly-name-shown',
                'The friendly name shown in the Copilot model picker.'
              )}
            </p>
          </Row>
          <Row className="copilot-byok-field">
            <TextBox
              label={
                __DARWIN__
                  ? t(
                      'edit-byok-model-dialog.model-identifier-darwin',
                      'Model Identifier'
                    )
                  : t(
                      'edit-byok-model-dialog.model-identifier',
                      'Model identifier'
                    )
              }
              value={this.state.id}
              onValueChanged={this.onIdChanged}
              placeholder="gpt-4o"
              required={true}
            />
            <p className="copilot-byok-field-hint">
              {t(
                'edit-byok-model-dialog.copilot-byok-model-hint-1',
                'The exact name your provider expects (e.g. '
              )}
              <code>gpt-4o</code>, <code>llama3</code>
              {t('edit-byok-model-dialog.copilot-byok-provider-hint-2', ' ).')}
            </p>
          </Row>
          <Row className="copilot-byok-field">
            <Select
              label={
                __DARWIN__
                  ? t(
                      'edit-byok-model-dialog.reasoning-effort-darwin',
                      'Reasoning Effort'
                    )
                  : t(
                      'edit-byok-model-dialog.reasoning-effort',
                      'Reasoning effort'
                    )
              }
              value={this.state.reasoningEffort}
              onChange={this.onReasoningEffortChanged}
            >
              <option value={NoReasoningEffort}>
                {t(
                  'edit-byok-model-dialog.reasoning-effort-default-provider',
                  "Default (provider's choice)"
                )}
              </option>
              {ReasoningEffortOrder.map(effort => (
                <option key={effort} value={effort}>
                  {formatReasoningEffort(effort)}
                </option>
              ))}
            </Select>
            <p className="copilot-byok-field-hint">
              {t(
                'edit-byok-model-dialog.reasoning-effort-hint-1',
                `Reasoning models (o1, o3, GPT-5 reasoning variants, etc.)
                 think before responding. Higher levels are slower but
                 produce better answers on complex tasks.
                 Leave on `
              )}
              <em>
                {t(
                  'edit-byok-model-dialog.reasoning-effort-default',
                  'Default'
                )}
              </em>
              {t(
                'edit-byok-model-dialog.reasoning-effort-hint-2',
                ` for non-reasoning models or to let the provider pick.`
              )}
            </p>
          </Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={
              isEditing ? t('common.save', 'Save') : t('common.add', 'Add')
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onIdChanged = (id: string) => this.setState({ id })

  private onNameChanged = (name: string) => this.setState({ name })

  private onReasoningEffortChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = event.currentTarget.value
    this.setState({
      reasoningEffort:
        value === NoReasoningEffort
          ? NoReasoningEffort
          : (value as ReasoningEffort),
    })
  }

  private onSubmit = () => {
    const validationError = this.validate()
    if (validationError !== null) {
      this.setState({ errorMessage: validationError })
      return
    }

    const id = this.state.id.trim()
    const name = this.state.name.trim() === '' ? id : this.state.name.trim()
    const model: IBYOKModel = {
      id,
      name,
      ...(this.state.reasoningEffort !== NoReasoningEffort
        ? { reasoningEffort: this.state.reasoningEffort }
        : {}),
    }

    this.props.onSave(model)
    this.props.onDismissed()
  }

  private validate(): string | null {
    const id = this.state.id.trim()
    if (id === '') {
      return t(
        'edit-byok-model-dialog.model-identifier-error',
        'Please enter a model identifier.'
      )
    }
    if (this.props.otherModelIds.includes(id)) {
      return t(
        'edit-byok-model-dialog.model-identifier-exists',
        `Another model with the identifier '{{0}}' already exists.`,
        { 0: id }
      )
    }
    return null
  }
}
