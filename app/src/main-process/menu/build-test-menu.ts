import { MenuItemConstructorOptions } from 'electron'
import { enableTestMenuItems } from '../../lib/feature-flag'
import { emit, separator } from './build-default-menu'
import { t } from 'i18next'

export function buildTestMenu() {
  if (!enableTestMenuItems()) {
    return []
  }

  const testMenuItems: MenuItemConstructorOptions[] = []

  if (__WIN32__) {
    testMenuItems.push(separator, {
      label: t('menu.command-line-tool', 'Command Line Tool'),
      submenu: [
        {
          label: t('menu.install', 'Install'),
          click: emit('install-windows-cli'),
        },
        {
          label: t('menu.uninstall', 'Uninstall'),
          click: emit('uninstall-windows-cli'),
        },
      ],
    })
  }

  const errorDialogsSubmenu: MenuItemConstructorOptions[] = [
    {
      label: 'Confirm Committing Conflicted Files',
      click: emit('test-confirm-committing-conflicted-files'),
    },
    {
      label: 'Discarded Changes Will Be Unrecoverable',
      click: emit('test-discarded-changes-will-be-unrecoverable'),
    },
    {
      label: 'Do you want to fork this repository?',
      click: emit('test-do-you-want-fork-this-repository'),
    },
    {
      label: 'Newer Commits On Remote',
      click: emit('test-newer-commits-on-remote'),
    },
    {
      label: 'Files Too Large',
      click: emit('test-files-too-large'),
    },
    {
      label: 'Generic Git Authentication',
      click: emit('test-generic-git-authentication'),
    },
    {
      label: 'Invalidated Account Token',
      click: emit('test-invalidated-account-token'),
    },
  ]

  if (__DARWIN__) {
    errorDialogsSubmenu.push({
      label: 'Move to Application Folder',
      click: emit('test-move-to-application-folder'),
    })
  }

  errorDialogsSubmenu.push(
    {
      label: 'Push Rejected',
      click: emit('test-push-rejected'),
    },
    {
      label: 'Re-Authorization Required',
      click: emit('test-re-authorization-required'),
    },
    {
      label: 'Unable to Locate Git',
      click: emit('test-unable-to-locate-git'),
    },
    {
      label: 'Unable to Open External Editor',
      click: emit('test-no-external-editor'),
    },
    {
      label: 'Unable to Open Shell',
      click: emit('test-unable-to-open-shell'),
    },
    {
      label: 'Untrusted Server',
      click: emit('test-untrusted-server'),
    },
    {
      label: 'Update Existing Git LFS Filters?',
      click: emit('test-update-existing-git-lfs-filters'),
    },
    {
      label: 'Upstream Already Exists',
      click: emit('test-upstream-already-exists'),
    }
  )

  testMenuItems.push(
    separator,
    {
      label: t('menu.crash-main-process', 'Crash main process…'),
      click() {
        throw new Error('Boomtown!')
      },
    },
    {
      label: t('menu.crash-renderer-process', 'Crash renderer process…'),
      click: emit('boomtown'),
    },
    {
      label: 'Prune branches',
      click: emit('test-prune-branches'),
    },
    {
      label: t('menu.show-notification', 'Show notification'),
      click: emit('test-notification'),
    },
    {
      label: t('menu.show-popup', 'Show popup'),
      submenu: [
        {
          label: t('menu.release-notes', 'Release notes'),
          click: emit('test-release-notes-popup'),
        },
        {
          label: t('menu.thank-you', 'Thank you'),
          click: emit('test-thank-you-popup'),
        },
        {
          label: t('menu.pull-request-check-run-failed', 'Show App Error'),
          click: emit('test-app-error'),
        },
        {
          label: 'Octicons',
          click: emit('test-icons'),
        },
      ],
    },
    {
      label: t('menu.show-banner', 'Show banner'),
      submenu: [
        {
          label: 'Update banner',
          click: emit('test-update-banner'),
        },
        {
          label: 'Update banner (priority)',
          click: emit('test-prioritized-update-banner'),
        },
        {
          label: `Showcase Update banner`,
          click: emit('test-showcase-update-banner'),
        },
        {
          label: `${__DARWIN__ ? 'Apple silicon' : 'Arm64'} banner`,
          click: emit('test-arm64-banner'),
        },
        {
          label: 'Thank you',
          click: emit('test-thank-you-banner'),
        },
        {
          label: 'Reorder Successful',
          click: emit('test-reorder-banner'),
        },
        {
          label: 'Reorder Undone',
          click: emit('test-undone-banner'),
        },
        {
          label: 'Cherry Pick Conflicts',
          click: emit('test-cherry-pick-conflicts-banner'),
        },
        {
          label: 'Merge Successful',
          click: emit('test-merge-successful-banner'),
        },
        {
          label: 'OS Version No Longer Supported',
          click: emit('test-os-version-no-longer-supported'),
        },
      ],
    },
    {
      label: 'Show Error Dialogs',
      submenu: errorDialogsSubmenu,
    }
  )

  return testMenuItems
}
