import { Menu, shell, app, BrowserWindow } from 'electron'
import { ensureItemIds } from './ensure-item-ids'
import { MenuEvent } from './menu-event'
import { truncateWithEllipsis } from '../../lib/truncate-with-ellipsis'
import { getLogDirectoryPath } from '../../lib/logging/get-log-path'
import { UNSAFE_openDirectory } from '../shell'
import { MenuLabelsEvent } from '../../models/menu-labels'
import * as ipcWebContents from '../ipc-webcontents'
import { mkdir } from 'fs/promises'
import { t } from 'i18next'

const platformDefaultShell = __WIN32__
  ? t('menu.shell', 'Command Prompt')
  : t('menu.shell-linux', 'Terminal')
const createPullRequestLabel = __DARWIN__
  ? t('menu.create-pull-request-darwin', 'Create Pull Request')
  : t('menu.create-pull-request', 'Create &pull request')
const showPullRequestLabel = __DARWIN__
  ? t('menu.view-pull-request-darwin', 'View Pull Request on GitHub')
  : t('menu.view-pull-request', 'View &pull request on GitHub')
const defaultBranchNameValue = __DARWIN__
  ? t('menu.default-branch-darwin', 'Default Branch')
  : t('menu.default-branch', 'default branch')
const confirmRepositoryRemovalLabel = __DARWIN__
  ? t('menu.confirm-remove-darwin', 'Remove…')
  : t('menu.confirm-remove', '&Remove…')
const repositoryRemovalLabel = __DARWIN__
  ? t('menu.remove-darwin', 'Remove')
  : t('menu.remove', '&Remove')
const confirmStashAllChangesLabel = __DARWIN__
  ? t('menu.confirm-stash-all-changes-darwin', 'Stash All Changes…')
  : t('menu.confirm-stash-all-changes', '&Stash all changes…')
const stashAllChangesLabel = __DARWIN__
  ? t('menu.stash-all-changes-darwin', 'Stash All Changes')
  : t('menu.stash-all-changes', '&Stash all changes')

enum ZoomDirection {
  Reset,
  In,
  Out,
}

