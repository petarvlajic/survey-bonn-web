import { render, screen, fireEvent } from "@testing-library/react"
import DashboardPage from "@/app/dashboard/page"
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

vi.mock("@/lib/hooks/use-responses", () => ({
  useResponses: () => ({
    responses: mockResponses,
    total: mockResponses.length,
    page: 1,
    limit: 50,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

describe("DashboardPage analytics and filters", () => {
  it("renders PID column and values in table view", () => {
    render(<DashboardPage />)

    expect(screen.getByText("PID")).toBeInTheDocument()
    expect(screen.getByText("PID-123")).toBeInTheDocument()
    expect(screen.getByText("PID-999")).toBeInTheDocument()
    expect(screen.getByText("Workflow")).toBeInTheDocument()
    expect(screen.getByText("shk_in_progress")).toBeInTheDocument()
  })

  it("filters responses by PID", () => {
    render(<DashboardPage />)

    const pidInput = screen.getByPlaceholderText("Filter by PID...")
    fireEvent.change(pidInput, { target: { value: "PID-123" } })

    expect(screen.getByText("PID-123")).toBeInTheDocument()
    expect(screen.queryByText("PID-999")).not.toBeInTheDocument()
  })

  it("filters responses by signature status", () => {
    render(<DashboardPage />)

    const signatureSelect = screen.getByText("All signatures")
    fireEvent.click(signatureSelect)
    fireEvent.click(screen.getByText("Only signed"))

    expect(screen.getByText("PID-123")).toBeInTheDocument()
    expect(screen.queryByText("PID-999")).not.toBeInTheDocument()
  })

  it("exports CSV with PID column and values", () => {
    const blobMock = vi.fn()
    ;(global as any).Blob = blobMock as any

    render(<DashboardPage />)

    fireEvent.click(screen.getByTitle("Export current filtered list"))

    expect(blobMock).toHaveBeenCalled()
    const [parts] = blobMock.mock.calls[0] as unknown[]
    const csv = String((parts as unknown[])[0])

    expect(csv).toContain("ID,PID,Workflow,Locked,Interviewer,Interviewee,Email,Survey,Status,Created,Completed,Signature")
    expect(csv).toContain("PID-123")
    expect(csv).toContain("PID-999")
  })

  it("sends active filters to server export", async () => {
    render(<DashboardPage />)

    fireEvent.change(screen.getByPlaceholderText("Search by name or email..."), {
      target: { value: "Alice" },
    })
    fireEvent.change(screen.getByPlaceholderText("Filter by PID..."), {
      target: { value: "PID-123" },
    })
    fireEvent.click(screen.getByTitle("Export from server (status, dates, workflow, answer filters)"))

    expect(exportCSVMock).toHaveBeenCalled()
    const args = exportCSVMock.mock.calls[0][0]
    expect(args.search).toBe("Alice")
    expect(args.pid).toBe("PID-123")
  })

  it("filters responses by workflow status", () => {
    render(<DashboardPage />)

    fireEvent.click(screen.getByText("All workflow states"))
    fireEvent.click(screen.getByText("Patient in progress"))

    expect(screen.getByText("PID-999")).toBeInTheDocument()
    expect(screen.queryByText("PID-123")).not.toBeInTheDocument()
  })

  it("filters responses by unsigned signature state", () => {
    render(<DashboardPage />)

    fireEvent.click(screen.getByText("All signatures"))
    fireEvent.click(screen.getByText("Only unsigned"))

    expect(screen.getByText("PID-999")).toBeInTheDocument()
    expect(screen.queryByText("PID-123")).not.toBeInTheDocument()
  })

  it("renders answer filter section and apply button", async () => {
    render(<DashboardPage />)
    expect(await screen.findByText("Filter nach Antworten (kombinierbar)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Filter anwenden/i })).toBeInTheDocument()
    expect(getFilterFieldsMock).toHaveBeenCalled()
  })

  it("sends answerFilters to server export after apply", async () => {
    render(<DashboardPage />)
    await screen.findByText("Filter nach Antworten (kombinierbar)")

    fireEvent.click(screen.getByRole("button", { name: /Filter anwenden/i }))
    fireEvent.click(screen.getByTitle("Export from server (status, dates, workflow, answer filters)"))

    expect(exportCSVMock).toHaveBeenCalled()
    const args = exportCSVMock.mock.calls.at(-1)?.[0]
    expect(args.answerFilters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ questionId: "hasChestComplaints", op: "eq", value: "yes" }),
      ])
    )
  })

  it("sends status, workflow and date filters to server export", () => {
    render(<DashboardPage />)

    fireEvent.click(screen.getByText("All Status"))
    fireEvent.click(screen.getByText("Draft"))
    fireEvent.click(screen.getByText("All workflow states"))
    fireEvent.click(screen.getByText("Patient in progress"))

    const dateInputs = document.querySelectorAll('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: "2026-03-01" } })
    fireEvent.change(dateInputs[1], { target: { value: "2026-03-31" } })

    fireEvent.click(screen.getByTitle("Export from server (status, dates, workflow, answer filters)"))

    const args = exportCSVMock.mock.calls.at(-1)?.[0]
    expect(args.draft).toBe(true)
    expect(args.workflowStatus).toBe("patient_in_progress")
    expect(args.completedAtFrom).toBe("2026-03-01")
    expect(args.completedAtTo).toBe("2026-03-31")
  })
})

