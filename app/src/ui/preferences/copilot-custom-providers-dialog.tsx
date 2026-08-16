import * as React from 'react'
import { isLocalBaseUrl, type IBYOKProvider } from '../../lib/copilot/byok'
import { Button } from '../lib/button'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Octicon } from '../octicons'
import { t } from 'i18next'
import * as octicons from '../octicons/octicons.generated'

interface ICopilotCustomProvidersDialogProps {
  readonly providers: ReadonlyArray<IBYOKProvider>
  readonly onAddProvider: () => void
  readonly onEditProvider: (provider: IBYOKProvider) => void
  readonly onDeleteProvider: (provider: IBYOKProvider) => void
  readonly onDismissed: () => void
}

/** Dialog for managing custom Copilot model providers. */
export class CopilotCustomProvidersDialog extends React.Component<ICopilotCustomProvidersDialogProps> {
  private onAddProviderClick = () => this.props.onAddProvider()

  private onEditProviderClick = (provider: IBYOKProvider) => () =>
    this.props.onEditProvider(provider)

  private onDeleteProviderClick = (provider: IBYOKProvider) => () =>
    this.props.onDeleteProvider(provider)

  public render() {
    return (
      <Dialog
        id="copilot-custom-providers-dialog"
        className="copilot-settings-dialog"
        title={
          __DARWIN__
            ? t(
                'copilot-custom-providers-dialog.custom-providers-darwin',
                'Custom Providers'
              )
            : t(
                'copilot-custom-providers-dialog.custom-providers',
                'Custom providers'
              )
        }
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <div className="copilot-section">
            {this.renderProviders()}
            <Button onClick={this.onAddProviderClick}>
              {__DARWIN__
                ? t(
                    'copilot-custom-providers-dialog.add-provider-darwin',
                    'Add Provider…'
                  )
                : t(
                    'copilot-custom-providers-dialog.add-provider',
                    'Add provider…'
                  )}
            </Button>
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={t('common.done', 'Done')}
            cancelButtonVisible={false}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderProviders(): JSX.Element {
    if (this.props.providers.length === 0) {
      return (
        <p className="copilot-byok-empty">
          {t(
            'copilot-custom-providers-dialog.add-a-custom-provider',
            'Add a custom provider to use your own API keys with OpenAI-compatible endpoints, Azure, Anthropic, or local providers like Ollama.'
          )}
        </p>
      )
    }

    return (
      <ul className="copilot-byok-entry-list">
        {this.props.providers.map(this.renderProvider)}
      </ul>
    )
  }

  private renderProvider = (provider: IBYOKProvider) => {
    const modelCount = provider.models.length
    const modelLabel =
      modelCount === 1
        ? t('copilot-custom-providers-dialog.one-model', '1 model')
        : t('copilot-custom-providers-dialog.many-models', `{{0}} models`, {
            0: modelCount,
          })
    const isLocal = isLocalBaseUrl(provider.baseUrl)

    return (
      <li key={provider.id} className="copilot-byok-entry">
        <div className="copilot-byok-entry-info">
          <div className="copilot-byok-entry-title">
            <span>{provider.name}</span>
            {isLocal && (
              <span className="copilot-byok-provider-badge">Local</span>
            )}
          </div>
          <span className="copilot-byok-entry-meta">
            {this.formatProviderType(provider)} · {modelLabel}
          </span>
        </div>
        <div className="copilot-byok-entry-actions">
          <Button
            onClick={this.onEditProviderClick(provider)}
            ariaLabel={`Edit ${provider.name}`}
          >
            <Octicon symbol={octicons.pencil} />
          </Button>
          <Button
            onClick={this.onDeleteProviderClick(provider)}
            ariaLabel={`Remove ${provider.name}`}
          >
            <Octicon symbol={octicons.trash} />
          </Button>
        </div>
      </li>
    )
  }

  private formatProviderType(provider: IBYOKProvider): string {
    switch (provider.type) {
      case 'openai':
        return t(
          'copilot-custom-providers-dialog.provider-type-openai',
          'OpenAI-compatible'
        )
      case 'azure':
        return t('copilot-custom-providers-dialog.provider-type-azure', 'Azure')
      case 'anthropic':
        return t(
          'copilot-custom-providers-dialog.provider-type-anthropic',
          'Anthropic'
        )
    }
  }
}
