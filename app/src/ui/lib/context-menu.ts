import { t } from 'i18next'

const RestrictedFileExtensions = ['.cmd', '.exe', '.bat', '.sh']
export const CopyFilePathLabel = __DARWIN__
  ? t('menu.copy-file-path-darwin', 'Copy File Path')
  : t('menu.copy-file-path', 'Copy file path')

export const CopyRelativeFilePathLabel = __DARWIN__
  ? t('menu.copy-relative-file-path-darwin', 'Copy Relative File Path')
  : t('menu.copy-relative-file-path', 'Copy relative file path')

export const CopySelectedPathsLabel = __DARWIN__
  ? t('menu.copy-files-darwin', 'Copy Paths')
  : t('menu.copy-files', 'Copy paths')

export const CopySelectedRelativePathsLabel = __DARWIN__
  ? t('menu.copy-relative-paths-darwin', 'Copy Relative Paths')
  : t('menu.copy-relative-paths', 'Copy relative paths')

export const DefaultEditorLabel = __DARWIN__
  ? t('menu.context-open-in-external-editor-darwin', 'Open in External Editor')
  : t('menu.context-open-in-external-editor', 'Open in external editor')

export const DefaultShellLabel = __DARWIN__ ? 'Open in Shell' : 'Open in shell'

export const RevealInFileManagerLabel = __DARWIN__
  ? t('menu.show-in-finger', 'Reveal in Finder')
  : __WIN32__
  ? t('menu.show-in-explorer', 'Show in Explorer')
  : t('menu.show-in-file-manager', 'Show in your File Manager')

export const TrashNameLabel = __WIN32__
  ? t('menu.recycle-bin', 'Recycle Bin')
  : t('menu.trash', 'Trash')

export const OpenWithDefaultProgramLabel = __DARWIN__
  ? t('menu.open-default-program-darwin', 'Open with Default Program')
  : t('menu.open-default-program', 'Open with default program')

export function isSafeFileExtension(extension: string): boolean {
  if (__WIN32__) {
    return RestrictedFileExtensions.indexOf(extension.toLowerCase()) === -1
  }
  return true
}
