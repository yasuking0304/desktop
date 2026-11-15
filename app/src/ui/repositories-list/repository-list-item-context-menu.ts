import {
  Repository,
  getRepositoryAccountIdentity,
} from '../../models/repository'
import { Account, isSameAccount } from '../../models/account'
import { IMenuItem } from '../../lib/menu-item'
import { Repositoryish } from './group-repositories'
import { writeClipboardText } from '../main-process-proxy'
import {
  RevealInFileManagerLabel,
  DefaultEditorLabel,
  DefaultShellLabel,
} from '../lib/context-menu'
import { t } from 'i18next'

interface IRepositoryListItemContextMenuConfig {
  repository: Repositoryish
  shellLabel: string | undefined
  externalEditorLabel: string | undefined
  askForConfirmationOnRemoveRepository: boolean
  /** The signed-in accounts. */
  accounts: ReadonlyArray<Account>
  onViewOnGitHub: (repository: Repositoryish) => void
  onOpenInShell: (repository: Repositoryish) => void
  onShowRepository: (repository: Repositoryish) => void
  onOpenInExternalEditor: (repository: Repositoryish) => void
  onRemoveRepository: (repository: Repositoryish) => void
  onChangeRepositoryAlias: (repository: Repository) => void
  onRemoveRepositoryAlias: (repository: Repository) => void
  onCreateWorktree?: (repository: Repository) => void
  onShowWorktrees?: (repository: Repository) => void
  onChangeRepositoryAccount: (repository: Repository, login: string) => void
  onShowRepositorySettings: (repository: Repository) => void
}

export const generateRepositoryListContextMenu = (
  config: IRepositoryListItemContextMenuConfig
) => {
  const { repository } = config
  const missing = repository instanceof Repository && repository.missing
  const github =
    repository instanceof Repository && repository.gitHubRepository != null
  const openInExternalEditor = config.externalEditorLabel
    ? t('repository-list-item-context-menu.open-in-editor', `Open in {{0}}`, {
        0: config.externalEditorLabel,
      })
    : DefaultEditorLabel
  const openInShell = config.shellLabel
    ? t('repository-list-item-context-menu.open-in-shell', `Open in {{0}}`, {
        0: config.shellLabel,
      })
    : DefaultShellLabel

  const items: ReadonlyArray<IMenuItem> = [
    ...buildAliasMenuItems(config),
    ...buildWorktreeMenuItems(config),
    ...buildAccountMenuItems(config),
    ...buildRepositorySettingsMenuItems(config),
    {
      label: __DARWIN__
        ? t(
            'repository-list-item-context-menu.copy-repo-name-darwin',
            'Copy Repo Name'
          )
        : t(
            'repository-list-item-context-menu.copy-repo-name',
            'Copy repo name'
          ),
      action: () => writeClipboardText(repository.name),
    },
    {
      label: __DARWIN__
        ? t(
            'repository-list-item-context-menu.copy-repo-path-darwin',
            'Copy Repo Path'
          )
        : t(
            'repository-list-item-context-menu.copy-repo-path',
            'Copy repo path'
          ),
      action: () => writeClipboardText(repository.path),
    },
    { type: 'separator' },
    {
      label: t('common.view-on-github', 'View on GitHub'),
      action: () => config.onViewOnGitHub(repository),
      enabled: github,
    },
    {
      label: openInShell,
      action: () => config.onOpenInShell(repository),
      enabled: !missing,
    },
    {
      label: RevealInFileManagerLabel,
      action: () => config.onShowRepository(repository),
      enabled: !missing,
    },
    {
      label: openInExternalEditor,
      action: () => config.onOpenInExternalEditor(repository),
      enabled: !missing,
    },
    { type: 'separator' },
    {
      label: config.askForConfirmationOnRemoveRepository
        ? t('menu.confirm-remove-darwin', 'Remove…')
        : t('common.remove', 'Remove'),
      action: () => config.onRemoveRepository(repository),
    },
  ]

  return items
}

