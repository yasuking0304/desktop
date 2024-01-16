import i18n from 'i18next'
import { getLocale } from './i18locale'

import deLang from './json/lang_de.json'
import enLang from './json/lang_en.json'
import esLang from './json/lang_es.json'
import frLang from './json/lang_fr.json'
import itLang from './json/lang_it.json'
import jaLang from './json/lang_ja.json'
import koLang from './json/lang_ko.json'
import nlLang from './json/lang_nl.json'
import ptLang from './json/lang_pt.json'
import ptBrLang from './json/lang_pt-br.json'
import roLang from './json/lang_ro.json'
import ruLang from './json/lang_ru.json'
import svLang from './json/lang_sv.json'
import zhLang from './json/lang_zh.json'
import zhHantLang from './json/lang_zh-hant.json'

i18n.init({
  lng: getLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
  resources: {
    de: { translation: deLang },
    en: { translation: enLang },
    es: { translation: esLang },
    fr: { translation: frLang },
    it: { translation: itLang },
    ja: { translation: jaLang },
    ko: { translation: koLang },
    nl: { translation: nlLang },
    pt: { translation: ptLang },
    'pt-br': { translation: ptBrLang },
    ro: { translation: roLang },
    ru: { translation: ruLang },
    sv: { translation: svLang },
    zh: { translation: zhLang },
    'zh-hant': { translation: zhHantLang },
  },
})

/**
 * Get getLanguage.
 * Support langage:
 * 'de', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'nl', 'pt', 'pt-br', 'ro', 'ru',
 * 'sv', 'zh', 'zh-cn', 'zh-hk', 'zh-tw'
 */
function getLanguage(): string {
  let lang = ''
  const langFull = getLocale().toLocaleLowerCase()
  const langShort = langFull.split('-')[0]
  if (langFull === 'zh-hk' || langFull === 'zh-tw') {
    lang = 'zh-hant'
  } else if (langFull === 'pt-br') {
    lang = 'pt-br'
  } else {
    lang = langShort
  }
  return lang
}