export function buildDefaultMenu({
  selectedExternalEditor,
  selectedShell,
  askForConfirmationOnForcePush,
  askForConfirmationOnRepositoryRemoval,
  hasCurrentPullRequest = false,
  contributionTargetDefaultBranch = defaultBranchNameValue,
  isForcePushForCurrentRepository = false,
  isStashedChangesVisible = false,
  askForConfirmationWhenStashingAllChanges = true,
}: MenuLabelsEvent): Electron.Menu {
  contributionTargetDefaultBranch = truncateWithEllipsis(
    contributionTargetDefaultBranch,
    25
  )

  const removeRepoLabel = askForConfirmationOnRepositoryRemoval
    ? confirmRepositoryRemovalLabel
    : repositoryRemovalLabel

  const pullRequestLabel = hasCurrentPullRequest
    ? showPullRequestLabel
    : createPullRequestLabel

  const template = new Array<Electron.MenuItemConstructorOptions>()
  const separator: Electron.MenuItemConstructorOptions = { type: 'separator' }

  if (__DARWIN__) {
    template.push({
      label: t('common.github-desktop', 'GitHub Desktop'),
      submenu: [
        {
          label: t('common.about-github-desktop', 'About GitHub Desktop'),
          click: emit('show-about'),
          id: 'about',
        },
        separator,
        {
          label: t('menu.preferences', 'Settings…'),
          id: 'preferences',
          accelerator: 'CmdOrCtrl+,',
          click: emit('show-preferences'),
        },
        separator,
        {
          label: t(
            'menu.install-command-line-tool',
            'Install Command Line Tool…'
          ),
          id: 'install-cli',
          click: emit('install-darwin-cli'),
        },
        separator,
        {
          role: 'services',
          label: t('menu.services', 'services'),
          submenu: [],
        },
        separator,
        { role: 'hide', label: t('menu.hide', 'Hide GitHub Desktop') },
        {
          role: 'hideOthers',
          label: t('menu.hide-others', 'Hide Others'),
        },
        { role: 'unhide', label: t('menu.show-all', 'Show All') },
        separator,
        { role: 'quit', label: t('menu.quit', 'Quit GitHub Desktop') },
      ],
    })
  }

  const fileMenu: Electron.MenuItemConstructorOptions = {
    label: __DARWIN__ ? t('menu.file-darwin', 'File') : t('menu.file', '&File'),
    submenu: [
      {
        label: __DARWIN__
          ? t('menu.new-repository-darwin', 'New Repository…')
          : t('menu.new-repository', 'New &repository…'),
        id: 'new-repository',
        click: emit('create-repository'),
        accelerator: 'CmdOrCtrl+N',
      },
      separator,
      {
        label: __DARWIN__
          ? t('menu.add-local-repository-darwin', 'Add Local Repository…')
          : t('menu.add-local-repository', 'Add &local repository…'),
        id: 'add-local-repository',
        accelerator: 'CmdOrCtrl+O',
        click: emit('add-local-repository'),
      },
      {
        label: __DARWIN__
          ? t('menu.clone-repository-darwin', 'Clone Repository…')
          : t('menu.clone-repository', 'Clo&ne repository…'),
        id: 'clone-repository',
        accelerator: 'CmdOrCtrl+Shift+O',
        click: emit('clone-repository'),
      },
    ],
  }

  if (!__DARWIN__) {
    const fileItems = fileMenu.submenu as Electron.MenuItemConstructorOptions[]

    fileItems.push(
      separator,
      {
        label: t('menu.options', '&Options…'),
        id: 'preferences',
        accelerator: 'CmdOrCtrl+,',
        click: emit('show-preferences'),
      },
      separator,
      {
        role: 'quit',
        label: t('menu.exit', 'E&xit'),
        accelerator: 'Alt+F4',
      }
    )
  }

  template.push(fileMenu)

  template.push({
    label: __DARWIN__ ? t('menu.edit-darwin', 'Edit') : t('menu.edit', '&Edit'),
    submenu: [
      {
        role: 'undo',
        label: __DARWIN__
          ? t('menu.undo-darwin', 'Undo')
          : t('menu.undo', '&Undo'),
      },
      {
        role: 'redo',
        label: __DARWIN__
          ? t('menu.redo-darwin', 'Redo')
          : t('menu.redo', '&Redo'),
      },
      separator,
      {
        role: 'cut',
        label: __DARWIN__ ? t('menu.cut-darwin', 'Cut') : t('menu.cut', 'Cu&t'),
      },
      {
        role: 'copy',
        label: __DARWIN__
          ? t('menu.copy-darwin', 'Copy')
          : t('menu.copy', '&Copy'),
      },
      {
        role: 'paste',
        label: __DARWIN__
          ? t('menu.paste-darwin', 'Paste')
          : t('menu.paste', '&Paste'),
      },
      {
        label: __DARWIN__
          ? t('menu.select-all-darwin', 'Select All')
          : t('menu.select-all', 'Select &all'),
        accelerator: 'CmdOrCtrl+A',
        click: emit('select-all'),
      },
      separator,
      {
        id: 'find',
        label: __DARWIN__
          ? t('menu.find-darwin', 'Find')
          : t('menu.find', '&Find'),
        accelerator: 'CmdOrCtrl+F',
        click: emit('find-text'),
      },
    ],
  })

  template.push({
    label: __DARWIN__ ? t('menu.view-darwin', 'View') : t('menu.view', '&View'),
    submenu: [
      {
        label: __DARWIN__
          ? t('menu.show-changes-darwin', 'Show Changes')
          : t('menu.show-changes', '&Changes'),
        id: 'show-changes',
        accelerator: 'CmdOrCtrl+1',
        click: emit('show-changes'),
      },
      {
        label: __DARWIN__
          ? t('menu.show-history-darwin', 'Show History')
          : t('menu.show-history', '&History'),
        id: 'show-history',
        accelerator: 'CmdOrCtrl+2',
        click: emit('show-history'),
      },
      {
        label: __DARWIN__
          ? t('menu.show-repository-list-darwin', 'Show Repository List')
          : t('menu.show-repository-list', 'Repository &list'),
        id: 'show-repository-list',
        accelerator: 'CmdOrCtrl+T',
        click: emit('choose-repository'),
      },
      {
        label: __DARWIN__
          ? t('menu.show-branches-list-darwin', 'Show Branches List')
          : t('menu.show-branches-list', '&Branches list'),
        id: 'show-branches-list',
        accelerator: 'CmdOrCtrl+B',
        click: emit('show-branches'),
      },
      separator,
      {
        label: __DARWIN__
          ? t('menu.go-to-summary-darwin', 'Go to Summary')
          : t('menu.go-to-summary', 'Go to &Summary'),
        id: 'go-to-commit-message',
        accelerator: 'CmdOrCtrl+G',
        click: emit('go-to-commit-message'),
      },
      {
        label: getStashedChangesLabel(isStashedChangesVisible),
        id: 'toggle-stashed-changes',
        accelerator: 'Ctrl+H',
        click: isStashedChangesVisible
          ? emit('hide-stashed-changes')
          : emit('show-stashed-changes'),
      },
      {
        label: __DARWIN__
          ? t('menu.toggle-full-screen-darwin', 'Toggle Full Screen')
          : t('menu.toggle-full-screen', 'Toggle &full screen'),
        role: 'togglefullscreen',
      },
      separator,
      {
        label: __DARWIN__
          ? t('menu.reset-zoom-darwin', 'Reset Zoom')
          : t('menu.reset-zoom', 'Reset zoom'),
        accelerator: 'CmdOrCtrl+0',
        click: zoom(ZoomDirection.Reset),
      },
      {
        label: __DARWIN__
          ? t('menu.zoom-in-darwin', 'Zoom In')
          : t('menu.zoom-in', 'Zoom in'),
        accelerator: 'CmdOrCtrl+=',
        click: zoom(ZoomDirection.In),
      },
      {
        label: __DARWIN__
          ? t('menu.zoom-out-darwin', 'Zoom Out')
          : t('menu.zoom-out', 'Zoom out'),
        accelerator: 'CmdOrCtrl+-',
        click: zoom(ZoomDirection.Out),
      },
      {
        label: __DARWIN__
          ? t('menu.expand-active-resizable-darwin', 'Expand Active Resizable')
          : t('menu.expand-active-resizable', 'Expand active resizable'),
        id: 'increase-active-resizable-width',
        accelerator: 'CmdOrCtrl+9',
        click: emit('increase-active-resizable-width'),
      },
      {
        label: __DARWIN__
          ? t(
              'menu.contract-active-resizable-darwin',
              'Contract Active Resizable'
            )
          : t('menu.contract-active-resizable', 'Contract active resizable'),
        id: 'decrease-active-resizable-width',
        accelerator: 'CmdOrCtrl+8',
        click: emit('decrease-active-resizable-width'),
      },
      separator,
      {
        label: t('menu.reload-darwin', '&Reload'),
        id: 'reload-window',
        // Ctrl+Alt is interpreted as AltGr on international keyboards and this
        // can clash with other shortcuts. We should always use Ctrl+Shift for
        // chorded shortcuts, but this menu item is not a user-facing feature
        // so we are going to keep this one around.
        accelerator: 'CmdOrCtrl+Alt+R',
        click(item: any, focusedWindow: Electron.BrowserWindow | undefined) {
          if (focusedWindow) {
            focusedWindow.reload()
          }
        },
        visible: __RELEASE_CHANNEL__ === 'development',
      },
      {
        id: 'show-devtools',
        label: __DARWIN__
          ? t('menu.toggle-developer-tools-darwin', 'Toggle Developer Tools')
          : t('menu.toggle-developer-tools', '&Toggle developer tools'),
        accelerator: (() => {
          return __DARWIN__ ? 'Alt+Command+I' : 'Ctrl+Shift+I'
        })(),
        click(item: any, focusedWindow: Electron.BrowserWindow | undefined) {
          if (focusedWindow) {
            focusedWindow.webContents.toggleDevTools()
          }
        },
      },
    ],
  })

  const pushLabel = getPushLabel(
    isForcePushForCurrentRepository,
    askForConfirmationOnForcePush
  )

  const pushEventType = isForcePushForCurrentRepository ? 'force-push' : 'push'

  template.push({
    label: __DARWIN__
      ? t('menu.repository-darwin', 'Repository')
      : t('menu.repository', '&Repository'),
    id: 'repository',
    submenu: [
      {
        id: 'push',
        label: pushLabel,
        accelerator: 'CmdOrCtrl+P',
        click: emit(pushEventType),
      },
      {
        id: 'pull',
        label: __DARWIN__
          ? t('menu.pull-darwin', 'Pull')
          : t('menu.pull', 'Pu&ll'),
        accelerator: 'CmdOrCtrl+Shift+P',
        click: emit('pull'),
      },
      {
        id: 'fetch',
        label: __DARWIN__
          ? t('menu.fetch-darwin', 'Fetch')
          : t('menu.fetch', '&Fetch'),
        accelerator: 'CmdOrCtrl+Shift+T',
        click: emit('fetch'),
      },
      {
        label: removeRepoLabel,
        id: 'remove-repository',
        accelerator: 'CmdOrCtrl+Backspace',
        click: emit('remove-repository'),
      },
      separator,
      {
        id: 'view-repository-on-github',
        label: __DARWIN__
          ? t('menu.view-on-github-darwin', 'View on GitHub')
          : t('menu.view-on-github', '&View on GitHub'),
        accelerator: 'CmdOrCtrl+Shift+G',
        click: emit('view-repository-on-github'),
      },
      {
        label: __DARWIN__
          ? t('menu.open-in-shell-darwin', 'Open in {{0}}', {
              0: selectedShell ?? platformDefaultShell,
            })
          : t('menu.open-in-shell', 'O&pen in {{0}}', {
              0: selectedShell ?? platformDefaultShell,
            }),
        id: 'open-in-shell',
        accelerator: 'Ctrl+`',
        click: emit('open-in-shell'),
      },
      {
        label: __DARWIN__
          ? t('menu.open-working-directory-darwin', 'Show in Finder')
          : __WIN32__
          ? t('menu.open-working-directory', 'Show in E&xplorer')
          : t('menu.open-working-directory-linux', 'Show in your File Manager'),
        id: 'open-working-directory',
        accelerator: 'CmdOrCtrl+Shift+F',
        click: emit('open-working-directory'),
      },
      {
        label: __DARWIN__
          ? t('menu.open-in-external-editor-darwin', `Open in {{0}}`, {
              0: selectedExternalEditor ?? 'External Editor',
            })
          : t('menu.open-in-external-editor', `&Open in {{0}}`, {
              0: selectedExternalEditor ?? 'external editor',
            }),
        id: 'open-external-editor',
        accelerator: 'CmdOrCtrl+Shift+A',
        click: emit('open-external-editor'),
      },
      separator,
      {
        id: 'create-issue-in-repository-on-github',
        label: __DARWIN__
          ? t('menu.create-issue-on-github-darwin', 'Create Issue on GitHub')
          : t('menu.create-issue-on-github', 'Create &issue on GitHub'),
        accelerator: 'CmdOrCtrl+I',
        click: emit('create-issue-in-repository-on-github'),
      },
      separator,
      {
        label: __DARWIN__
          ? t('menu.repository-settings-darwin', 'Repository Settings…')
          : t('menu.repository-settings', 'Repository &settings…'),
        id: 'show-repository-settings',
        click: emit('show-repository-settings'),
      },
    ],
  })

  const branchSubmenu = [
    {
      label: __DARWIN__
        ? t('menu.new-create-branch-darwin', 'New Branch…')
        : t('menu.new-create-branch', 'New &branch…'),
      id: 'create-branch',
      accelerator: 'CmdOrCtrl+Shift+N',
      click: emit('create-branch'),
    },
    {
      label: __DARWIN__
        ? t('menu.rename-branch-darwin', 'Rename…')
        : t('menu.rename-branch', '&Rename…'),
      id: 'rename-branch',
      accelerator: 'CmdOrCtrl+Shift+R',
      click: emit('rename-branch'),
    },
    {
      label: __DARWIN__
        ? t('menu.delete-branch-darwin', 'Delete…')
        : t('menu.delete-branch', '&Delete…'),
      id: 'delete-branch',
      accelerator: 'CmdOrCtrl+Shift+D',
      click: emit('delete-branch'),
    },
    separator,
    {
      label: __DARWIN__
        ? t('menu.discard-all-changes-darwin', 'Discard All Changes…')
        : t('menu.discard-all-changes', 'Discard all changes…'),
      id: 'discard-all-changes',
      accelerator: 'CmdOrCtrl+Shift+Backspace',
      click: emit('discard-all-changes'),
    },
    {
      label: askForConfirmationWhenStashingAllChanges
        ? confirmStashAllChangesLabel
        : stashAllChangesLabel,
      id: 'stash-all-changes',
      accelerator: 'CmdOrCtrl+Shift+S',
      click: emit('stash-all-changes'),
    },
    separator,
    {
      label: __DARWIN__
        ? t('menu.update-branch-from-darwin', `Update from {{0}}`, {
            0: contributionTargetDefaultBranch,
          })
        : t('menu.update-branch-from', `&Update from {{0}}`, {
            0: contributionTargetDefaultBranch,
          }),
      id: 'update-branch-with-contribution-target-branch',
      accelerator: 'CmdOrCtrl+Shift+U',
      click: emit('update-branch-with-contribution-target-branch'),
    },
    {
      label: __DARWIN__
        ? t('menu.compare-to-branch-darwin', 'Compare to Branch')
        : t('menu.compare-to-branch', '&Compare to branch'),
      id: 'compare-to-branch',
      accelerator: 'CmdOrCtrl+Shift+B',
      click: emit('compare-to-branch'),
    },
    {
      label: __DARWIN__
        ? t('menu.merge-into-branch-darwin', 'Merge into Current Branch…')
        : t('menu.merge-into-branch', '&Merge into current branch…'),
      id: 'merge-branch',
      accelerator: 'CmdOrCtrl+Shift+M',
      click: emit('merge-branch'),
    },
    {
      label: __DARWIN__
        ? t(
            'menu.squash-and-merge-into-branch-darwin',
            'Squash and Merge into Current Branch…'
          )
        : t(
            'menu.squash-and-merge-into-branch',
            'Squas&h and merge into current branch…'
          ),
      id: 'squash-and-merge-branch',
      accelerator: 'CmdOrCtrl+Shift+H',
      click: emit('squash-and-merge-branch'),
    },
    {
      label: __DARWIN__
        ? t('menu.rebase-current-branch-darwin', 'Rebase Current Branch…')
        : t('menu.rebase-current-branch', 'R&ebase current branch…'),
      id: 'rebase-branch',
      accelerator: 'CmdOrCtrl+Shift+E',
      click: emit('rebase-branch'),
    },
    separator,
    {
      label: __DARWIN__
        ? t('menu.compare-on-github-darwin', 'Compare on GitHub')
        : t('menu.compare-on-github', 'Compare on &GitHub'),
      id: 'compare-on-github',
      accelerator: 'CmdOrCtrl+Shift+C',
      click: emit('compare-on-github'),
    },
    {
      label: __DARWIN__
        ? t('menu.view-branch-on-github-darwin', 'View Branch on GitHub')
        : t('menu.view-branch-on-github', 'View branch on GitHub'),
      id: 'branch-on-github',
      accelerator: 'CmdOrCtrl+Alt+B',
      click: emit('branch-on-github'),
    },
  ]

  branchSubmenu.push({
    label: __DARWIN__
      ? t('menu.preview-pull-request-darwin', 'Preview Pull Request')
      : t('menu.preview-pull-request', 'Preview pull request'),
    id: 'preview-pull-request',
    accelerator: 'CmdOrCtrl+Alt+P',
    click: emit('preview-pull-request'),
  })

  branchSubmenu.push({
    label: pullRequestLabel,
    id: 'create-pull-request',
    accelerator: 'CmdOrCtrl+R',
    click: emit('open-pull-request'),
  })

  template.push({
    label: __DARWIN__
      ? t('menu.branch-darwin', 'Branch')
      : t('menu.branch', '&Branch'),
    id: 'branch',
    submenu: branchSubmenu,
  })

  if (__DARWIN__) {
    template.push({
      role: 'window',
      label: t('menu.window-darwin', 'Window'),
      submenu: [
        { role: 'minimize', label: t('menu.minimize-darwin', 'Minimize') },
        { role: 'zoom', label: t('menu.zoom-darwin', 'Zoom') },
        { role: 'close', label: t('menu.close-darwin', 'close Window') },
        separator,
        { role: 'front', label: t('menu.front-darwin', 'Bring All to Front') },
      ],
    })
  }

  const submitIssueItem: Electron.MenuItemConstructorOptions = {
    label: __DARWIN__
      ? t('menu.report-issue-darwin', 'Report Issue…')
      : t('menu.report-issue', 'Report issue…'),
    click() {
      shell
        .openExternal(
          __LINUX__
            ? t(
                'url.github-desktop-issue-linux',
                'https://github.com/yasuking0304/desktop/issues/new/choose'
              )
            : t(
                'url.github-desktop-issue',
                'https://github.com/yasuking0304/desktop/issues/new/choose'
              )
        )
        .catch(err => log.error('Failed opening issue creation page', err))
    },
  }

  const contactSupportItem: Electron.MenuItemConstructorOptions = {
    label: __DARWIN__
      ? t('menu.contact-github-support-darwin', 'Contact GitHub Support…')
      : t('menu.contact-github-support', '&Contact GitHub support…'),
    click() {
      shell
        .openExternal(
          `https://github.com/contact?from_desktop_app=1&app_version=${app.getVersion()}`
        )
        .catch(err => log.error('Failed opening contact support page', err))
    },
  }

  const showUserGuides: Electron.MenuItemConstructorOptions = {
    label: t('menu.show-user-guides', 'Show User Guides'),
    click() {
      shell
        .openExternal(
          t('url.show-user-guides', 'https://docs.github.com/en/desktop')
        )
        .catch(err => log.error('Failed opening user guides page', err))
    },
  }

  const showKeyboardShortcuts: Electron.MenuItemConstructorOptions = {
    label: __DARWIN__
      ? t('menu.show-keyboard-shortcuts-darwin', 'Show Keyboard Shortcuts')
      : t('menu.show-keyboard-shortcuts', 'Show keyboard shortcuts'),
    click() {
      shell
        .openExternal(
          t(
            'url.keyboard-shortcuts',
            'https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/overview/keyboard-shortcuts'
          )
        )
        .catch(err => log.error('Failed opening keyboard shortcuts page', err))
    },
  }

  const showLogsLabel = __DARWIN__
    ? t('menu.show-logs-in-finder-darwin', 'Show Logs in Finder')
    : __WIN32__
    ? t('menu.show-logs-in-finder', 'S&how logs in Explorer')
    : t('menu.show-logs-in-finder-linux', 'S&how logs in your File Manager')

  const showLogsItem: Electron.MenuItemConstructorOptions = {
    label: showLogsLabel,
    click() {
      const logPath = getLogDirectoryPath()
      mkdir(logPath, { recursive: true })
        .then(() => UNSAFE_openDirectory(logPath))
        .catch(err => log.error('Failed opening logs directory', err))
    },
  }

  const helpItems = [
    submitIssueItem,
    contactSupportItem,
    showUserGuides,
    showKeyboardShortcuts,
    showLogsItem,
  ]

  if (__DEV__) {
    helpItems.push(
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
        label: t('menu.show-popup', 'Show popup'),
        submenu: [
          {
            label: t('menu.release-notes', 'Release notes'),
            click: emit('show-release-notes-popup'),
          },
          {
            label: t('menu.thank-you', 'Thank you'),
            click: emit('show-thank-you-popup'),
          },
          {
            label: t('menu.pull-request-check-run-failed', 'Show App Error'),
            click: emit('show-app-error'),
          },
          {
            label: 'Octicons',
            click: emit('show-icon-test-dialog'),
          },
        ],
      },
      {
        label: 'Prune branches',
        click: emit('test-prune-branches'),
      }
    )
  }

  if (__RELEASE_CHANNEL__ === 'development' || __RELEASE_CHANNEL__ === 'test') {
    if (__WIN32__) {
      helpItems.push(separator, {
        label: 'Command Line Tool',
        submenu: [
          {
            label: 'Install',
            click: emit('install-windows-cli'),
          },
          {
            label: 'Uninstall',
            click: emit('uninstall-windows-cli'),
          },
        ],
      })
    }

    helpItems.push(
      {
        label: t('menu.show-notification', 'Show notification'),
        click: emit('test-show-notification'),
      },
      {
        label: t('menu.show-banner', 'Show banner'),
        submenu: [
          {
            label: 'Update banner',
            click: emit('show-update-banner'),
          },
          {
            label: `Showcase Update banner`,
            click: emit('show-showcase-update-banner'),
          },
          {
            label: `${__DARWIN__ ? 'Apple silicon' : 'Arm64'} banner`,
            click: emit('show-arm64-banner'),
          },
          {
            label: 'Thank you',
            click: emit('show-thank-you-banner'),
          },
          {
            label: 'Reorder Successful',
            click: emit('show-test-reorder-banner'),
          },
          {
            label: 'Reorder Undone',
            click: emit('show-test-undone-banner'),
          },
          {
            label: 'Cherry Pick Conflicts',
            click: emit('show-test-cherry-pick-conflicts-banner'),
          },
          {
            label: 'Merge Successful',
            click: emit('show-test-merge-successful-banner'),
          },
        ],
      }
    )
  }

  if (__DARWIN__) {
    template.push({
      role: 'help',
      label: t('menu.help-darwin', 'Help'),
      submenu: helpItems,
    })
  } else {
    template.push({
      label: t('menu.help', '&Help'),
      submenu: [
        ...helpItems,
        separator,
        {
          label: t('label.about-github-desktop', '&About GitHub Desktop'),
          click: emit('show-about'),
          id: 'about',
        },
      ],
    })
  }

  ensureItemIds(template)

  return Menu.buildFromTemplate(template)
}

