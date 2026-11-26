import {
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
  concise_summary?: string;
  hr_advice?: string;
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
      return <CheckCircle2 className="size-3.5 text-emerald-600" />;
    case "PARTIAL_MATCH":
      return <AlertTriangle className="size-3.5 text-amber-600" />;
    case "NOT_FOUND":
      return <XCircle className="size-3.5 text-neutral-400" />;
    default:
      return <XCircle className="size-3.5 text-red-500" />;
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
            <Brain className="size-4 text-neutral-400" />
            AI Summary
          </CardTitle>
          <CardDescription>No AI assessment available yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-neutral-500">
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
            <Brain className="size-4 text-neutral-700" />
            AI Summary
          </span>
          <Badge variant={configVariant}>{configLabel}</Badge>
        </CardTitle>
        <CardDescription>
          AI assessment of this candidate against the job requirements.
          Confidence: <span className="font-medium text-neutral-800">{aiAdviceParsed.advisor_confidence}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {aiAdviceParsed.error ? (
          <Alert variant="destructive">
            <AlertTitle>AI advisor error</AlertTitle>
            <AlertDescription className="break-words">{aiAdviceParsed.error}</AlertDescription>
          </Alert>
        ) : null}

        {aiAdviceParsed.concise_summary ? (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="size-4 text-neutral-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Why this verdict
                </p>
                <p className="mt-1 text-sm text-neutral-800 leading-relaxed">
                  {aiAdviceParsed.concise_summary}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {aiAdviceParsed.hr_advice ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <ArrowRight className="size-4 text-neutral-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Recommendation for HR
                </p>
                <p className="mt-1 text-sm text-neutral-800 leading-relaxed">
                  {aiAdviceParsed.hr_advice}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {aiAdviceParsed.per_requirement.length > 0 && (
          <details className="space-y-3">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-950 transition-colors">
              Per-requirement detail{" "}
              <span className="text-[11px] font-normal normal-case text-neutral-400">(click to expand)</span>
            </summary>
            <div className="space-y-2.5 pt-2">
              {aiAdviceParsed.per_requirement.map((req, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/50 p-3.5"
                >
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white border border-neutral-200">
                    {getStatusIcon(req.status)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-neutral-900">
                        {req.requirement}
                      </p>
                      <Badge
                        variant={STATUS_VARIANTS[req.status] ?? "muted"}
                        className="shrink-0 text-[10px]"
                      >
                        {STATUS_LABELS[req.status] ?? req.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                      <span className="font-medium text-neutral-700">{CATEGORY_LABEL_MAP[req.category] ?? req.category}</span>
                      <span className="text-neutral-300">·</span>
                      <span>
                        {req.status === "MATCH" || req.status === "PARTIAL_MATCH"
                          ? "Reason: " + (req.reason ?? "—")
                          : "Reason: " + (req.reason ?? "Not verifiable from CV")}
                      </span>
                    </div>
                    {req.evidence ? (
                      <p className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] text-neutral-700">
                        <span className="font-semibold text-neutral-900">CV evidence:</span>{" "}
                        {req.evidence}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        {aiAdviceParsed.additional_qualifications.length > 0 ? (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium text-neutral-800 flex items-center gap-1.5">
              <Lightbulb className="size-3.5 text-neutral-500" />
              Additional Qualifications Not Verifiable
            </p>
            <div className="flex flex-wrap gap-1.5">
              {aiAdviceParsed.additional_qualifications.map((q, i) => (
                <Badge key={i} variant="secondary" className="text-[11px] font-normal">
                  {q}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
