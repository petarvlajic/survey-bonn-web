"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Search, LayoutGrid, TableIcon, BarChart3, FileText, CheckCircle2, Clock, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { DashboardHeader } from "@/components/dashboard-header"
import { AnswerCheckboxFilterPanel } from "@/components/answer-checkbox-filter-panel"
import { AnswerFilterRows } from "@/components/answer-filter-rows"
import {
  checkboxKeysToAnswerFilters,
  countActiveCheckboxFilters,
  type CheckboxFilterKey,
} from "@/lib/cardiac-checkbox-filters"
import { CopyableText } from "@/components/copyable-text"
import { useResponses } from "@/lib/hooks/use-responses"
import { useSurveys } from "@/lib/hooks/use-survey"
import { responsesAPI } from "@/lib/api/responses"
import type { AnswerFilter, FilterFieldMeta } from "@/lib/types/answer-filters"
import {
  activeAnswerFilters,
  defaultOpForKind,
  defaultValueForKind,
} from "@/lib/types/answer-filters"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { useI18n } from "@/lib/i18n/locale-context"

export default function DashboardPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [viewMode, setViewMode] = useState<"table" | "list">("table")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [surveyFilter, setSurveyFilter] = useState("all")
  const todayIso = () => new Date().toISOString().split("T")[0]
  const [dateFrom, setDateFrom] = useState(todayIso)
  const [dateTo, setDateTo] = useState(todayIso)
  const [pidFilter, setPidFilter] = useState("")
  const [hasSignatureFilter, setHasSignatureFilter] = useState<"all" | "signed" | "unsigned">("all")
  const [workflowFilter, setWorkflowFilter] = useState("all")
  const [exporting, setExporting] = useState(false)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<"createdAt" | "completedAt">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterFields, setFilterFields] = useState<FilterFieldMeta[]>([])
  const [checkedCheckboxKeys, setCheckedCheckboxKeys] = useState<Set<CheckboxFilterKey>>(
    () => new Set()
  )
  const [advancedFilters, setAdvancedFilters] = useState<AnswerFilter[]>([])
  const [appliedAdvancedFilters, setAppliedAdvancedFilters] = useState<AnswerFilter[]>([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  useEffect(() => {
    responsesAPI
      .getFilterFields()
      .then((fields) => {
        setFilterFields(fields)
        if (fields.length > 0) {
          setAdvancedFilters((prev) => {
            if (prev.length > 0) return prev
            const first = fields[0]
            return [
              {
                questionId: first.questionId,
                op: defaultOpForKind(first.kind),
                value: defaultValueForKind(first.kind),
              },
            ]
          })
        }
      })
      .catch((e) => console.error("Failed to load filter fields", e))
  }, [])

  const mergedAnswerFilters = useMemo(
    () => [
      ...checkboxKeysToAnswerFilters(checkedCheckboxKeys),
      ...activeAnswerFilters(appliedAdvancedFilters),
    ],
    [checkedCheckboxKeys, appliedAdvancedFilters]
  )

  const apiFilters = useMemo(
    () => ({
      page,
      sortBy,
      sortOrder,
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(dateFrom && { startDate: dateFrom }),
      ...(dateTo && { endDate: dateTo }),
      ...(pidFilter.trim() && { pid: pidFilter.trim() }),
      ...(searchQuery.trim() && { search: searchQuery.trim() }),
      ...(workflowFilter !== "all" && { workflowStatus: workflowFilter }),
      ...(mergedAnswerFilters.length > 0 && {
        answerFilters: mergedAnswerFilters,
      }),
    }),
    [
      page,
      sortBy,
      sortOrder,
      statusFilter,
      dateFrom,
      dateTo,
      pidFilter,
      searchQuery,
      workflowFilter,
      mergedAnswerFilters,
    ],
  )

  const { responses, total, page: currentPage, limit, loading, error, refetch } = useResponses(apiFilters)

  const hasActiveServerFilters = useMemo(
    () =>
      statusFilter !== "all" ||
      Boolean(dateFrom) ||
      Boolean(dateTo) ||
      Boolean(pidFilter.trim()) ||
      Boolean(searchQuery.trim()) ||
      workflowFilter !== "all" ||
      mergedAnswerFilters.length > 0,
    [
      statusFilter,
      dateFrom,
      dateTo,
      pidFilter,
      searchQuery,
      workflowFilter,
      mergedAnswerFilters,
    ]
  )
  const { surveys } = useSurveys()

  const hasSignature = (item: (typeof responses)[number]) => !!(item.signature || item.signedAt)

  const surveyTitles = useMemo(() => {
    const fromResponses = [...new Set(responses.map(r => r.surveyTitle).filter(Boolean))] as string[]
    const surveyList = Array.isArray(surveys) ? surveys : []
    const fromSurveys = surveyList.map((s: { title?: string }) => s.title).filter((t): t is string => Boolean(t))
    const combined = [...new Set([...fromResponses, ...fromSurveys])].sort()
    return combined
  }, [responses, surveys])

  /** Status / PID / workflow / text search are applied on the server; here we only narrow by survey title and signature. */
  const filteredData = useMemo(() => {
    return responses.filter(item => {
      const matchesSurvey = surveyFilter === "all" || item.surveyTitle === surveyFilter || item.surveyId === surveyFilter
      const matchesSignature =
        hasSignatureFilter === "all" ||
        (hasSignatureFilter === "signed" && hasSignature(item)) ||
        (hasSignatureFilter === "unsigned" && !hasSignature(item))
      return matchesSurvey && matchesSignature
    })
  }, [responses, surveyFilter, hasSignatureFilter])

  const completedAt = (item: (typeof responses)[number]) => item.submittedAt ?? (item as any).completedAt ?? null

  const analytics = useMemo(() => {
    const completed = filteredData.filter(r => r.status === "completed").length
    const draft = filteredData.filter(r => r.status === "draft").length
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last7 = filteredData.filter(r => {
      const d = r.createdAt ? new Date(r.createdAt) : null
      return d && d >= sevenDaysAgo
    }).length
    const withSig = filteredData.filter(r => hasSignature(r)).length
    return { completed, draft, last7, withSig }
  }, [filteredData])

  const chartData = useMemo(() => {
    const byDay: Record<string, number> = {}
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      byDay[d.toISOString().slice(0, 10)] = 0
    }
    filteredData.forEach(r => {
      if (!r.createdAt) return
      const key = new Date(r.createdAt).toISOString().slice(0, 10)
      if (byDay[key] !== undefined) byDay[key]++
    })
    return Object.entries(byDay).map(([day, count]) => ({ day: day.slice(5), full: day, count }))
  }, [filteredData])

  const pageStart = (currentPage - 1) * limit + 1
  const pageEnd = Math.min(currentPage * limit, total)
  const totalPages = Math.max(1, Math.ceil(total / limit))

  function escapeCsvCell(value: unknown): string {
    const s = value == null ? "" : String(value)
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const handleExportClient = async () => {
    if (hasActiveServerFilters || mergedAnswerFilters.length > 0) {
      await handleExportServer()
      return
    }
    const headers = [
      "ID",
      "PID",
      "Workflow",
      "Locked",
      "Interviewer",
      "Interviewee",
      "Email",
      "Survey",
      "Status",
      "Created",
      "Completed",
      "Signature",
    ]
    const rows = filteredData.map(item => [
      item._id,
      item.pid ?? "",
      item.workflowStatus ?? "patient_completed",
      item.lockedBy ? "Yes" : "No",
      item.interviewerName,
      item.intervieweeName,
      item.intervieweeEmail,
      item.surveyTitle,
      item.status,
      item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
      completedAt(item) ? new Date(completedAt(item)!).toLocaleString() : "-",
      hasSignature(item) ? "Yes" : "No",
    ])
    const csv = [headers.map(escapeCsvCell), ...rows.map(r => r.map(escapeCsvCell))].map(row => row.join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `survey-responses-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const onCheckboxFiltersChange = (keys: Set<CheckboxFilterKey>) => {
    setCheckedCheckboxKeys(keys)
    setPage(1)
  }

  const applyAdvancedFilters = () => {
    setAppliedAdvancedFilters(activeAnswerFilters(advancedFilters))
    setPage(1)
  }

  const addAdvancedFilterRow = () => {
    const first = filterFields[0]
    if (!first) return
    setAdvancedFilters((prev) => [
      ...prev,
      {
        questionId: first.questionId,
        op: defaultOpForKind(first.kind),
        value: defaultValueForKind(first.kind),
      },
    ])
  }

  const clearAllAnswerFilters = () => {
    setCheckedCheckboxKeys(new Set())
    setAdvancedFilters([])
    setAppliedAdvancedFilters([])
    setPage(1)
  }

  const buildServerExportParams = () => {
    const params: {
      draft?: boolean
      completedAtFrom?: string
      completedAtTo?: string
      workflowStatus?: string
      pid?: string
      search?: string
      answerFilters?: AnswerFilter[]
    } = {}
    if (statusFilter === "draft") params.draft = true
    if (statusFilter === "completed") params.draft = false
    if (dateFrom) params.completedAtFrom = dateFrom
    if (dateTo) params.completedAtTo = dateTo
    if (workflowFilter !== "all") params.workflowStatus = workflowFilter
    if (pidFilter.trim()) params.pid = pidFilter.trim()
    if (searchQuery.trim()) params.search = searchQuery.trim()
    if (mergedAnswerFilters.length > 0) params.answerFilters = mergedAnswerFilters
    return params
  }

  const handleExportServer = async () => {
    setExporting(true)
    try {
      const params = buildServerExportParams()
      const blob = await responsesAPI.exportCSV(Object.keys(params).length ? params : undefined)
      const url = window.URL.createObjectURL(blob as Blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `survey-responses-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const surfaceCard =
    "border-border/50 shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-border hover:shadow-md"

  return (
    <div className="relative min-h-screen bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,hsl(var(--primary)/0.09),transparent_55%)]"
      />
      <DashboardHeader />

      <main className="container relative mx-auto px-4 py-8 lg:py-10">
        <div className="mx-auto max-w-[1600px] space-y-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("dashboard.title")}
              </h1>
              <p className="max-w-xl text-muted-foreground leading-relaxed">
                {t("dashboard.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="font-medium shadow-sm"
                onClick={() => router.push("/dashboard/survey/new")}
              >
                {t("dashboard.newSurvey")}
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="icon"
                className="border-border/60 shadow-none"
                onClick={() => setViewMode("table")}
              >
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                className="border-border/60 shadow-none"
                onClick={() => setViewMode("list")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => void handleExportServer()}
                variant="outline"
                className="border-border/60 shadow-none"
                disabled={exporting}
                title={t("dashboard.exportTitle")}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? t("dashboard.exporting") : t("dashboard.exportCsv")}
              </Button>
            </div>
          </div>

          {/* Analytics cards */}
          {!loading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card className={surfaceCard}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("dashboard.totalFiltered")}</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{total}</div>
                  <p className="text-xs text-muted-foreground">{t("dashboard.totalFilteredHint")}</p>
                </CardContent>
              </Card>
              <Card className={surfaceCard}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("dashboard.completed")}</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.completed}</div>
                  <p className="text-xs text-muted-foreground">{t("dashboard.onThisPage")}</p>
                </CardContent>
              </Card>
              <Card className={surfaceCard}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("dashboard.drafts")}</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.draft}</div>
                  <p className="text-xs text-muted-foreground">on this page</p>
                </CardContent>
              </Card>
              <Card className={surfaceCard}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("dashboard.last7Days")}</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.last7}</div>
                  <p className="text-xs text-muted-foreground">{t("dashboard.createdOnPage")}</p>
                </CardContent>
              </Card>
              <Card className={surfaceCard}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("dashboard.withSignature")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.withSig}</div>
                  <p className="text-xs text-muted-foreground">on this page</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Chart */}
          {!loading && chartData.some(d => d.count > 0) && (
            <Card className={surfaceCard}>
              <CardHeader>
                <CardTitle>{t("dashboard.chartTitle")}</CardTitle>
                <CardDescription>{t("dashboard.chartDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ count: { label: "Responses" } }} className="h-[200px] w-full">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" tickLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className={`p-4 ${surfaceCard}`}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("dashboard.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("dashboard.filterStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("dashboard.allStatus")}</SelectItem>
                  <SelectItem value="completed">{t("dashboard.statusCompleted")}</SelectItem>
                  <SelectItem value="draft">{t("dashboard.statusDraft")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={surveyFilter} onValueChange={(v) => { setSurveyFilter(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("dashboard.filterSurvey")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("dashboard.allSurveys")}</SelectItem>
                  {surveyTitles.map((title) => (
                    <SelectItem key={title} value={title}>{title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder={t("dashboard.dateFrom")}
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="min-w-0"
              />
              <Input
                type="date"
                placeholder={t("dashboard.dateTo")}
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="min-w-0"
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Input
                placeholder={t("dashboard.filterPid")}
                value={pidFilter}
                onChange={(e) => {
                  setPidFilter(e.target.value)
                  setPage(1)
                }}
              />
              <Select
                value={hasSignatureFilter}
                onValueChange={v => {
                  setHasSignatureFilter(v as typeof hasSignatureFilter)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("dashboard.filterSignature")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("dashboard.allSignatures")}</SelectItem>
                  <SelectItem value="signed">{t("dashboard.onlySigned")}</SelectItem>
                  <SelectItem value="unsigned">{t("dashboard.onlyUnsigned")}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={workflowFilter}
                onValueChange={v => {
                  setWorkflowFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("dashboard.filterWorkflow")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("dashboard.allWorkflow")}</SelectItem>
                  <SelectItem value="patient_in_progress">{t("dashboard.workflowPatientInProgress")}</SelectItem>
                  <SelectItem value="patient_completed">{t("dashboard.workflowPatientCompleted")}</SelectItem>
                  <SelectItem value="shk_in_progress">{t("dashboard.workflowShkInProgress")}</SelectItem>
                  <SelectItem value="pending_shk_followup">{t("dashboard.workflowPendingFollowup")}</SelectItem>
                  <SelectItem value="closed">{t("dashboard.workflowClosed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6 space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("dashboard.answerFiltersTitle")}
                  </h3>
                  <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                    {t("dashboard.answerFiltersDesc")}
                  </p>
                </div>
                {(countActiveCheckboxFilters(checkedCheckboxKeys) > 0 ||
                  appliedAdvancedFilters.length > 0) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearAllAnswerFilters}
                  >
                    {t("dashboard.clearAllFilters")}
                  </Button>
                )}
              </div>
              <AnswerCheckboxFilterPanel
                checkedKeys={checkedCheckboxKeys}
                onChange={onCheckboxFiltersChange}
                disabled={loading}
              />
              <div className="border-t border-border/60 pt-3">
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setShowAdvancedFilters((v) => !v)}
                >
                  {showAdvancedFilters ? "▼" : "▶"} {t("dashboard.advancedToggle")}
                </button>
                {showAdvancedFilters && (
                  <div className="mt-3 space-y-3">
                    <AnswerFilterRows
                      fields={filterFields}
                      filters={advancedFilters}
                      onChange={setAdvancedFilters}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addAdvancedFilterRow}
                        disabled={filterFields.length === 0}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        {t("dashboard.addCondition")}
                      </Button>
                      <Button type="button" size="sm" onClick={applyAdvancedFilters}>
                        {t("dashboard.applyAdvanced")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {mergedAnswerFilters.length > 0 && (
                <p className="text-xs font-medium text-foreground">
                  {t("dashboard.patientsShown")}{" "}
                  <span className="text-primary">{total}</span>
                  {appliedAdvancedFilters.length > 0 && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · {appliedAdvancedFilters.length} {t("dashboard.advancedRules")}
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <span className="text-sm text-muted-foreground">{t("dashboard.sort")}</span>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
                const [s, o] = v.split("-") as ["createdAt" | "completedAt", "asc" | "desc"]
                setSortBy(s)
                setSortOrder(o)
                setPage(1)
              }}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">{t("dashboard.sortNewest")}</SelectItem>
                  <SelectItem value="createdAt-asc">{t("dashboard.sortOldest")}</SelectItem>
                  <SelectItem value="completedAt-desc">{t("dashboard.sortCompletedNewest")}</SelectItem>
                  <SelectItem value="completedAt-asc">{t("dashboard.sortCompletedOldest")}</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {t("dashboard.showingRange")
                  .replace("{from}", String(total === 0 ? 0 : pageStart))
                  .replace("{to}", String(pageEnd))
                  .replace("{total}", String(total))}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {error && (
            <Card className="border-destructive/40 bg-destructive/10 p-4 shadow-sm">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>{t("common.retry")}</Button>
            </Card>
          )}

          {loading && (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">{t("dashboard.loadingResponses")}</div>
            </Card>
          )}

          {/* Table View */}
          {!loading && viewMode === "table" && (
            <Card className={`overflow-hidden ${surfaceCard}`}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("dashboard.tableId")}</TableHead>
                      <TableHead>{t("dashboard.tablePid")}</TableHead>
                      <TableHead>{t("dashboard.tableWorkflow")}</TableHead>
                      <TableHead>{t("dashboard.tableLock")}</TableHead>
                      <TableHead>{t("dashboard.tableInterviewer")}</TableHead>
                      <TableHead>{t("dashboard.tableInterviewee")}</TableHead>
                      <TableHead>{t("dashboard.tableSurvey")}</TableHead>
                      <TableHead>{t("dashboard.tableStatus")}</TableHead>
                      <TableHead>{t("dashboard.tableCreated")}</TableHead>
                      <TableHead>{t("dashboard.tableCompleted")}</TableHead>
                      <TableHead>{t("dashboard.tableSignature")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow 
                        key={item._id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/dashboard/${item._id}`)}
                      >
                        <TableCell className="font-mono text-sm">{item._id}</TableCell>
                        <TableCell className="font-mono text-sm" onClick={(e) => e.stopPropagation()}>
                          {item.pid ? (
                            <CopyableText value={item.pid} prefix="PID" />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline">{item.workflowStatus ?? "patient_completed"}</Badge>
                            {item.pathologicalFindingReport ? (
                              <Badge className="bg-orange-500 text-white hover:bg-orange-600 border-orange-600">
                                {t("dashboard.pathologicalFinding")}
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.lockedBy ? "default" : "secondary"}>
                            {item.lockedBy ? t("common.locked") : t("common.open")}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.interviewerName}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div>
                            {item.intervieweeName?.trim() ? (
                              <CopyableText
                                value={item.intervieweeName}
                                valueClassName="font-medium font-sans"
                              />
                            ) : (
                              <div className="font-medium">—</div>
                            )}
                            <div className="text-sm text-muted-foreground">{item.intervieweeEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{item.surveyTitle}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(item.createdAt ?? null)}</TableCell>
                        <TableCell className="text-sm">{formatDate(completedAt(item))}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {hasSignature(item) ? t("common.yes") : t("common.no")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* List View */}
          {!loading && viewMode === "list" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredData.map((item) => (
                <Card 
                  key={item._id} 
                  className={`cursor-pointer space-y-3 p-4 transition-[box-shadow,border-color,background-color] duration-200 hover:border-primary/25 hover:bg-muted/40 hover:shadow-md ${surfaceCard}`}
                  onClick={() => router.push(`/dashboard/${item._id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      {item.pid ? (
                        <CopyableText value={item.pid} prefix="PID" className="text-sm" />
                      ) : null}
                      {item.intervieweeName?.trim() ? (
                        <CopyableText
                          value={item.intervieweeName}
                          valueClassName="font-semibold font-sans"
                        />
                      ) : (
                        <h3 className="font-semibold">—</h3>
                      )}
                      <p className="text-sm text-muted-foreground">{item.intervieweeEmail}</p>
                    </div>
                    <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{item.workflowStatus ?? "patient_completed"}</Badge>
                    {item.pathologicalFindingReport ? (
                      <Badge className="bg-orange-500 text-white hover:bg-orange-600 border-orange-600">
                        {t("dashboard.pathologicalFinding")}
                      </Badge>
                    ) : null}
                    <Badge variant={item.lockedBy ? "default" : "secondary"}>
                      {item.lockedBy ? t("common.locked") : t("common.open")}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{t("dashboard.listSurvey")}</p>
                    <p className="text-sm">{item.surveyTitle}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{t("dashboard.listInterviewer")}</p>
                    <p className="text-sm">{item.interviewerName}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>{formatDate(item.createdAt ?? null)}</span>
                    {hasSignature(item) && (
                      <Badge variant="outline" className="text-xs">{t("common.signed")}</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* No results — keep filters visible above */}
          {!loading && total === 0 && (
            <Card className={`p-12 ${surfaceCard}`}>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">{t("dashboard.noResults")}</p>
                <p className="text-sm text-muted-foreground">
                  {hasActiveServerFilters
                    ? t("dashboard.noResultsWithFilters")
                    : t("dashboard.noResultsHint")}
                </p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
