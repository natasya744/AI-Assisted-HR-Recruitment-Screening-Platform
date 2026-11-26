import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative inline-flex w-full items-center">
      <select
        data-slot="select"
        className={cn(
          "h-9 w-full appearance-none rounded-lg border border-neutral-200 bg-white pl-3 pr-8 text-xs sm:text-sm font-medium text-neutral-900 shadow-2xs transition-colors outline-none cursor-pointer focus-visible:border-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-950/10 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-neutral-400" />
    </div>
  )
}

export { Select }
