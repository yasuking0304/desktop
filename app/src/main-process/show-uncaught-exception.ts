import { app, dialog } from 'electron'
import { setCrashMenu } from './menu'
import { formatError } from '../lib/logging/format-error'
import { CrashWindow } from './crash-window'
import { t } from 'i18next'

let hasReportedUncaughtException = false

/** Show the uncaught exception UI. */
export function showUncaughtException(isLaunchError: boolean, error: Error) {
  log.error(formatError(error))

  if (hasReportedUncaughtException) {
    return
  }

  hasReportedUncaughtException = true

  setCrashMenu()

  const window = new CrashWindow(isLaunchError ? 'launch' : 'generic', error)

  window.onDidLoad(() => {
    window.show()
  })

  window.onFailedToLoad(async () => {
    await dialog.showMessageBox({
      type: 'error',
      title: __DARWIN__
        ? t(
            'show-uncaught-exception.unrecoverable-error-darwin',
            `Unrecoverable Error`
          )
        : t(
            'show-uncaught-exception.unrecoverable-error',
            'Unrecoverable error'
          ),
      message:
        t(
          'show-uncaught-exception.message',
          `GitHub Desktop has encountered an unrecoverable error and will need to restart.

          This has been reported to the team, but if you encounter this repeatedly please report 
          this issue to the GitHub Desktop issue tracker.

          {{0}}`,
          {0: error.stack || error.message}
        )
      })
    if (!__DEV__) {
      app.relaunch()
    }
    app.quit()
  })

  window.onClose(() => {
    if (!__DEV__) {
      app.relaunch()
    }
    app.quit()
  })

  window.load()
}