function getPushLabel(
  isForcePushForCurrentRepository: boolean,
  askForConfirmationOnForcePush: boolean
): string {
  if (!isForcePushForCurrentRepository) {
    return __DARWIN__ ? t('menu.push-darwin', 'Push') : t('menu.push', 'P&ush')
  }

  if (askForConfirmationOnForcePush) {
    return __DARWIN__
      ? t('menu.confirm-force-push-darwin', 'Force Push…')
      : t('menu.confirm-force-push', 'Force P&ush…')
  }

  return __DARWIN__
    ? t('menu.force-push-darwin', 'Force Push')
    : t('menu.force-push', 'Force P&ush')
}

function getStashedChangesLabel(isStashedChangesVisible: boolean): string {
  if (isStashedChangesVisible) {
    return __DARWIN__
      ? t('label.hide-stashed-changes-darwin', 'Hide Stashed Changes')
      : t('label.hide-stashed-changes', 'H&ide stashed changes')
  }

  return __DARWIN__
    ? t('label.show-stashed-changes-darwin', 'Show Stashed Changes')
    : t('label.show-stashed-changes', 'Sho&w stashed changes')
}

type ClickHandler = (
  menuItem: Electron.MenuItem,
  browserWindow: Electron.BrowserWindow | undefined,
  event: Electron.KeyboardEvent
) => void

