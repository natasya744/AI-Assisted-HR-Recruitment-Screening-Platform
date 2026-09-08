const STATUS_STYLES: Record<string, string> = {
  APPLICATION_SUBMITTED: "border-slate-200 bg-slate-100 text-slate-600",
  SCREENING: "border-indigo-200 bg-indigo-50 text-indigo-700",
  DOCUMENT_PROCESSING_FAILED: "border-red-200 bg-red-50 text-red-700",
  HR_REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? STATUS_STYLES.APPLICATION_SUBMITTED
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}