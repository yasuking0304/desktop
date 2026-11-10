import { execFile } from './exec-file';

/**
 * Check if the GNOME button layout is similar to the macOS layout.
 */
export async function isLikeMacGnomeButtonLayout(): Promise<boolean> {
  if (!__LINUX__) {
    return false
  }

  try {
    const { stdout } = await execFile('gsettings', [
       'get', 'org.gnome.desktop.wm.preferences', 'button-layout',
    ])
    if (stdout.trim().replaceAll("'", '').endsWith(':')) {
      return true
    }
  } catch (err) {
    log.error('Failed Checking if the GNOME button layout', err)
    return false
  }
  return false
}
