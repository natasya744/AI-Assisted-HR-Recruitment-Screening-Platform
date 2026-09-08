const PROVENANCE_STYLES: Record<string, string> = {
  ai: "bg-indigo-100 text-indigo-700",
  deterministic: "bg-emerald-100 text-emerald-700",
  manual: "bg-amber-100 text-amber-700",
  missing: "border border-slate-300 text-slate-500",
  ai_approximate: "border border-indigo-300 text-indigo-500",
};

const PROVENANCE_LABELS: Record<string, string> = {
  ai: "AI",
  deterministic: "Derived",
  manual: "Manual",
  missing: "Missing",
  ai_approximate: "AI approx",
};

export default function ProvenanceBadge({ tag }: { tag: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${
        PROVENANCE_STYLES[tag] ?? "border border-slate-300 text-slate-500"
      }`}
    >
      {PROVENANCE_LABELS[tag] ?? tag}
    </span>
  );
}