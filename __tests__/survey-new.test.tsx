import { screen, fireEvent, waitFor } from "@testing-library/react"
import NewSurveyPage from "@/app/dashboard/survey/new/page"
import { renderWithI18n } from "@/__tests__/test-utils"

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(async () => ({})),
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
      create: createMock,
    },
  }
})

describe("NewSurveyPage — Step 1 postal code validation", () => {
  beforeEach(() => {
    createMock.mockClear()
  })

  function fillRequiredStep1Fields() {
    fireEvent.change(screen.getByLabelText(/Handy \/ Telefon/i), {
      target: { value: "+49 228 1234567" },
    })
    fireEvent.click(screen.getAllByRole("radio")[0])
  }

  it("blocks advancing to step 2 when postal code is missing", () => {
    renderWithI18n(<NewSurveyPage />)
    fillRequiredStep1Fields()

    fireEvent.click(screen.getByRole("button", { name: /next/i }))

    expect(screen.getByText(/Bitte geben Sie eine gültige Postleitzahl ein/i)).toBeInTheDocument()
    expect(screen.getByText("1. Allgemeine Angaben")).toBeInTheDocument()
  })

  it("blocks advancing to step 2 when postal code is not 5 digits", () => {
    renderWithI18n(<NewSurveyPage />)
    fillRequiredStep1Fields()
    fireEvent.change(screen.getByLabelText(/Postleitzahl/i), { target: { value: "123" } })

    fireEvent.click(screen.getByRole("button", { name: /next/i }))

    expect(screen.getByText(/Bitte geben Sie eine gültige Postleitzahl ein/i)).toBeInTheDocument()
    expect(screen.getByText("1. Allgemeine Angaben")).toBeInTheDocument()
  })

  it("advances to step 2 once a valid 5-digit postal code is entered", () => {
    renderWithI18n(<NewSurveyPage />)
    fillRequiredStep1Fields()
    fireEvent.change(screen.getByLabelText(/Postleitzahl/i), { target: { value: "53111" } })

    fireEvent.click(screen.getByRole("button", { name: /next/i }))

    expect(screen.queryByText("1. Allgemeine Angaben")).not.toBeInTheDocument()
  })

  it("strips non-digit characters and caps postal code input at 5 characters", () => {
    renderWithI18n(<NewSurveyPage />)
    const input = screen.getByLabelText(/Postleitzahl/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: "5a3b1c1d1e9" } })
    expect(input.value).toBe("53111")
  })
})
