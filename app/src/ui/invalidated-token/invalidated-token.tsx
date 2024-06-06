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
        title={t('common.warning', 'Warning')}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <Row>
            Your account token has been invalidated and you have been signed out
            from your GitHub{accountTypeSuffix} account. Do you want to sign in
            again?
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
