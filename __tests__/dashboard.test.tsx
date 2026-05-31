import { screen, fireEvent } from "@testing-library/react"
import DashboardPage from "@/app/dashboard/page"
import { renderWithI18n } from "@/__tests__/test-utils"
import { de } from "@/lib/i18n/messages/de"
import type { SurveyResponse } from "@/lib/api/responses"

const { exportCSVMock, getFilterFieldsMock } = vi.hoisted(() => ({
  exportCSVMock: vi.fn(async () => new Blob(["x"], { type: "text/csv" })),
  getFilterFieldsMock: vi.fn(async () => [
    { questionId: "hasChestComplaints", label: "Brustbeschwerden?", kind: "boolean" as const },
    { questionId: "painIntensity", label: "Schmerzintensität", kind: "number" as const },
  ]),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("@/lib/api/responses", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/responses")>("@/lib/api/responses")
  return {
    ...actual,
    responsesAPI: {
      ...actual.responsesAPI,
      exportCSV: exportCSVMock,
      getFilterFields: getFilterFieldsMock,
    },
  }
})

vi.mock("@/lib/hooks/use-survey", () => ({
  useSurveys: () => ({ surveys: [], loading: false, error: null, refetch: vi.fn() }),
}))

const mockResponses: SurveyResponse[] = [
  {
    _id: "1",
    pid: "PID-123",
    surveyId: "s1",
    surveyTitle: "Cardiac Health Survey",
    interviewerName: "Doc 1",
    intervieweeName: "Alice",
    intervieweeEmail: "alice@example.com",
    answers: [],
    status: "completed",
    workflowStatus: "shk_in_progress",
    lockedBy: "user-1",
    signature: "sig",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "2",
    pid: "PID-999",
    surveyId: "s1",
    surveyTitle: "Cardiac Health Survey",
    interviewerName: "Doc 2",
    intervieweeName: "Bob",
    intervieweeEmail: "bob@example.com",
    answers: [],
    status: "draft",
    workflowStatus: "patient_in_progress",
    createdAt: new Date().toISOString(),
  },
] as SurveyResponse[]

const useResponsesMock = vi.fn((filters?: { pid?: string; workflowStatus?: string }) => {
  let list = [...mockResponses]
  if (filters?.pid) list = list.filter((r) => r.pid === filters.pid)
  if (filters?.workflowStatus) {
    list = list.filter((r) => r.workflowStatus === filters.workflowStatus)
  }
  return {
    responses: list,
    total: list.length,
    page: 1,
    limit: 50,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }
})

vi.mock("@/lib/hooks/use-responses", () => ({
  useResponses: (filters: unknown) => useResponsesMock(filters),
}))

describe("DashboardPage analytics and filters", () => {
  it("renders PID column and values in table view", () => {
    renderWithI18n(<DashboardPage />)

    expect(screen.getByText(de.dashboard.tablePid)).toBeInTheDocument()
    expect(screen.getByText("PID-123")).toBeInTheDocument()
    expect(screen.getByText("PID-999")).toBeInTheDocument()
    expect(screen.getByText(de.dashboard.tableWorkflow)).toBeInTheDocument()
    expect(screen.getByText("shk_in_progress")).toBeInTheDocument()
  })

  it("filters responses by PID", () => {
    renderWithI18n(<DashboardPage />)

    const pidInput = screen.getByPlaceholderText(de.dashboard.filterPid)
    fireEvent.change(pidInput, { target: { value: "PID-123" } })

    expect(screen.getByText("PID-123")).toBeInTheDocument()
    expect(screen.queryByText("PID-999")).not.toBeInTheDocument()
  })

  it("filters responses by signature status", () => {
    renderWithI18n(<DashboardPage />)

    fireEvent.click(screen.getByText(de.dashboard.allSignatures))
    fireEvent.click(screen.getByText(de.dashboard.onlySigned))

    expect(screen.getByText("PID-123")).toBeInTheDocument()
    expect(screen.queryByText("PID-999")).not.toBeInTheDocument()
  })

  it("exports CSV via server with current filters", async () => {
    renderWithI18n(<DashboardPage />)

    fireEvent.click(screen.getByTitle(de.dashboard.exportTitle))

    expect(exportCSVMock).toHaveBeenCalled()
  })

  it("sends active filters to server export", async () => {
    renderWithI18n(<DashboardPage />)

    fireEvent.change(screen.getByPlaceholderText(de.dashboard.searchPlaceholder), {
      target: { value: "Alice" },
    })
    fireEvent.change(screen.getByPlaceholderText(de.dashboard.filterPid), {
      target: { value: "PID-123" },
    })
    fireEvent.click(screen.getByTitle(de.dashboard.exportTitle))

    expect(exportCSVMock).toHaveBeenCalled()
    const args = exportCSVMock.mock.calls.at(-1)?.[0]
    expect(args?.search).toBe("Alice")
    expect(args?.pid).toBe("PID-123")
  })

  it("filters responses by workflow status", () => {
    renderWithI18n(<DashboardPage />)

    fireEvent.click(screen.getByText(de.dashboard.allWorkflow))
    fireEvent.click(screen.getByText(de.dashboard.workflowPatientInProgress))

    expect(screen.getByText("PID-999")).toBeInTheDocument()
    expect(screen.queryByText("PID-123")).not.toBeInTheDocument()
  })

  it("filters responses by unsigned signature state", () => {
    renderWithI18n(<DashboardPage />)

    fireEvent.click(screen.getByText(de.dashboard.allSignatures))
    fireEvent.click(screen.getByText(de.dashboard.onlyUnsigned))

    expect(screen.getByText("PID-999")).toBeInTheDocument()
    expect(screen.queryByText("PID-123")).not.toBeInTheDocument()
  })

  it("renders checkbox answer filter panel", async () => {
    renderWithI18n(<DashboardPage />)
    expect(await screen.findByText(de.dashboard.answerFiltersTitle)).toBeInTheDocument()
    expect(screen.getByText(de.filters.groups.chest)).toBeInTheDocument()
    expect(screen.getByText(de.filters.noneActive)).toBeInTheDocument()
    expect(getFilterFieldsMock).toHaveBeenCalled()
  })

  it("applies answerFilters immediately when checkbox is toggled", async () => {
    renderWithI18n(<DashboardPage />)
    await screen.findByText(de.dashboard.answerFiltersTitle)

    fireEvent.click(screen.getByText(de.filters.expandAll))
    fireEvent.click(screen.getByLabelText(de.filters.items.hasChestComplaints))

    const lastCall = useResponsesMock.mock.calls.at(-1)?.[0] as {
      answerFilters?: Array<{ questionId: string; op: string; value: string }>
    }
    expect(lastCall?.answerFilters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ questionId: "hasChestComplaints", op: "eq", value: "yes" }),
      ])
    )
  })

  it("sends answerFilters to server export when checkbox active", async () => {
    renderWithI18n(<DashboardPage />)
    await screen.findByText(de.dashboard.answerFiltersTitle)

    fireEvent.click(screen.getByText(de.filters.expandAll))
    fireEvent.click(screen.getByLabelText(de.filters.items.hasChestComplaints))
    fireEvent.click(screen.getByTitle(de.dashboard.exportTitle))

    expect(exportCSVMock).toHaveBeenCalled()
    const args = exportCSVMock.mock.calls.at(-1)?.[0]
    expect(args.answerFilters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ questionId: "hasChestComplaints", op: "eq", value: "yes" }),
      ])
    )
  })

  it("sends status, workflow and date filters to server export", () => {
    renderWithI18n(<DashboardPage />)

    fireEvent.click(screen.getByText(de.dashboard.allStatus))
    fireEvent.click(screen.getByText(de.dashboard.statusDraft))
    fireEvent.click(screen.getByText(de.dashboard.allWorkflow))
    fireEvent.click(screen.getByText(de.dashboard.workflowPatientInProgress))

    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: "2026-03-01" } })
    fireEvent.change(dateInputs[1], { target: { value: "2026-03-31" } })

    fireEvent.click(screen.getByTitle(de.dashboard.exportTitle))

    const args = exportCSVMock.mock.calls.at(-1)?.[0]
    expect(args.draft).toBe(true)
    expect(args.workflowStatus).toBe("patient_in_progress")
    expect(args.completedAtFrom).toBe("2026-03-01")
    expect(args.completedAtTo).toBe("2026-03-31")
  })
})

