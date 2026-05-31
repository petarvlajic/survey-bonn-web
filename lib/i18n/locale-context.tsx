"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { de } from "./messages/de"
import { en } from "./messages/en"
import { getMessage } from "./get-message"
import type { Messages } from "./messages/de"
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "./types"

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (path: string) => string
  messages: Messages
}

const I18nContext = createContext<I18nContextValue | null>(null)

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  return stored === "en" ? "en" : DEFAULT_LOCALE
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setLocaleState(readStoredLocale())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    document.documentElement.lang = locale
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  }, [locale, ready])

  const messages = locale === "en" ? en : de

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
  }, [])

  const t = useCallback(
    (path: string) => getMessage(messages, path),
    [messages]
  )

  const value = useMemo(
    () => ({ locale, setLocale, t, messages }),
    [locale, setLocale, t, messages]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return ctx
}
