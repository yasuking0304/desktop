import mem from 'mem'
import QuickLRU from 'quick-lru'
import { getLocale } from '../locales/i18locale'
import { t } from 'i18next'

// Initializing a date formatter is expensive but formatting is relatively cheap
// so we cache them based on the locale and their options. The maxSize of a 100
// is only as an escape hatch, we don't expect to ever create more than a
// handful different formatters.
const getDateFormatter = mem(Intl.DateTimeFormat, {
  cache: new QuickLRU({ maxSize: 100 }),
  cacheKey: (...args) => JSON.stringify(args),
})

/**
 * Format a date in Intl.NumberFormat().resolvedOptions().locale,
 * customizable with Intl.DateTimeFormatOptions.
 *
 * See Intl.DateTimeFormat for more information
 */
export const formatDate = (date: Date, options: Intl.DateTimeFormatOptions) =>
  isNaN(date.valueOf())
    ? t('format-date.invalid-date', 'Invalid date')
    : getDateFormatter(getLocale(), options).format(date)
