import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string; dotClass: string }> = {
  APPLICATION_SUBMITTED: {
    label: "Submitted",
    className: "border-neutral-200 bg-neutral-100 text-neutral-700",
    dotClass: "bg-neutral-400",
  },
  SCREENING: {
    label: "Screening",
    className: "border-neutral-300 bg-neutral-100 text-neutral-900",
    dotClass: "bg-neutral-700",
  },
  DOCUMENT_PROCESSING_FAILED: {
    label: "Processing Failed",
    className: "border-red-200 bg-red-50 text-red-700",
    dotClass: "bg-red-500",
  },
  HR_REVIEW: {
    label: "HR Review",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    dotClass: "bg-amber-500",
  },
  APPROVED: {
    label: "Approved",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejected",
    className: "border-neutral-300 bg-neutral-900 text-white",
    dotClass: "bg-red-400",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, " "),
    className: "border-neutral-200 bg-neutral-100 text-neutral-700",
    dotClass: "bg-neutral-400",
  };

  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", config.className)}>
      <span className={cn("size-1.5 rounded-full shrink-0", config.dotClass)} />
      {config.label}
    </Badge>
  );
}
