import { spawn, SpawnOptions } from 'child_process'
import { t } from 'i18next'
import { pathExists } from '../../ui/lib/path-exists'
import { ExternalEditorError, FoundEditor } from './shared'
import {
  expandTargetPathArgument,
  ICustomIntegration,
  parseCustomIntegrationArguments,
  spawnCustomIntegration,
} from '../custom-integration'

/**
 * Open a given file or folder in the desired external editor.
 *
 * @param fullPath A folder or file path to pass as an argument when launching the editor.
 * @param editor The external editor to launch.
 */
export async function launchExternalEditor(
  fullPath: string,
  editor: FoundEditor
): Promise<void> {
  const editorPath = editor.path
  const exists = await pathExists(editorPath)
  const label = __DARWIN__
    ? t('common.setting', 'Settings')
    : t('common.options', 'Options')
  if (!exists) {
    throw new ExternalEditorError(
      t(
        'launch.error.could-not-find-executable',
        `Could not find executable for '{{0}}' at path '{{1}}'.
       Please open {{2}} and select an available editor.`,
        { 0: editor.editor, 1: editor.path, 2: label }
      ),
      { openPreferences: true }
    )
  }

  const opts: SpawnOptions = {
    // Make sure the editor processes are detached from the Desktop app.
    // Otherwise, some editors (like Notepad++) will be killed when the
    // Desktop app is closed.
    detached: true,
  }

  try {
    if (__DARWIN__) {
      // In macOS we can use `open`, which will open the right executable file
      // for us, we only need the path to the editor .app folder.
      spawn('open', ['-a', editorPath, fullPath], opts)
    } else if (__WIN32__) {
      spawn(`"${editorPath}"`, [`"${fullPath}"`], { ...opts, shell: true })
    } else {
      spawn(editorPath, [fullPath], opts)
    }
  } catch (error) {
    log.error(`Error while launching ${editor.editor}`, error)
    if (error?.code === 'EACCES') {
      throw new ExternalEditorError(
        t(
          'launch.error.donot-have-the-permission-to-start',
          `GitHub Desktop doesn't have the proper permissions to start '{{0}}'. Please open {{1}} and try another editor.`,
          { 0: editor.editor, 1: label }
        ),
        { openPreferences: true }
      )
    } else {
      throw new ExternalEditorError(
        t(
          'launch.error.something-went-wrong-to-start',
          `Something went wrong while trying to start '{{0}}'. Please open {{1}} and try another editor.`,
          { 0: editor.editor, 1: label }
        ),
        { openPreferences: true }
      )
    }
  }
}

/**
 * Open a given file or folder in the desired custom external editor.
 *
 * @param fullPath A folder or file path to pass as an argument when launching the editor.
 * @param customEditor The external editor to launch.
 */
export async function launchCustomExternalEditor(
  fullPath: string,
  customEditor: ICustomIntegration
): Promise<void> {
  const editorPath = customEditor.path
  const exists = await pathExists(editorPath)
  const label = __DARWIN__
    ? t('common.setting', 'Settings')
    : t('common.options', 'Options')
  if (!exists) {
    throw new ExternalEditorError(
      t(
        'launch.error.could-not-find-executable-for-custom-editor',
        `Could not find executable for custom editor at path '{{0}}'. Please open {{1}} and select an available editor.`,
        { 0: customEditor.path, 1: label }
      ),
      { openPreferences: true }
    )
  }

  const opts: SpawnOptions = {
    // Make sure the editor processes are detached from the Desktop app.
    // Otherwise, some editors (like Notepad++) will be killed when the
    // Desktop app is closed.
    detached: true,
  }

  const argv = parseCustomIntegrationArguments(customEditor.arguments)

  // Replace instances of RepoPathArgument with fullPath in customEditor.arguments
  const args = expandTargetPathArgument(argv, fullPath)

  try {
    if (__DARWIN__ && customEditor.bundleID) {
      // In macOS we can use `open` if it's an app (i.e. if we have a bundleID),
      // which will open the right executable file for us, we only need the path
      // to the editor .app folder.
      spawnCustomIntegration('open', ['-a', editorPath, ...args], opts)
    } else {
      spawnCustomIntegration(editorPath, args, opts)
    }
  } catch (error) {
    log.error(
      `Error while launching custom editor at path ${customEditor.path} with arguments ${args}`,
      error
    )
    if (error?.code === 'EACCES') {
      throw new ExternalEditorError(
        t(
          'launch.error.donot-have-the-permission-to-start-custom-editor',
          `GitHub Desktop doesn't have the proper permissions to start custom editor at path {{0}}. Please open {{1}} and try another editor.`,
          { 0: customEditor.path, 1: label }
        ),
        { openPreferences: true }
      )
    } else {
      throw new ExternalEditorError(
        t(
          'launch.error.something-went-wrong-to-start-custom-editor',
          `Something went wrong while trying to start custom editor at path {{0}}. Please open {{1}} and try another editor.`,
          { 0: customEditor.path, 1: label }
        ),
        { openPreferences: true }
      )
    }
  }
}