/**
 * Utility function returning a Click event handler which, when invoked, emits
 * the provided menu event over IPC.
 */
function emit(name: MenuEvent): ClickHandler {
  return (_, focusedWindow) => {
    // focusedWindow can be null if the menu item was clicked without the window
    // being in focus. A simple way to reproduce this is to click on a menu item
    // while in DevTools. Since Desktop only supports one window at a time we
    // can be fairly certain that the first BrowserWindow we find is the one we
    // want.
    const window = focusedWindow ?? BrowserWindow.getAllWindows()[0]
    if (window !== undefined) {
      ipcWebContents.send(window.webContents, 'menu-event', name)
    }
  }
}

/** The zoom steps that we support, these factors must sorted */
const ZoomInFactors = [0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2]
const ZoomOutFactors = ZoomInFactors.slice().reverse()

/**
 * Returns the element in the array that's closest to the value parameter. Note
 * that this function will throw if passed an empty array.
 */
function findClosestValue(arr: Array<number>, value: number) {
  return arr.reduce((previous, current) => {
    return Math.abs(current - value) < Math.abs(previous - value)
      ? current
      : previous
  })
}

/**
 * Figure out the next zoom level for the given direction and alert the renderer
 * about a change in zoom factor if necessary.
 */
function zoom(direction: ZoomDirection): ClickHandler {
  return (menuItem, window) => {
    if (!window) {
      return
    }

    const { webContents } = window

    if (direction === ZoomDirection.Reset) {
      webContents.zoomFactor = 1
      ipcWebContents.send(webContents, 'zoom-factor-changed', 1)
    } else {
      const rawZoom = webContents.zoomFactor
      const zoomFactors =
        direction === ZoomDirection.In ? ZoomInFactors : ZoomOutFactors

      // So the values that we get from zoomFactor property are floating point
      // precision numbers from chromium, that don't always round nicely, so
      // we'll have to do a little trick to figure out which of our supported
      // zoom factors the value is referring to.
      const currentZoom = findClosestValue(zoomFactors, rawZoom)

      const nextZoomLevel = zoomFactors.find(f =>
        direction === ZoomDirection.In ? f > currentZoom : f < currentZoom
      )

      // If we couldn't find a zoom level (likely due to manual manipulation
      // of the zoom factor in devtools) we'll just snap to the closest valid
      // factor we've got.
      const newZoom = nextZoomLevel === undefined ? currentZoom : nextZoomLevel

      webContents.zoomFactor = newZoom
      ipcWebContents.send(webContents, 'zoom-factor-changed', newZoom)
    }
  }
}
