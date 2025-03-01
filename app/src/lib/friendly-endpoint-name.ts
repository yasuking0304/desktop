import * as URL from 'url'
import { Account, isDotComAccount } from '../models/account'

/**
 * Generate a human-friendly description of the Account endpoint.
 *
 * Accounts on GitHub.com will return the string 'GitHub.com'
 * whereas GitHub Enterprise accounts will return the
 * hostname without the protocol and/or path.
 */
export function friendlyEndpointName(account: Account) {
  return isDotComAccount(account)
    ? 'GitHub.com'
    : URL.parse(account.endpoint).hostname || account.endpoint
}
