import * as React from "react"
import { cn } from "@/lib/utils"

function Progress({
  value = 0,
  className,
  max = 100,
  ...props
}: React.ComponentProps<"div"> & { value?: number; max?: number }) {
  const clamped = Math.max(0, Math.min(max, value))
  const percentage = max > 0 ? Math.round((clamped / max) * 100) : 0

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full w-full flex-1 rounded-full bg-primary transition-all"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export { Progress }
