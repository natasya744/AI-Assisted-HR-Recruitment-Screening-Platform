import {
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScreeningResult } from "@/lib/types";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "destructive" | "muted" | "info"> = {
  MATCH: "success",
  PARTIAL_MATCH: "warning",
  NOT_MATCH: "destructive",
  NOT_FOUND: "muted",
  CONFLICTING_INFORMATION: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  MATCH: "Match",
  PARTIAL_MATCH: "Partial match",
  NOT_MATCH: "Not matched",
  NOT_FOUND: "Not found",
  CONFLICTING_INFORMATION: "Conflicting",
};

const CATEGORY_LABEL_MAP: Record<string, string> = {
  REQUIRED: "Required",
  PREFERRED: "Preferred",
  RESPONSIBILITY: "Responsibility",
  OTHER_CONDITION: "Other",
};

type RequirementAssessment = {
  requirement: string;
  category: string;
  status: string;
  evidence: string | null;
  reason: string;
};

type AiAdvice = {
  overall_classification: string;
  per_requirement: RequirementAssessment[];
  additional_qualifications: string[];
  advisor_confidence: string;
  error?: string;
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  QUALIFIED: "Qualified",
  NOT_QUALIFIED: "Not Qualified",
  POTENTIALLY_QUALIFIED: "Potentially Qualified",
  INSUFFICIENT_INFORMATION: "Insufficient Information",
};

const CLASSIFICATION_VARIANTS: Record<string, "success" | "destructive" | "warning" | "muted"> = {
  QUALIFIED: "success",
  NOT_QUALIFIED: "destructive",
  POTENTIALLY_QUALIFIED: "warning",
  INSUFFICIENT_INFORMATION: "muted",
};

function isAdvice(data: unknown): data is AiAdvice {
  if (data == null || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.overall_classification === "string" &&
    Array.isArray(obj.per_requirement)
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case "MATCH":
      return <CheckCircle2 className="size-3 text-emerald-600" />;
    case "PARTIAL_MATCH":
      return <AlertTriangle className="size-3 text-amber-600" />;
    case "NOT_FOUND":
      return <XCircle className="size-3 text-slate-400" />;
    default:
      return <XCircle className="size-3 text-red-500" />;
  }
}

export default function AISummaryCard({
  screening,
}: {
  screening: ScreeningResult;
}) {
  const aiAdviceParsed = isAdvice(screening.ai_advice) ? screening.ai_advice : null;

  if (!aiAdviceParsed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="size-4 text-slate-400" />
            AI Summary
          </CardTitle>
          <CardDescription>No AI assessment available yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-400">
            The AI screening advisor has not processed this candidate. The
            deterministic score is shown above.
          </p>
        </CardContent>
      </Card>
    );
  }

  const configLabel = CLASSIFICATION_LABELS[aiAdviceParsed.overall_classification] ?? aiAdviceParsed.overall_classification;
  const configVariant = CLASSIFICATION_VARIANTS[aiAdviceParsed.overall_classification] ?? "muted";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Brain className="size-4 text-indigo-600" />
            AI Summary
          </span>
          <Badge variant={configVariant}>{configLabel}</Badge>
        </CardTitle>
        <CardDescription>
          AI assessment of this candidate against the job requirements.
          Confidence: {aiAdviceParsed.advisor_confidence}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {aiAdviceParsed.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <p className="font-medium">AI advisor error</p>
            <p className="mt-0.5 break-words">{aiAdviceParsed.error}</p>
          </div>
        ) : null}

        {aiAdviceParsed.per_requirement.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Per-Requirement Assessment
            </p>
            <div className="space-y-2">
              {aiAdviceParsed.per_requirement.map((req, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200">
                    {getStatusIcon(req.status)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-foreground">
                        {req.requirement}
                      </p>
                      <Badge
                        variant={STATUS_VARIANTS[req.status] ?? "muted"}
                        className="shrink-0 text-[10px]"
                      >
                        {STATUS_LABELS[req.status] ?? req.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{CATEGORY_LABEL_MAP[req.category] ?? req.category}</span>
                      <span className="text-slate-300">·</span>
                      <span>
                        {req.status === "MATCH" || req.status === "PARTIAL_MATCH"
                          ? "Reason: " + (req.reason ?? "—")
                          : "Reason: " + (req.reason ?? "Not verifiable from CV")}
                      </span>
                    </div>
                    {req.evidence ? (
                      <p className="rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground">
                        <span className="font-medium">CV evidence:</span>{" "}
                        {req.evidence}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {aiAdviceParsed.additional_qualifications.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Lightbulb className="size-3 text-amber-500" />
              Additional Qualifications Not Verifiable
            </p>
            <div className="flex flex-wrap gap-1.5">
              {aiAdviceParsed.additional_qualifications.map((q, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
