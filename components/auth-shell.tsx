import type { ReactNode } from "react"
import { Activity, Heart, ShieldCheck } from "lucide-react"
import { BrandLockup } from "@/components/brand-lockup"

const highlights = [
  {
    icon: ShieldCheck,
    text: "Audit-friendly workflows and role-based access for clinical teams.",
  },
  {
    icon: Activity,
    text: "Herz Check Bonn — structured capture with clear response lifecycles.",
  },
  {
    icon: Heart,
    text: "Designed for calm, low-friction use in busy hospital settings.",
  },
] as const

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-18%,hsl(var(--primary)/0.14),transparent_55%)]"
      />
      <div className="relative grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <aside className="relative hidden flex-col justify-between border-r border-border/50 bg-gradient-to-br from-muted/80 via-muted/40 to-background px-10 py-12 lg:flex xl:px-14">
          <div className="space-y-10">
            <BrandLockup size="lg" />
            <ul className="max-w-sm space-y-4">
              {highlights.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground/75">
            Uniklinikum Bonn · Survey operations dashboard. Use your institutional
            @ukbonn.de account.
          </p>
        </aside>

        <div className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:px-12">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLockup size="md" />
          </div>
          <div className="mx-auto w-full max-w-[440px] motion-safe:animate-[auth-fade-up_0.55s_cubic-bezier(0.22,1,0.36,1)_both]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
