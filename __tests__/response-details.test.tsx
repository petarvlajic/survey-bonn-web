import { render, screen } from "@testing-library/react"
import ResponseDetailsPage from "@/app/dashboard/[id]/page"
import type { SurveyResponse } from "@/lib/api/responses"

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/lib/hooks/use-responses", () => ({
  useResponse: () => ({
    response: {
      _id: "1",
      pid: "PID-777",
      surveyId: "s1",
      surveyTitle: "Cardiac Health Survey",
      interviewerName: "Doc 1",
      intervieweeName: "Alice",
      intervieweeEmail: "alice@example.com",
      answers: [],
      status: "completed",
      createdAt: new Date().toISOString(),
      signature: "sig",
    } as SurveyResponse,
    loading: false,
    error: null,
  }),
}))

describe("ResponseDetailsPage", () => {
  it("shows PID meta information when pid is present", () => {
    render(<ResponseDetailsPage />)

    expect(screen.getByText("Patient ID (PID)")).toBeInTheDocument()
    expect(screen.getByText("PID-777")).toBeInTheDocument()
  })

  it("indicates signed status based on signature fields", () => {
    render(<ResponseDetailsPage />)

    expect(screen.getByText("Signature Status")).toBeInTheDocument()
    expect(screen.getByText("Signed")).toBeInTheDocument()
  })
})

