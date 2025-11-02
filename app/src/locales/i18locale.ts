const locales = [
  'de',
  'en',
  'es',
  'fr',
  'it',
  'ja',
  'ko',
  'nl',
  'pt',
  'ro',
  'ru',
  'sv',
  'zh',
]

/**
 * Get Locale.
 * Support langage:
 * 'de', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'nl', 'pt', 'ro', 'ru','sv', 'zh'
 */
export function getLocale(): string {
  const langEnv = process.env.GITHUB_DESKTOP_LANG?.substring(0, 5).replace(
    /_/g,
    '-'
  )
  const langFull = langEnv || Intl.NumberFormat().resolvedOptions().locale
  const langShort = langFull.toLocaleLowerCase().split('-')[0]
  if (locales.indexOf(langShort) === -1) {
    return 'en-US'
  }
  return langFull
}
