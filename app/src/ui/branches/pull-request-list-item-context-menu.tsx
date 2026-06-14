import { IMenuItem } from '../../lib/menu-item'
import { t } from 'i18next'

interface IPullRequestContextMenuConfig {
  onViewPullRequestOnGitHub?: () => void
  onCheckoutInNewWorktree?: () => void
}

export function generatePullRequestContextMenuItems(
  config: IPullRequestContextMenuConfig
): IMenuItem[] {
  const { onViewPullRequestOnGitHub, onCheckoutInNewWorktree } = config
  const items = new Array<IMenuItem>()

  if (onViewPullRequestOnGitHub !== undefined) {
    items.push({
      label: t(
        'pull-request-list-item-context-menu.view-pull-request-on-github',
        'View Pull Request on GitHub'
      ),
      action: () => onViewPullRequestOnGitHub(),
    })
  }

  if (onCheckoutInNewWorktree !== undefined) {
    items.push({
      label: __DARWIN__
        ? t(
            'pull-request-list-item-context-menu.checkout-in-new-worktree-darwin',
            'Checkout in New Worktree…'
          )
        : t(
            'pull-request-list-item-context-menu.checkout-in-new-worktree',
            'Checkout in new worktree…'
          ),
      action: () => onCheckoutInNewWorktree(),
    })
  }

  return items
}
