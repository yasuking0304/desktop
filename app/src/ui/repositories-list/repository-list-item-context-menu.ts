import { Repository } from '../../models/repository'
import { IMenuItem } from '../../lib/menu-item'
import { Repositoryish } from './group-repositories'
import { clipboard } from 'electron'
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
  onViewOnGitHub: (repository: Repositoryish) => void
  onOpenInShell: (repository: Repositoryish) => void
  onShowRepository: (repository: Repositoryish) => void
  onOpenInExternalEditor: (repository: Repositoryish) => void
  onRemoveRepository: (repository: Repositoryish) => void
  onChangeRepositoryAlias: (repository: Repository) => void
  onRemoveRepositoryAlias: (repository: Repository) => void
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
      action: () => clipboard.writeText(repository.name),
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
      action: () => clipboard.writeText(repository.path),
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