const buildAliasMenuItems = (
  config: IRepositoryListItemContextMenuConfig
): ReadonlyArray<IMenuItem> => {
  const { repository } = config

  if (!(repository instanceof Repository)) {
    return []
  }

  const verb =
    repository.alias == null
      ? t('common.create', 'Create')
      : t('common.change', 'Change')
  const items: Array<IMenuItem> = [
    {
      label: __DARWIN__
        ? t('common.opetarion-alias-darwin', `{{0}} Alias`, { 0: verb })
        : t('common.opetarion-alias', `{{0}} alias`, { 0: verb }),
      action: () => config.onChangeRepositoryAlias(repository),
    },
  ]

  if (repository.alias !== null) {
    items.push({
      label: __DARWIN__
        ? t('common.remove-alias-darwin', 'Remove Alias')
        : t('common.remove-alias', 'Remove alias'),
      action: () => config.onRemoveRepositoryAlias(repository),
    })
  }

  return items
}

const buildWorktreeMenuItems = (
  config: IRepositoryListItemContextMenuConfig
): ReadonlyArray<IMenuItem> => {
  const { repository, onCreateWorktree, onShowWorktrees } = config

  if (!(repository instanceof Repository)) {
    return []
  }

  if (onCreateWorktree === undefined && onShowWorktrees === undefined) {
    return []
  }

  const items: Array<IMenuItem> = []

  if (onShowWorktrees !== undefined) {
    items.push({
      label: __DARWIN__
        ? t(
            'repository-list-item-context-menu.show-worktrees-darwin',
            'Show Worktrees'
          )
        : t(
            'repository-list-item-context-menu.show-worktrees',
            'Show worktrees'
          ),
      action: () => onShowWorktrees(repository),
    })
  }

  if (onCreateWorktree !== undefined) {
    items.push({
      label: __DARWIN__
        ? t(
            'repository-list-item-context-menu.new-worktree-darwin',
            'New Worktree…'
          )
        : t('repository-list-item-context-menu.new-worktree', 'New worktree…'),
      action: () => onCreateWorktree(repository),
    })
  }

  return items
}

/**
 * Build the Account submenu used to reassign a repository to another
 * signed-in account on its endpoint.
 *
 * The submenu is omitted when there is nothing to choose between: when the
 * repository is assigned and its endpoint has only one retained account
 * identity, or when it's unassigned and no account is signed in on its
 * endpoint. An assigned account that has been signed out is still listed
 * (checked and disabled) so users can see the current association.
 */
const buildAccountMenuItems = (
  config: IRepositoryListItemContextMenuConfig
): ReadonlyArray<IMenuItem> => {
  const { repository } = config

  if (
    !(repository instanceof Repository) ||
    repository.gitHubRepository === null
  ) {
    return []
  }

  const { endpoint } = repository.gitHubRepository
  const assigned = getRepositoryAccountIdentity(repository)
  const eligible = config.accounts.filter(a => a.endpoint === endpoint)
  const signedOut =
    assigned !== null && !eligible.some(a => isSameAccount(a, assigned))
  const retainedCount = eligible.length + (signedOut ? 1 : 0)

  if (assigned === null ? eligible.length === 0 : retainedCount <= 1) {
    return []
  }

  const submenu: Array<IMenuItem> = []

  if (signedOut) {
    submenu.push({
      label: `@${assigned.login} (Signed out)`,
      type: 'checkbox',
      checked: true,
      enabled: false,
    })
  }

  for (const account of eligible) {
    const checked = isSameAccount(account, assigned)
    submenu.push({
      label: `@${account.login}`,
      type: 'checkbox',
      checked,
      action: checked
        ? undefined
        : () => config.onChangeRepositoryAccount(repository, account.login),
    })
  }

  return [{ label: 'Account', submenu }]
}

const buildRepositorySettingsMenuItems = (
  config: IRepositoryListItemContextMenuConfig
): ReadonlyArray<IMenuItem> => {
  const { repository } = config

  if (!(repository instanceof Repository) || repository.missing) {
    return []
  }

  return [
    {
      label: __DARWIN__ ? 'Repository Settings…' : 'Repository settings…',
      action: () => config.onShowRepositorySettings(repository),
    },
  ]
}
