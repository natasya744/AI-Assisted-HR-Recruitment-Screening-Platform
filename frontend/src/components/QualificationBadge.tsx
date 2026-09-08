import { Badge } from "@/components/ui/badge";

const VARIANTS: Record<string, "success" | "destructive" | "muted" | "warning"> = {
  QUALIFIED: "success",
  NOT_QUALIFIED: "destructive",
};

export default function QualificationBadge({
  classification,
  isQualified,
}: {
  classification: string | null | undefined;
  isQualified: boolean | null | undefined;
}) {
  if (classification == null) {
    return <Badge variant="muted">Not screened</Badge>;
  }
  const variant = VARIANTS[classification] ?? (isQualified ? "success" : "destructive");
  const label = isQualified ? "Qualified" : "Not qualified";
  return <Badge variant={variant}>{label}</Badge>;
}
