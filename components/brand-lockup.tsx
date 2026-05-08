import { cn } from "@/lib/utils"
import { Heart } from "lucide-react"

type BrandLockupProps = {
  size?: "sm" | "md" | "lg"
  layout?: "stack" | "inline"
  className?: string
}

export function BrandLockup({ size = "md", layout = "stack", className }: BrandLockupProps) {
  const iconBox =
    size === "lg"
      ? "h-11 w-11 rounded-2xl"
      : size === "md"
        ? "h-10 w-10 rounded-xl"
        : "h-8 w-8 rounded-lg"
  const title =
    size === "lg"
      ? "text-2xl tracking-tight"
      : size === "md"
        ? "text-xl tracking-tight"
        : "text-lg tracking-tight"
  const sub = size === "lg" ? "text-[0.9375rem]" : "text-sm"

  const graphic = (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary text-primary-foreground shadow-md shadow-primary/20",
        iconBox,
      )}
      aria-hidden
    >
      <Heart
        className={cn(size === "lg" ? "h-6 w-6" : "h-5 w-5")}
        strokeWidth={2}
      />
    </div>
  )

  if (layout === "inline") {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        {graphic}
        <div className="min-w-0 leading-tight">
          <p className={cn("font-semibold tracking-tight text-foreground", title)}>Herz Check Bonn</p>
          <p className={cn("text-muted-foreground", sub)}>Survey dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start gap-3">
        {graphic}
        <div className="min-w-0 leading-tight">
          <p className={cn("font-semibold text-foreground", title)}>Herz Check Bonn</p>
          <p className={cn("text-muted-foreground", sub)}>UK Bonn Survey</p>
        </div>
      </div>
      {size === "lg" ? (
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Operational dashboard for study staff — secure responses, signatures, exports,
          and workflow visibility in one place.
        </p>
      ) : null}
    </div>
  )
}
