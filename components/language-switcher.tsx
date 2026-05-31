"use client"

import { useI18n } from "@/lib/i18n/locale-context"
import type { Locale } from "@/lib/i18n/types"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  compact?: boolean
}

export function LanguageSwitcher({ className, compact }: Props) {
  const { locale, setLocale, t } = useI18n()

  const btn = (code: Locale, label: string) => (
    <button
      type="button"
      onClick={() => setLocale(code)}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        locale === code
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      aria-pressed={locale === code}
      aria-label={`${t("common.language")}: ${label}`}
    >
      {code.toUpperCase()}
    </button>
  )

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border/70 bg-muted/40 p-0.5",
        className
      )}
      role="group"
      aria-label={t("common.language")}
    >
      {!compact && (
        <span className="hidden px-2 text-xs text-muted-foreground sm:inline">
          {t("common.language")}
        </span>
      )}
      {btn("de", t("common.german"))}
      {btn("en", t("common.english"))}
    </div>
  )
}
