import * as React from 'react'
import {
  Account,
  isDotComAccount,
  isEnterpriseAccount,
} from '../../models/account'
import { IAvatarUser } from '../../models/avatar'
import { lookupPreferredEmail } from '../../lib/email'
import { assertNever } from '../../lib/fatal-error'
import { Button } from '../lib/button'
import { Row } from '../lib/row'
import { DialogContent, DialogPreferredFocusClassName } from '../dialog'
import { Avatar } from '../lib/avatar'
import { CallToAction } from '../lib/call-to-action'

interface IAccountsProps {
  readonly accounts: ReadonlyArray<Account>

  readonly onDotComSignIn: () => void
  readonly onEnterpriseSignIn: () => void
  readonly onLogout: (account: Account) => void
}

enum SignInType {
  DotCom,
  Enterprise,
}

export class Accounts extends React.Component<IAccountsProps, {}> {
  public render() {
    const { accounts } = this.props
    const dotComAccount = accounts.find(isDotComAccount)
    const enterpriseAccount = accounts.find(isEnterpriseAccount)

    return (
      <DialogContent className="accounts-tab">
        <h2>GitHub.com</h2>
        {dotComAccount
          ? this.renderAccount(dotComAccount, SignInType.DotCom)
          : this.renderSignIn(SignInType.DotCom)}

        <h2>GitHub Enterprise</h2>
        {enterpriseAccount
          ? this.renderAccount(enterpriseAccount, SignInType.Enterprise)
          : this.renderSignIn(SignInType.Enterprise)}
      </DialogContent>
    )
  }

  private renderAccount(account: Account, type: SignInType) {
    const avatarUser: IAvatarUser = {
      name: account.name,
      email: lookupPreferredEmail(account),
      avatarURL: account.avatarURL,
      endpoint: account.endpoint,
    }

    const accountTypeLabel =
      type === SignInType.DotCom ? 'GitHub.com' : 'GitHub Enterprise'

    // The DotCom account is shown first, so its sign in/out button should be
    // focused initially when the dialog is opened.
    const className =
      type === SignInType.DotCom ? DialogPreferredFocusClassName : undefined

    return (
      <Row className="account-info">
        <div className="user-info-container">
          <Avatar accounts={this.props.accounts} user={avatarUser} />
          <div className="user-info">
            <div className="name">{account.name}</div>
            <div className="login">@{account.login}</div>
          </div>
        </div>
        <Button onClick={this.logout(account)} className={className}>
          {__DARWIN__ ? 'Sign Out of' : 'Sign out of'} {accountTypeLabel}
        </Button>
      </Row>
    )
  }

  private onDotComSignIn = () => {
    this.props.onDotComSignIn()
  }

  private onEnterpriseSignIn = () => {
    this.props.onEnterpriseSignIn()
  }

  private renderSignIn(type: SignInType) {
    const signInTitle = __DARWIN__ ? 'Sign Into' : 'Sign into'
    switch (type) {
      case SignInType.DotCom: {
        return (
          <CallToAction
            actionTitle={signInTitle + ' GitHub.com'}
            onAction={this.onDotComSignIn}
            // The DotCom account is shown first, so its sign in/out button should be
            // focused initially when the dialog is opened.
            buttonClassName={DialogPreferredFocusClassName}
          >
            <div>
              Sign in to your GitHub.com account to access your repositories.
            </div>
          </CallToAction>
        )
      }
      case SignInType.Enterprise:
        return (
          <CallToAction
            actionTitle={signInTitle + ' GitHub Enterprise'}
            onAction={this.onEnterpriseSignIn}
          >
            <div>
              If you are using GitHub Enterprise at work, sign in to it to get
              access to your repositories.
            </div>
          </CallToAction>
        )
      default:
        return assertNever(type, `Unknown sign in type: ${type}`)
    }
  }

  private logout = (account: Account) => {
    return () => {
      this.props.onLogout(account)
    }
  }
}
