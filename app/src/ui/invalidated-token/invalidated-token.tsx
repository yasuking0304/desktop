import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { t } from 'i18next'
import { Account } from '../../models/account'
import { Ref } from '../lib/ref'

interface IInvalidatedTokenProps {
  readonly dispatcher: Pick<Dispatcher, 'showAccountSignInDialog'>
  readonly account: Account
  readonly onDismissed: () => void
}

/**
 * Dialog that alerts user that their GitHub (Enterprise) account token is not
 * valid and they need to sign in again.
 */
export class InvalidatedToken extends React.Component<IInvalidatedTokenProps> {
  public render() {
    const { account } = this.props

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
          {t(
            'invalidated-token.token-has-been-invalidated-1',
            `Your account token is no longer valid and you have been signed out
              from your `)}
              <Ref>{account.login}</Ref>
              {t(
                'invalidated-token.token-has-been-invalidated-2-1',
                `account on `)}
              <Ref>{account.friendlyEndpoint}</Ref>
              {t(
                'invalidated-token.token-has-been-invalidated-3',
                `. Do you want to sign in again?`
              )}
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

  private onSubmit = () => {
    const { dispatcher, onDismissed, account } = this.props

    onDismissed()

    // Other accounts may still be signed in to the same endpoint, so sign
    // back in to this specific account rather than any account.
    dispatcher.showAccountSignInDialog(account.endpoint, account.login)
  }
}
