import { shell } from '../../lib/app-shell'
import { Dispatcher } from '../dispatcher'
import { t } from 'i18next'

export async function openFile(
  fullPath: string,
  dispatcher: Dispatcher
): Promise<void> {
  const result = await shell.openExternal(`file://${fullPath}`)

  if (!result) {
    const error = {
      name: 'no-external-program',
      message: t(
        'open-file.unable-to-open-file',
        `Unable to open file {{0}} in an external program.
         Please check you have a program associated with this file extension`,
        { 0: fullPath }
      ),
    }
    await dispatcher.postError(error)
  }
}
