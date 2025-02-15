import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { Row } from '../lib/row'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Account } from '../../models/account'
import { getDotComAPIEndpoint } from '../../lib/api'
import { t } from 'i18next'

interface IInvalidatedTokenProps {
  readonly dispatcher: Dispatcher
  readonly account: Account
  readonly onDismissed: () => void
}

/**
 * Dialog that alerts user that their GitHub (Enterprise) account token is not
 * valid and they need to sign in again.
 */
export class InvalidatedToken extends React.Component<IInvalidatedTokenProps> {
  public render() {
    const accountTypeSuffix = this.isEnterpriseAccount ? ' Enterprise' : ''

    return (
      <Dialog
        id="invalidated-token"
        type="warning"
        title={
          __DARWIN__
            ? t(
                'invalidated-token.invalidated-account-token-darwin',
                'Invalidated Account Token'
              )
            : t(
                'invalidated-token.invalidated-account-token',
                'Invalidated account token'
              )
        }
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <Row>
            {t(
              'invalidated-token.token-has-been-invalidated',
              `Your account token has been invalidated and you have been
                 signed out from your GitHub{{0}} account. Do you want to
                 sign in again?`,
              { 0: accountTypeSuffix }
            )}
          </Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={t('common.yes', 'Yes')}
            cancelButtonText={t('common.no', 'No')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private get isEnterpriseAccount() {
    return this.props.account.endpoint !== getDotComAPIEndpoint()
  }

  private onSubmit = () => {
    const { dispatcher, onDismissed } = this.props

    onDismissed()

    if (this.isEnterpriseAccount) {
      dispatcher.showEnterpriseSignInDialog(this.props.account.endpoint)
    } else {
      dispatcher.showDotComSignInDialog()
    }
  }
}
