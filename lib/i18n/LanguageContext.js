'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { en } from './translations/en'
import { fr } from './translations/fr'

const dictionaries = { en, fr }
const STORAGE_KEY = 'artydrop_lang'

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
})

function detectInitialLang() {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'fr') return stored
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

// Looks up "a.b.c" inside the dictionary object; falls back to English,
// then to the key itself if truly missing (never crashes on a missing string).
function lookup(dict, key) {
  const value = key.split('.').reduce((obj, part) => obj?.[part], dict)
  return typeof value === 'string' ? value : undefined
}

function lookupRaw(dict, key) {
  return key.split('.').reduce((obj, part) => obj?.[part], dict)
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en')

  useEffect(() => {
    setLangState(detectInitialLang())
  }, [])

  const setLang = useCallback((next) => {
    setLangState(next)
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const t = useCallback((key, vars) => {
    let str = lookup(dictionaries[lang], key) ?? lookup(dictionaries.en, key) ?? key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replaceAll(`{${k}}`, v)
      })
    }
    return str
  }, [lang])

  // For array data (FAQ lists, feature lists) that t()'s string-only lookup can't return.
  const tList = useCallback((key) => {
    const value = lookupRaw(dictionaries[lang], key) ?? lookupRaw(dictionaries.en, key)
    return Array.isArray(value) ? value : []
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tList }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
