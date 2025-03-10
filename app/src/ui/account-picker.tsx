import * as React from 'react'
import { PopoverDropdown } from './lib/popover-dropdown'
import { Account, isDotComAccount } from '../models/account'
import { SectionFilterList } from './lib/section-filter-list'
import {
  IFilterListGroup,
  IFilterListItem,
  SelectionSource,
} from './lib/filter-list'
import { IMatches } from '../lib/fuzzy-find'
import { Avatar } from './lib/avatar'
import { lookupPreferredEmail } from '../lib/email'
import { IAvatarUser } from '../models/avatar'
import { compare, compareDescending } from '../lib/compare'

interface IAccountPickerProps {
  readonly accounts: ReadonlyArray<Account>
  readonly selectedAccount: Account
  readonly onSelectedAccountChanged: (account: Account) => void

  /**
   * The class name to apply to the open button. This is useful for
   * applying the dialog-preferred-focus class to the button when it
   * should receive focus ahead of a dialog's default focus target
   */
  readonly openButtonClassName?: string
}

interface IAccountPickerState {
  readonly filterText: string
  readonly groupedItems: ReadonlyArray<IFilterListGroup<IAccountListItem>>
  readonly selectedItem: IAccountListItem | null
}

interface IAccountListItem extends IFilterListItem {
  readonly id: string
  readonly text: ReadonlyArray<string>
  readonly account: Account
}

function findItemForAccount(
  group: IFilterListGroup<IAccountListItem>,
  account: Account
): IAccountListItem | null {
  return (
    group.items.find(
      i =>
        i.account.endpoint === account.endpoint &&
        i.account.login === account.login
    ) ?? null
  )
}

function resolveSelectedItem(
  group: IFilterListGroup<IAccountListItem>,
  props: IAccountPickerProps,
  currentlySelectedItem: IAccountListItem | null
): IAccountListItem | null {
  let selectedItem: IAccountListItem | null = null

  if (props.selectedAccount != null) {
    selectedItem = findItemForAccount(group, props.selectedAccount)
  }

  if (selectedItem == null && currentlySelectedItem != null) {
    selectedItem = findItemForAccount(group, currentlySelectedItem.account)
  }

  return selectedItem
}

const getItemId = (account: Account) => `${account.login}@${account.endpoint}`

function createListItems(
  accounts: ReadonlyArray<Account>
): IFilterListGroup<IAccountListItem> {
  const items = accounts
    .map(account => ({
      text: [account.login, account.endpoint],
      id: getItemId(account),
      account,
    }))
    .sort(
      (x, y) =>
        compareDescending(
          isDotComAccount(x.account),
          isDotComAccount(y.account)
        ) || compare(x.account.login, y.account.login)
    )

  return {
    identifier: 'accounts',
    items,
  }
}

/**
 * A branch select element for filter and selecting a branch.
 */
export class AccountPicker extends React.Component<
  IAccountPickerProps,
  IAccountPickerState
> {
  private popoverRef = React.createRef<PopoverDropdown>()

  public constructor(props: IAccountPickerProps) {
    super(props)

    const group = createListItems(props.accounts)
    const selectedItem = resolveSelectedItem(group, props, null)

    this.state = {
      filterText: '',
      groupedItems: [group],
      selectedItem,
    }
  }

  public componentWillReceiveProps(nextProps: IAccountPickerProps) {
    if (nextProps.accounts !== this.props.accounts) {
      const group = createListItems(nextProps.accounts)
      const selectedItem = resolveSelectedItem(
        group,
        nextProps,
        this.state.selectedItem
      )

      this.setState({ groupedItems: [group], selectedItem })
    }
  }

  private onFilterTextChanged = (text: string) => {
    this.setState({ filterText: text })
  }

  private getAvatarUser = (account: Account): IAvatarUser => {
    return {
      name: account.name,
      email: lookupPreferredEmail(account),
      avatarURL: account.avatarURL,
      endpoint: account.endpoint,
    }
  }

  private renderAccount = (item: IAccountListItem, matches: IMatches) => {
    const account = item.account

    return (
      <div className="account-list-item">
        <Avatar
          accounts={this.props.accounts}
          user={this.getAvatarUser(account)}
        />
        <div className="info">
          <div className="title">@{item.account.login}</div>
          <div className="subtitle">{item.account.friendlyEndpoint}</div>
        </div>
      </div>
    )
  }

  private onItemClick = (item: IAccountListItem, source: SelectionSource) => {
    const account = item.account
    this.popoverRef.current?.closePopover()

    this.setState({ selectedItem: item })
    this.props.onSelectedAccountChanged(account)
  }

  private onSelectionChanged = (
    selectedItem: IAccountListItem | null,
    source: SelectionSource
  ) => {
    this.setState({ selectedItem })
  }

  private getItemAriaLabel = (item: IAccountListItem) =>
    `@${item.account.login} ${item.account.friendlyEndpoint}`

  public render() {
    const account = this.props.selectedAccount

    return (
      <PopoverDropdown
        className="account-picker"
        contentTitle="Choose an account"
        buttonContent={
          <div className="account">
            <span className="login">@{account.login}</span> -{' '}
            <span className="endpoint">
              {this.props.selectedAccount.friendlyEndpoint}
            </span>
          </div>
        }
        label="Account"
        ref={this.popoverRef}
        openButtonClassName={this.props.openButtonClassName}
      >
        <SectionFilterList<IAccountListItem>
          className="account-list"
          rowHeight={47}
          groups={this.state.groupedItems}
          selectedItem={this.state.selectedItem}
          renderItem={this.renderAccount}
          filterText={this.state.filterText}
          onFilterTextChanged={this.onFilterTextChanged}
          invalidationProps={this.props.accounts}
          onItemClick={this.onItemClick}
          onSelectionChanged={this.onSelectionChanged}
          getItemAriaLabel={this.getItemAriaLabel}
        />
      </PopoverDropdown>
    )
  }
}
