import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import ProvenanceBadge from "@/components/ProvenanceBadge";
import ScreeningSummaryCard from "@/components/ScreeningSummaryCard";
import StatusBadge from "@/components/StatusBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type {
  AlignmentCheck,
  ApplicationDetail,
  DecisionRead,
  Education,
  HistoryEntry,
  ProfileProvenance,
  WorkExperience,
} from "@/lib/types";

const STATUS_PROCESSING_FAILED = "DOCUMENT_PROCESSING_FAILED";

const TABS = ["Profile", "Screening", "History"] as const;
type Tab = (typeof TABS)[number];

function Section({
  title,
  tag,
  children,
}: {
  title: string;
  tag?: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex-row items-center justify-between gap-3 px-5 py-0">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        {tag ? <ProvenanceBadge tag={tag} /> : null}
      </CardHeader>
      <CardContent className="px-5">{children}</CardContent>
    </Card>
  );
}

function Field({ label, value, tag }: { label: string; value: string | null | undefined; tag: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm text-foreground">
          {value || <span className="text-slate-300">—</span>}
        </p>
      </div>
      <ProvenanceBadge tag={tag} />
    </div>
  );
}

function ProvenanceLegend() {
  const tags = [
    { tag: "ai", text: "Extracted by AI from the CV" },
    { tag: "deterministic", text: "Derived by deterministic rules" },
    { tag: "ai_approximate", text: "AI value, approximate" },
    { tag: "missing", text: "Not found on the CV" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <span className="font-medium">Provenance:</span>
      {tags.map(({ tag, text }) => (
        <span key={tag} className="inline-flex items-center gap-1">
          <ProvenanceBadge tag={tag} />
          <span>{text}</span>
        </span>
      ))}
    </div>
  );
}

function AlignmentWarnings({ alignment }: { alignment: AlignmentCheck }) {
  const fields = alignment.fields ?? {};
  const mismatches = Object.entries(fields).filter(([, f]) => f.status === "MISMATCH");
  const missingInPdf = Object.entries(fields).filter(([, f]) => f.status === "MISSING_IN_PDF");

  if (mismatches.length === 0 && missingInPdf.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <p className="font-medium">Profile does not fully match the application form</p>
      <p className="text-xs text-amber-700">
        Extracted values are never auto-corrected. Please review the mismatches.
      </p>
      <ul className="mt-2 list-disc pl-4 text-xs">
        {mismatches.map(([field, f]) => (
          <li key={field}>
            {field}: form "{String(f.form_value ?? "—")}" vs. PDF "{String(f.pdf_value ?? "—")}"
          </li>
        ))}
        {missingInPdf.map(([field, f]) => (
          <li key={field}>
            {field}: provided on the form but not found on the CV (
            {String(f.form_value ?? "—")})
          </li>
        ))}
      </ul>
    </div>
  );
}

function WorkExperienceList({ entries }: { entries: WorkExperience[] }) {
  if (entries.length === 0) return <p className="text-sm text-slate-300">Not found</p>;
  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {entry.title || <span className="text-slate-400">Role</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {[entry.company, [entry.start_date, entry.end_date].filter(Boolean).join(" — ")]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EducationList({ entries }: { entries: Education[] }) {
  if (entries.length === 0) return <p className="text-sm text-slate-300">Not found</p>;
  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {entry.degree || <span className="text-slate-400">Degree</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {[entry.institution, entry.field].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-slate-300">Not found</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function HistoryTimeline({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) return <p className="text-sm text-slate-300">No history entries.</p>;

  const eventLabels: Record<string, string> = {
    APPLICATION_SUBMITTED: "Application submitted",
    EXTRACTED: "Document extracted",
    SCREENED: "Screening completed",
    DECISION_APPROVED: "Candidate approved",
    DECISION_REJECTED: "Candidate rejected",
    DOCUMENT_PROCESSING_FAILED: "Document processing failed",
  };

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.created_at + entry.event_type} className="flex items-start gap-3">
          <div className="mt-1.5 size-2 shrink-0 rounded-full bg-slate-300" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800">
              {eventLabels[entry.event_type] ?? entry.event_type.replace(/_/g, " ")}
            </p>
            <p className="text-xs text-slate-400">
              {new Date(entry.created_at).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {entry.payload.error ? (
              <p className="mt-1 text-xs text-rose-600">Error: {entry.payload.error as string}</p>
            ) : null}
            {entry.payload.reviewer_email ? (
              <p className="mt-1 text-xs text-slate-400">
                by {entry.payload.reviewer_email as string}
                {entry.payload.notes ? ` — ${entry.payload.notes as string}` : null}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Review() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Profile");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDecision, setConfirmDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decisionMade, setDecisionMade] = useState<DecisionRead | null>(null);

  const alreadyDecided = detail?.status === "APPROVED" || detail?.status === "REJECTED";

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<{
        application: ApplicationDetail;
        candidate: ApplicationDetail["candidate"];
        screening: ApplicationDetail["screening"];
        pdf_profile: ApplicationDetail["pdf_profile"];
        history: HistoryEntry[];
      }>(`/api/hr/applications/${id}`)
      .then((data) => {
        if (!cancelled) {
          setDetail({
            id: data.application.id,
            job_id: data.application.job_id,
            job_title: data.application.job_title,
            candidate: data.candidate,
            status: data.application.status,
            cv_storage_path: data.application.cv_storage_path,
            applied_at: data.application.applied_at,
            form_data: null,
            pdf_profile: data.pdf_profile,
            screening: data.screening,
          });
          setHistory(data.history);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function openConfirm(decision: "APPROVED" | "REJECTED") {
    setConfirmDecision(decision);
    setDecisionError(null);
    setConfirmOpen(true);
  }

  async function handleDecision() {
    if (!id) return;
    setDecisionLoading(true);
    setDecisionError(null);
    try {
      const result = await api.post<DecisionRead>(`/api/hr/applications/${id}/decision`, {
        decision: confirmDecision,
        reviewer_email: "hr@example.com",
        notes: null,
      });
      setDecisionMade(result);
      setConfirmOpen(false);
      if (detail) {
        setDetail({ ...detail, status: confirmDecision });
      }
    } catch (err: unknown) {
      setDecisionError(getErrorMessage(err));
    } finally {
      setDecisionLoading(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading application…</p>;
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Candidate Review</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error ?? "Application not found."}
        </div>
        <p className="text-xs text-slate-400">
          <Link to="/hr" className="underline hover:text-slate-600">
            Back to dashboard
          </Link>
        </p>
      </div>
    );
  }

  const profile = detail.pdf_profile;
  const extracted = profile?.extracted_data;
  const provenance = profile?.provenance ?? ({} as ProfileProvenance);
  const failed = detail.status === STATUS_PROCESSING_FAILED;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold">
              {detail.candidate.full_name || extracted?.full_name || "Candidate"}
            </CardTitle>
            <CardDescription className="text-sm">
              {detail.job_title}
              <span className="text-slate-300"> · </span>
              <span className="font-mono text-xs">{detail.id}</span>
            </CardDescription>
          </div>
          <StatusBadge status={detail.status} />
        </CardHeader>
      </Card>

      {failed ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Document processing failed — manual review required</p>
          <p className="text-xs text-red-600">
            The CV could not be read automatically. Please open the uploaded document and review
            it by hand.
          </p>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-indigo-600 text-indigo-700"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Profile */}
      {activeTab === "Profile" ? (
        <>
          {profile ? <AlignmentWarnings alignment={profile.alignment_check} /> : null}

          {detail.screening ? (
            <ScreeningSummaryCard screening={detail.screening} />
          ) : null}

          {!profile ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              This application has not been processed yet.
            </div>
          ) : profile.extraction_status !== "completed" ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              No extracted profile is available for this application.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <ProvenanceLegend />
              </div>

              <Section title="Extracted profile">
                <Field label="Full name" value={extracted?.full_name} tag={provenance.full_name} />
                <Field label="Email" value={extracted?.email} tag={provenance.email} />
                <Field label="Phone" value={extracted?.phone} tag={provenance.phone} />
                <Field label="Location" value={extracted?.location} tag={provenance.location} />
                <Field label="LinkedIn" value={extracted?.linkedin_url} tag={provenance.linkedin_url} />
                <Field
                  label="Experience"
                  value={
                    extracted?.total_experience_years != null
                      ? `${extracted.total_experience_years} years`
                      : null
                  }
                  tag={provenance.total_experience_years}
                />
              </Section>

              {extracted?.professional_summary ? (
                <Card className="gap-3 py-4">
                  <CardHeader className="px-5 py-0">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Professional summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5">
                    <p className="text-sm text-foreground">{extracted.professional_summary}</p>
                  </CardContent>
                </Card>
              ) : null}

              <Section title={`Skills (${extracted?.skills.length ?? 0})`} tag={provenance.skills}>
                <ChipList items={extracted?.skills ?? []} />
              </Section>

              <Section
                title={`Work experience (${extracted?.work_experience.length ?? 0})`}
                tag={provenance.work_experience}
              >
                <WorkExperienceList entries={extracted?.work_experience ?? []} />
              </Section>

              <Section
                title={`Education (${extracted?.education.length ?? 0})`}
                tag={provenance.education}
              >
                <EducationList entries={extracted?.education ?? []} />
              </Section>

              <Section title={`Certifications (${extracted?.certifications.length ?? 0})`} tag={provenance.certifications}>
                <ChipList items={extracted?.certifications ?? []} />
              </Section>

              <Section title={`Languages (${extracted?.languages.length ?? 0})`} tag={provenance.languages}>
                <ChipList items={extracted?.languages ?? []} />
              </Section>
            </div>
          )}
        </>
      ) : null}

      {/* Tab: Screening */}
      {activeTab === "Screening" ? (
        detail.screening ? (
          <ScreeningSummaryCard screening={detail.screening} />
        ) : (
          <Card className="gap-0 py-4">
            <CardHeader className="px-5 py-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Screening result
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5">
              <p className="text-sm text-muted-foreground">
                {profile && profile.extraction_status === "completed"
                  ? "No screening result is available for this application."
                  : "This application has not been processed yet."}
              </p>
            </CardContent>
          </Card>
        )
      ) : null}

      {/* Tab: History */}
      {activeTab === "History" ? (
        <Card className="gap-3 py-4">
          <CardHeader className="px-5 py-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Audit history
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <HistoryTimeline entries={history} />
          </CardContent>
        </Card>
      ) : null}

      {/* Decision buttons */}
      {!alreadyDecided ? (
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
          {decisionMade ? (
            <p className="text-sm text-emerald-600">Decision recorded: {decisionMade.decision}</p>
          ) : (
            <>
              <button
                onClick={() => openConfirm("REJECTED")}
                disabled={decisionLoading}
                className="rounded-lg border border-rose-200 bg-white px-5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-40"
              >
                Reject
              </button>
              <button
                onClick={() => openConfirm("APPROVED")}
                disabled={decisionLoading}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                {decisionLoading ? "Processing…" : "Approve"}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-end border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-400">
            {decisionMade
              ? `Decision recorded: ${decisionMade.decision}`
              : "This application has already been decided."}
          </p>
        </div>
      )}

      {decisionError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {decisionError}
        </div>
      ) : null}

      <p className="text-xs text-slate-400">
        <Link to="/hr" className="underline hover:text-slate-600">
          Back to dashboard
        </Link>
      </p>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmDecision === "APPROVED" ? "Approve candidate" : "Reject candidate"}
        message={
          confirmDecision === "APPROVED"
            ? "This candidate will be marked as approved. The decision is terminal and cannot be undone."
            : "This candidate will be marked as rejected. The decision is terminal and cannot be undone."
        }
        confirmLabel={confirmDecision === "APPROVED" ? "Confirm approval" : "Confirm rejection"}
        confirmVariant={confirmDecision === "APPROVED" ? "approve" : "reject"}
        onConfirm={handleDecision}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}