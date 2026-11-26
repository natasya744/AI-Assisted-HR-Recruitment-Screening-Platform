import QualificationBadge from "@/components/QualificationBadge";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Sparkles, ArrowRight } from "lucide-react";
import type { ScreeningResult, ScreeningBreakdownCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  skills: "Skills",
  experience: "Experience",
  education: "Education",
  other: "Other",
};

const CATEGORY_ORDER = ["skills", "experience", "education", "other"];

const STATUS_VARIANTS: Record<string, "success" | "warning" | "destructive" | "muted" | "info"> = {
  MATCH: "success",
  PARTIAL_MATCH: "warning",
  NOT_MATCH: "destructive",
  NOT_FOUND: "muted",
  CONFLICTING_INFORMATION: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  MATCH: "Matched",
  PARTIAL_MATCH: "Partial match",
  NOT_MATCH: "Not matched",
  NOT_FOUND: "Not found",
  CONFLICTING_INFORMATION: "Conflicting",
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

function isAdvice(data: unknown): data is AiAdvice {
  if (data == null || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.overall_classification === "string" &&
    Array.isArray(obj.per_requirement)
  );
}

function Chip({ label, tone }: { label: string; tone: "good" | "bad" | "neutral" }) {
  const variant = tone === "good" ? "success" : tone === "bad" ? "destructive" : "secondary";
  return <Badge variant={variant}>{label}</Badge>;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-neutral-800">{children}</p>;
}

const CATEGORY_LABEL_MAP: Record<string, string> = {
  REQUIRED: "Required",
  PREFERRED: "Preferred",
  RESPONSIBILITY: "Responsibility",
  OTHER_CONDITION: "Other",
};

export default function ScreeningSummaryCard({
  screening,
}: {
  screening: ScreeningResult;
}) {
  const evidence = screening.evidence ?? {};
  const screeningFailed = evidence.screening_failed === true;
  const errorText = typeof evidence.error === "string" ? evidence.error : null;

  const categoryRows = CATEGORY_ORDER.map((key) => ({
    key,
    label: CATEGORY_LABELS[key] ?? key,
    data: (screening.breakdown[key] ?? {}) as Partial<ScreeningBreakdownCategory>,
  })).filter((row) => row.data.score != null || row.data.max != null);

  const matchedSkills = (evidence.matched_skills as string[] | undefined) ?? [];
  const missingSkills = (evidence.missing_skills as string[] | undefined) ?? [];
  const experienceYears = evidence.experience_years as number | undefined;
  const minExperience = evidence.min_required_experience as number | undefined;
  const certifications = (evidence.certifications as string[] | undefined) ?? [];

  const aiAdviceParsed = isAdvice(screening.ai_advice) ? screening.ai_advice : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Screening Result</span>
          <QualificationBadge
            classification={screening.classification}
            isQualified={screening.is_qualified}
          />
        </CardTitle>
        <CardDescription>
          Deterministic score against the job requirements. Passing score is{" "}
          <span className="font-medium text-neutral-900 tabular-nums">{screening.passing_score}</span> of{" "}
          <span className="font-medium text-neutral-900 tabular-nums">{screening.max_score}</span>.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-4xl font-bold tabular-nums tracking-tight text-neutral-950">
              {screening.total_score}
              <span className="text-lg font-medium text-neutral-400">
                {" "}
                / {screening.max_score}
              </span>
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {screeningFailed
                ? "A score could not be computed for this candidate."
                : screening.is_qualified
                  ? "Meets the qualification threshold."
                  : "Below the qualification threshold."}
            </p>
          </div>
        </div>

        <Progress value={screening.total_score} max={screening.max_score} className="h-2" />

        {screeningFailed && errorText ? (
          <Alert variant="destructive">
            <AlertTitle>Screening error</AlertTitle>
            <AlertDescription className="break-words">{errorText}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categoryRows.map(({ key, label, data }) => {
            const score = data.score ?? 0;
            const max = data.max ?? 1;
            return (
              <div key={key} className="space-y-1.5 rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium text-neutral-800">{label}</span>
                  <span className="font-semibold tabular-nums text-neutral-950">
                    {score} <span className="font-normal text-neutral-400">/ {max}</span>
                  </span>
                </div>
                <Progress value={score} max={max} className="h-1.5" />
                {key === "experience" && data.years != null ? (
                  <p className="text-[11px] text-neutral-500 tabular-nums">
                    {data.years} years reported{" "}
                    {minExperience != null ? `(min ${minExperience})` : ""}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {!screeningFailed && aiAdviceParsed ? (
          <div className="space-y-3">
            {aiAdviceParsed.concise_summary ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3.5">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="size-4 text-neutral-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                      Why this verdict
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-800 leading-relaxed">
                      {aiAdviceParsed.concise_summary}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {aiAdviceParsed.hr_advice ? (
              <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
                <div className="flex items-start gap-2.5">
                  <ArrowRight className="size-4 text-neutral-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                      Recommendation for HR
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-800 leading-relaxed">
                      {aiAdviceParsed.hr_advice}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {aiAdviceParsed.per_requirement.length > 0 && (
              <details className="space-y-2">
                <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-950 transition-colors">
                  Per-requirement detail{" "}
                  <span className="text-[10px] font-normal normal-case text-neutral-400">(click to expand)</span>
                </summary>
                <div className="space-y-2.5 pt-2">
                  {aiAdviceParsed.per_requirement.map((req, i) => (
                    <div key={i} className="space-y-1 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-neutral-900">
                            {req.requirement}
                          </p>
                          <p className="text-[10px] text-neutral-500">
                            {CATEGORY_LABEL_MAP[req.category] ?? req.category}
                          </p>
                        </div>
                        <Badge
                          variant={STATUS_VARIANTS[req.status] ?? "muted"}
                          className="shrink-0 text-[10px]"
                        >
                          {STATUS_LABELS[req.status] ?? req.status}
                        </Badge>
                      </div>
                      {req.reason ? (
                        <p className="text-xs text-neutral-600">{req.reason}</p>
                      ) : null}
                      {req.evidence ? (
                        <p className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[11px] text-neutral-700">
                          <span className="font-semibold text-neutral-900">CV evidence:</span> {req.evidence}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        ) : null}

        {!screeningFailed ? (
          <div className="space-y-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Rule Breakdown Evidence
            </p>

            <div className="space-y-1.5">
              <GroupLabel>Matched skills</GroupLabel>
              {matchedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {matchedSkills.map((s) => (
                    <Chip key={s} label={s} tone="good" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">No required skills matched.</p>
              )}
            </div>

            {missingSkills.length > 0 ? (
              <div className="space-y-1.5">
                <GroupLabel>Missing required skills</GroupLabel>
                <div className="flex flex-wrap gap-1.5">
                  {missingSkills.map((s) => (
                    <Chip key={s} label={s} tone="bad" />
                  ))}
                </div>
              </div>
            ) : null}

            {experienceYears != null ? (
              <p className="text-xs text-neutral-600">
                Experience reported:{" "}
                <span className="font-semibold text-neutral-950 tabular-nums">{experienceYears} years</span>
                {minExperience != null ? ` — requires at least ${minExperience} years` : ""}.
              </p>
            ) : null}

            {certifications.length > 0 ? (
              <div className="space-y-1.5">
                <GroupLabel>Certifications</GroupLabel>
                <div className="flex flex-wrap gap-1.5">
                  {certifications.map((c) => (
                    <Chip key={c} label={c} tone="neutral" />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
