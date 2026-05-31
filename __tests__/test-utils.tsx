import { render, type RenderOptions } from "@testing-library/react"
import type { ReactElement } from "react"
import { I18nProvider } from "@/lib/i18n/locale-context"

export function renderWithI18n(ui: ReactElement, options?: RenderOptions) {
  return render(<I18nProvider>{ui}</I18nProvider>, options)
}
