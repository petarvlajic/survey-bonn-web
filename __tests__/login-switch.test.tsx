import { fireEvent, render, screen } from "@testing-library/react"
import LoginPage from "@/app/login/page"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}))

vi.mock("@/lib/hooks/use-auth", () => ({
  useAuth: () => ({ setAuth: vi.fn() }),
}))

vi.mock("@/lib/api/auth", () => ({
  authAPI: {
    login: vi.fn(),
  },
}))

describe("Login mode switch", () => {
  it("opens switch modal and requires code", () => {
    const setItemSpy = vi.spyOn(window.localStorage.__proto__, "setItem")
    render(<LoginPage />)

    fireEvent.click(screen.getByText("Switch mode"))
    expect(screen.getByText("Active mode: SHK (Interviewer)")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Switch to Patient" }))
    expect(screen.getByText("Invalid switch code")).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("Switch code"), { target: { value: "sw!tch#" } })
    fireEvent.click(screen.getByRole("button", { name: "Switch to Patient" }))

    expect(setItemSpy).toHaveBeenCalledWith("ukb:app_mode", "patient")
  })
})

