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
  const toneClass =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
      : tone === "bad"
        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${toneClass}`}
    >
      {label}
    </span>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-foreground">{children}</p>;
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
          <span>Screening result</span>
          <QualificationBadge
            classification={screening.classification}
            isQualified={screening.is_qualified}
          />
        </CardTitle>
        <CardDescription>
          Deterministic score against the job requirements. Passing score is{" "}
          {screening.passing_score} of {screening.max_score}.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
              {screening.total_score}
              <span className="text-lg font-medium text-muted-foreground">
                {" "}
                / {screening.max_score}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {screeningFailed
                ? "A score could not be computed for this candidate."
                : screening.is_qualified
                  ? "Meets the qualification threshold."
                  : "Below the qualification threshold."}
            </p>
          </div>
        </div>

        <Progress value={screening.total_score} max={screening.max_score} />

        {screeningFailed && errorText ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <p className="font-medium">Screening error</p>
            <p className="mt-0.5 break-words">{errorText}</p>
          </div>
        ) : null}

        <div className="space-y-3">
          {categoryRows.map(({ key, label, data }) => {
            const score = data.score ?? 0;
            const max = data.max ?? 1;
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {score} / {max}
                  </span>
                </div>
                <Progress value={score} max={max} className="h-1.5" />
                {key === "experience" && data.years != null ? (
                  <p className="text-xs text-muted-foreground">
                    {data.years} years reported{" "}
                    {minExperience != null ? `(min ${minExperience})` : ""}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {(!screeningFailed && aiAdviceParsed && aiAdviceParsed.per_requirement.length > 0) ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                AI assessment
              </p>
              <Badge variant="outline" className="text-[10px] uppercase">
                {aiAdviceParsed.advisor_confidence} confidence
              </Badge>
            </div>

            <div className="space-y-2.5">
              {aiAdviceParsed.per_requirement.map((req, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {req.requirement}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
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
                    <p className="text-xs text-muted-foreground">{req.reason}</p>
                  ) : null}
                  {req.evidence ? (
                    <p className="rounded border border-border bg-background px-2 py-1 text-[11px] text-foreground">
                      <span className="font-medium">CV evidence:</span> {req.evidence}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!screeningFailed ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Why this verdict
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
                <p className="text-xs text-muted-foreground">No required skills matched.</p>
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
              <p className="text-xs text-muted-foreground">
                Experience reported:{" "}
                <span className="font-medium text-foreground">{experienceYears} years</span>
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