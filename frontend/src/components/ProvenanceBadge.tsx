import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PROVENANCE_STYLES: Record<string, string> = {
  ai: "border-neutral-300 bg-neutral-900 text-white",
  deterministic: "border-neutral-300 bg-neutral-100 text-neutral-800",
  manual: "border-neutral-300 bg-white text-neutral-800",
  missing: "border-neutral-200 bg-neutral-50 text-neutral-400",
  ai_approximate: "border-neutral-300 bg-white text-neutral-600 border-dashed",
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
    <Badge
      variant="outline"
      className={cn(
        "px-2 py-0.5 text-[10px] font-medium",
        PROVENANCE_STYLES[tag] ?? "border-neutral-200 bg-white text-neutral-500"
      )}
    >
      {PROVENANCE_LABELS[tag] ?? tag}
    </Badge>
  );
}
