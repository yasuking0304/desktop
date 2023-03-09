import { IMenuItem } from '../../lib/menu-item'
import { clipboard } from 'electron'
import { t } from 'i18next'

interface IBranchContextMenuConfig {
  name: string
  isLocal: boolean
  onRenameBranch?: (branchName: string) => void
  onDeleteBranch?: (branchName: string) => void
}

export function generateBranchContextMenuItems(
  config: IBranchContextMenuConfig
): IMenuItem[] {
  const { name, isLocal, onRenameBranch, onDeleteBranch } = config
  const items = new Array<IMenuItem>()

  if (onRenameBranch !== undefined) {
    items.push({
      label: t('menu.confirm-rename', 'Rename…'),
      action: () => onRenameBranch(name),
      enabled: isLocal,
    })
  }

  items.push({
    label: __DARWIN__
      ? t('menu.copy-branch-name-darwin', 'Copy Branch Name')
      : t('menu.copy-branch-name', 'Copy branch name'),
    action: () => clipboard.writeText(name),
  })

  items.push({ type: 'separator' })

  if (onDeleteBranch !== undefined) {
    items.push({
      label: t('menu.confirm-delete', 'Delete…'),
      action: () => onDeleteBranch(name),
    })
  }

  return items
}
