"use client"

import { useMemo, useState } from "react"
import { X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  countActiveInGroup,
  getCardiacCheckboxGroups,
  listCheckedFilterItems,
  type CheckboxFilterKey,
} from "@/lib/cardiac-checkbox-filters"
import { useI18n } from "@/lib/i18n/locale-context"

type Props = {
  checkedKeys: Set<CheckboxFilterKey>
  onChange: (keys: Set<CheckboxFilterKey>) => void
  disabled?: boolean
}

export function AnswerCheckboxFilterPanel({ checkedKeys, onChange, disabled }: Props) {
  const { locale, t } = useI18n()
  const groups = useMemo(() => getCardiacCheckboxGroups(locale), [locale])
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const activeItems = useMemo(
    () => listCheckedFilterItems(checkedKeys, locale),
    [checkedKeys, locale]
  )

  const toggle = (key: CheckboxFilterKey, on: boolean) => {
    const next = new Set(checkedKeys)
    if (on) {
      next.add(key)
      const groupId = groups.find((g) => g.items.some((i) => i.key === key))?.id
      if (groupId && !openGroups.includes(groupId)) {
        setOpenGroups((prev) => [...prev, groupId])
      }
    } else {
      next.delete(key)
    }
    onChange(next)
  }

  const clearAll = () => {
    onChange(new Set())
    setOpenGroups([])
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("filters.andHint")}</p>

      {activeItems.length > 0 ? (
        <div className="rounded-md border border-primary/30 bg-primary/10 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground">
              {t("filters.activeTitle")} ({activeItems.length})
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={disabled}
              onClick={clearAll}
            >
              {t("filters.clearAll")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeItems.map((item) => (
              <Badge
                key={item.key}
                variant="secondary"
                className="gap-1 pr-1 font-normal max-w-full"
              >
                <span className="truncate" title={`${item.groupTitle}: ${item.label}`}>
                  {item.label}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  className="rounded-sm p-0.5 hover:bg-muted"
                  aria-label={`${t("filters.removeFilter")}: ${item.label}`}
                  onClick={() => toggle(item.key, false)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {t("filters.noneActive")}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={disabled}
          onClick={() => setOpenGroups(groups.map((g) => g.id))}
        >
          {t("filters.expandAll")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={disabled}
          onClick={() => setOpenGroups([])}
        >
          {t("filters.collapseAll")}
        </Button>
      </div>

      <Accordion
        type="multiple"
        value={openGroups}
        onValueChange={setOpenGroups}
        className="rounded-md border border-border/60 bg-background/80"
      >
        {groups.map((group) => {
          const activeInGroup = countActiveInGroup(group.id, checkedKeys, locale)
          return (
            <AccordionItem key={group.id} value={group.id} className="px-3">
              <AccordionTrigger className="py-3 hover:no-underline">
                <span className="flex flex-1 items-center gap-2 text-left text-sm font-medium">
                  {group.title}
                  {activeInGroup > 0 ? (
                    <Badge variant="default" className="h-5 px-1.5 text-[10px]">
                      {activeInGroup} {t("filters.activeCount")}
                    </Badge>
                  ) : (
                    <span className="text-xs font-normal text-muted-foreground">
                      {t("filters.nothing")}
                    </span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const id = `cb-${item.key}`
                    const checked = checkedKeys.has(item.key)
                    return (
                      <div
                        key={item.key}
                        className={
                          checked
                            ? "flex items-start gap-2 rounded-md border border-primary/25 bg-primary/10 px-2 py-1.5"
                            : "flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40"
                        }
                      >
                        <Checkbox
                          id={id}
                          checked={checked}
                          disabled={disabled}
                          onCheckedChange={(v) => toggle(item.key, v === true)}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={id}
                          className={`cursor-pointer text-sm leading-snug font-normal ${
                            checked ? "font-medium text-foreground" : ""
                          }`}
                        >
                          {item.label}
                          {checked && (
                            <span className="ml-1.5 text-[10px] uppercase tracking-wide text-primary">
                              ✓
                            </span>
                          )}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
