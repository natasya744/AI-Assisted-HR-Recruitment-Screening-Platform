import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  History,
  GraduationCap,
  Briefcase,
  Award,
  Globe,
  Loader2,
} from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import EmailDraftCard from "@/components/EmailDraftCard";
import ProvenanceBadge from "@/components/ProvenanceBadge";
import ScreeningSummaryCard from "@/components/ScreeningSummaryCard";
import AISummaryCard from "@/components/AISummaryCard";
import StatusBadge from "@/components/StatusBadge";
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

const TABS = [
  { id: "Profile", label: "Extracted Profile", icon: User },
  { id: "Screening", label: "AI Screening Report", icon: Sparkles },
  { id: "History", label: "Audit History", icon: History },
] as const;

type Tab = (typeof TABS)[number]["id"];

function Section({
  title,
  tag,
  icon: Icon,
  children,
}: {
  title: string;
  tag?: string;
  icon?: typeof User;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-4 text-slate-500" />}
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {title}
          </h3>
        </div>
        {tag ? <ProvenanceBadge tag={tag} /> : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  tag,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  tag: string;
  icon?: typeof User;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100/80 last:border-0">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          {Icon && <Icon className="size-3 text-slate-400" />}
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm font-medium text-slate-800">
          {value || <span className="text-slate-300 italic">—</span>}
        </p>
      </div>
      <ProvenanceBadge tag={tag} />
    </div>
  );
}

function ProvenanceLegend() {
  const tags = [
    { tag: "ai", text: "Extracted by AI from CV" },
    { tag: "deterministic", text: "Calculated by rules" },
    { tag: "ai_approximate", text: "AI approximate estimate" },
    { tag: "missing", text: "Not specified on CV" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
      <span className="font-semibold text-slate-700 flex items-center gap-1">
        <ShieldCheck className="size-3.5 text-indigo-600" />
        Data Provenance:
      </span>
      {tags.map(({ tag, text }) => (
        <span key={tag} className="inline-flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border border-slate-200/70 shadow-2xs">
          <ProvenanceBadge tag={tag} />
          <span className="text-[11px]">{text}</span>
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
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-900 shadow-2xs space-y-2">
      <div className="flex items-center gap-2 font-bold text-amber-900">
        <AlertTriangle className="size-4 text-amber-600" />
        <span>Profile Discrepancies Detected</span>
      </div>
      <p className="text-xs text-amber-700">
        Self-reported form data does not completely match extracted CV text. Please inspect discrepancies before deciding.
      </p>
      <ul className="mt-2 list-disc pl-5 text-xs space-y-1 text-amber-800">
        {mismatches.map(([field, f]) => (
          <li key={field}>
            <span className="font-semibold capitalize">{field}</span>: Form indicated "{String(f.form_value ?? "—")}", but PDF extracted "{String(f.pdf_value ?? "—")}"
          </li>
        ))}
        {missingInPdf.map(([field, f]) => (
          <li key={field}>
            <span className="font-semibold capitalize">{field}</span>: Provided in application form ("{String(f.form_value ?? "—")}"), but could not be located on the CV.
          </li>
        ))}
      </ul>
    </div>
  );
}

function WorkExperienceList({ entries }: { entries: WorkExperience[] }) {
  if (entries.length === 0) return <p className="text-xs text-slate-400 italic">No experience records found</p>;
  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl bg-slate-50/70 p-3 border border-slate-100">
          <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <Briefcase className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold text-slate-900">
              {entry.title || <span className="text-slate-400">Position Role</span>}
            </p>
            <p className="text-xs font-medium text-indigo-700 mt-0.5">
              {entry.company || "Company"}
            </p>
            {(entry.start_date || entry.end_date) && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                {[entry.start_date, entry.end_date].filter(Boolean).join(" — ")}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EducationList({ entries }: { entries: Education[] }) {
  if (entries.length === 0) return <p className="text-xs text-slate-400 italic">No education records found</p>;
  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl bg-slate-50/70 p-3 border border-slate-100">
          <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <GraduationCap className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold text-slate-900">
              {entry.degree || <span className="text-slate-400">Degree</span>}
            </p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">
              {[entry.institution, entry.field].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChipList({ items, variant = "default" }: { items: string[]; variant?: "default" | "skills" }) {
  if (items.length === 0) return <p className="text-xs text-slate-400 italic">None extracted</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
            variant === "skills"
              ? "border border-indigo-100 bg-indigo-50/80 text-indigo-700"
              : "border border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function HistoryTimeline({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) return <p className="text-xs text-slate-400">No history entries.</p>;

  const eventLabels: Record<string, string> = {
    APPLICATION_SUBMITTED: "Application submitted",
    EXTRACTED: "Document extracted by AI",
    SCREENED: "Screening completed",
    DECISION_APPROVED: "Candidate approved by recruiter",
    DECISION_REJECTED: "Candidate rejected by recruiter",
    DOCUMENT_PROCESSING_FAILED: "Document processing failed",
  };

  return (
    <div className="space-y-4">
      {entries.map((entry, idx) => (
        <div key={entry.created_at + entry.event_type + idx} className="flex items-start gap-3">
          <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="size-3" />
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                {eventLabels[entry.event_type] ?? entry.event_type.replace(/_/g, " ")}
              </p>
              <span className="text-[11px] tabular-nums text-slate-400">
                {new Date(entry.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {entry.payload.error ? (
              <p className="mt-1 text-xs text-rose-600">Error: {entry.payload.error as string}</p>
            ) : null}
            {entry.payload.reviewer_email ? (
              <p className="mt-1 text-xs text-slate-500">
                Action by <span className="font-semibold text-slate-700">{entry.payload.reviewer_email as string}</span>
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
        reviewer_email: "hr@vertex.ai",
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
    return (
      <div className="p-16 text-center text-slate-400 space-y-3">
        <Loader2 className="mx-auto size-7 animate-spin text-indigo-600" />
        <p className="text-xs sm:text-sm font-medium">Loading candidate assessment…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-slate-800">Candidate Review</h1>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error ?? "Application record not found."}
        </div>
        <Link
          to="/hr"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ChevronLeft className="size-3.5" />
          Back to HR Dashboard
        </Link>
      </div>
    );
  }

  const profile = detail.pdf_profile;
  const extracted = profile?.extracted_data;
  const provenance = profile?.provenance ?? ({} as ProfileProvenance);
  const failed = detail.status === STATUS_PROCESSING_FAILED;
  const candidateName = detail.candidate.full_name || extracted?.full_name || "Candidate";

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <Link
            to="/hr"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-2"
          >
            <ChevronLeft className="size-3.5" />
            Back to Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {candidateName}
            </h1>
            <StatusBadge status={detail.status} />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-indigo-700">{detail.job_title}</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-xs text-slate-400">ID: {detail.id}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {detail.cv_storage_path && (
            <button
              onClick={() => window.open(`/hr/review/${detail.id}/cv`, "_blank")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 transition-all"
            >
              <FileText className="size-3.5 text-indigo-600" />
              <span>View Original PDF CV</span>
              <ArrowUpRight className="size-3 text-slate-400" />
            </button>
          )}

          {!alreadyDecided && !decisionMade && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openConfirm("REJECTED")}
                disabled={decisionLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-all"
              >
                <XCircle className="size-3.5" />
                <span>Reject</span>
              </button>
              <button
                onClick={() => openConfirm("APPROVED")}
                disabled={decisionLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-md disabled:opacity-50 transition-all"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Approve Candidate</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {failed && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 shadow-2xs">
          <p className="font-bold flex items-center gap-2">
            <AlertTriangle className="size-4 text-red-600" />
            Document Processing Failed — Manual Review Required
          </p>
          <p className="text-xs text-red-600 mt-1">
            The CV could not be parsed automatically. Please click "View Original PDF CV" above to review the file manually.
          </p>
        </div>
      )}

      {decisionMade && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs sm:text-sm text-emerald-800 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <span>Decision recorded successfully: Candidate {decisionMade.decision}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 -mb-px ${
                isActive
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon className={`size-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content: Extracted Profile */}
      {activeTab === "Profile" && (
        <div className="space-y-6">
          {profile && <AlignmentWarnings alignment={profile.alignment_check} />}

          {detail.screening && <ScreeningSummaryCard screening={detail.screening} />}

          {!profile ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-xs sm:text-sm text-slate-400">
              This application has not been processed yet.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                <ProvenanceLegend />
              </div>

              {/* Grid with Personal Data and Professional Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Section title="Extracted Personal Details" icon={User}>
                  <Field label="Full Name" value={extracted?.full_name} tag={provenance.full_name} icon={User} />
                  <Field label="Email" value={extracted?.email} tag={provenance.email} icon={Mail} />
                  <Field label="Phone" value={extracted?.phone} tag={provenance.phone} icon={Phone} />
                  <Field label="Location" value={extracted?.location} tag={provenance.location} icon={MapPin} />
                  <Field label="LinkedIn" value={extracted?.linkedin_url} tag={provenance.linkedin_url} icon={Linkedin} />
                  <Field
                    label="Total Experience"
                    value={
                      extracted?.total_experience_years != null
                        ? `${extracted.total_experience_years} years`
                        : null
                    }
                    tag={provenance.total_experience_years}
                    icon={Briefcase}
                  />
                </Section>

                <div className="space-y-6">
                  {extracted?.professional_summary && (
                    <Section title="Professional Summary" icon={FileText}>
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                        {extracted.professional_summary}
                      </p>
                    </Section>
                  )}

                  <Section title={`Extracted Skills (${extracted?.skills?.length ?? 0})`} tag={provenance.skills} icon={Award}>
                    <ChipList items={extracted?.skills ?? []} variant="skills" />
                  </Section>
                </div>
              </div>

              {/* Work Experience and Education Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Section
                  title={`Work Experience (${extracted?.work_experience?.length ?? 0})`}
                  tag={provenance.work_experience}
                  icon={Briefcase}
                >
                  <WorkExperienceList entries={extracted?.work_experience ?? []} />
                </Section>

                <Section
                  title={`Education (${extracted?.education?.length ?? 0})`}
                  tag={provenance.education}
                  icon={GraduationCap}
                >
                  <EducationList entries={extracted?.education ?? []} />
                </Section>
              </div>

              {/* Certifications and Languages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Section
                  title={`Certifications (${extracted?.certifications?.length ?? 0})`}
                  tag={provenance.certifications}
                  icon={Award}
                >
                  <ChipList items={extracted?.certifications ?? []} />
                </Section>

                <Section
                  title={`Languages (${extracted?.languages?.length ?? 0})`}
                  tag={provenance.languages}
                  icon={Globe}
                >
                  <ChipList items={extracted?.languages ?? []} />
                </Section>
              </div>

              {detail.screening && <AISummaryCard screening={detail.screening} />}

              {detail.screening && (
                <EmailDraftCard applicationId={detail.id} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Screening Report */}
      {activeTab === "Screening" && (
        <div className="space-y-6">
          {detail.screening ? (
            <ScreeningSummaryCard screening={detail.screening} />
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-xs sm:text-sm text-slate-400">
              No screening result is available for this application yet.
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Audit History */}
      {activeTab === "History" && (
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <History className="size-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Application Audit Trail</h3>
          </div>
          <HistoryTimeline entries={history} />
        </div>
      )}

      {/* Decision Error Alert */}
      {decisionError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700">
          Decision Error: {decisionError}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmDecision === "APPROVED" ? "Approve Candidate Application" : "Reject Candidate Application"}
        message={
          confirmDecision === "APPROVED"
            ? "This candidate will be formally marked as APPROVED. The hiring decision will be recorded in the audit trail."
            : "This candidate will be marked as REJECTED. The decision will be recorded in the audit trail."
        }
        confirmLabel={confirmDecision === "APPROVED" ? "Confirm Approval" : "Confirm Rejection"}
        confirmVariant={confirmDecision === "APPROVED" ? "approve" : "reject"}
        onConfirm={handleDecision}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}