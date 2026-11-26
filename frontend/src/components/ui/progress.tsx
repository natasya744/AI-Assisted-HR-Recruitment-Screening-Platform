import * as React from "react"
import { cn } from "@/lib/utils"

function Progress({
  value = 0,
  className,
  indicatorClassName,
  max = 100,
  ...props
}: React.ComponentProps<"div"> & { value?: number; max?: number; indicatorClassName?: string }) {
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
        "relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/80",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn("h-full rounded-full bg-neutral-900 transition-all duration-300", indicatorClassName)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export { Progress }
