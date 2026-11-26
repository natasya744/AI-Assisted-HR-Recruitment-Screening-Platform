import * as React from "react"
import { cn } from "@/lib/utils"

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="tablist"
      data-slot="tabs-list"
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-100/80 p-1",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  active,
  className,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      role="tab"
      type="button"
      aria-selected={active}
      data-slot="tabs-trigger"
      data-state={active ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap",
        active
          ? "bg-white text-neutral-950 shadow-xs"
          : "text-neutral-500 hover:text-neutral-900",
        className
      )}
      {...props}
    />
  )
}

export { TabsList, TabsTrigger }
