import '../../locales/i18n'
import { round } from './round'
import { t } from 'i18next'

const units = [
  t('bytes.b', 'B'),
  t('bytes.kib', 'KiB'),
  t('bytes.mib', 'MiB'),
  t('bytes.gib', 'GiB'),
  t('bytes.tib', 'TiB'),
  t('bytes.pib', 'PiB'),
  t('bytes.eib', 'EiB'),
  t('bytes.zib', 'ZiB'),
  t('bytes.yib', 'YiB'),
]
const units_linux = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

/**
 * Formats a number of bytes into a human readable string.
 *
 * This method will uses the IEC representation for orders
 * of magnitude (KiB/MiB rather than MB/KB) in order to match
 * the format that Git uses.
 *
 * Example output:
 *
 *    23 GiB
 *   -43 B
 *
 * @param bytes       - The number of bytes to reformat into human
 *                      readable form
 * @param decimals    - The number of decimals to round the result
 *                      to, defaults to zero
 * @param fixed       - Whether to always include the desired number
 *                      of decimals even though the number could be
 *                      made more compact by removing trailing zeroes.
 */
export function formatBytes(bytes: number, decimals = 0, fixed = true) {
  if (!Number.isFinite(bytes)) {
    return `${bytes}`
  }
  const unitIx = Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024))
  const value = round(bytes / Math.pow(1024, unitIx), decimals)
  if (__LINUX__) {
    return `${fixed ? value.toFixed(decimals) : value} ${units_linux[unitIx]}`
  }
  return `${fixed ? value.toFixed(decimals) : value} ${units[unitIx]}`
}
