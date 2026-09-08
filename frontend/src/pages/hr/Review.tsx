import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
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
  Education,
  ProfileProvenance,
  WorkExperience,
} from "@/lib/types";

const STATUS_PROCESSING_FAILED = "DOCUMENT_PROCESSING_FAILED";

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

export default function Review() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get<ApplicationDetail>(`/api/applications/${id}`)
      .then((data) => {
        if (!cancelled) setDetail(data);
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

      {profile ? <AlignmentWarnings alignment={profile.alignment_check} /> : null}

      {detail.screening ? (
        <ScreeningSummaryCard screening={detail.screening} />
      ) : profile && profile.extraction_status === "completed" ? (
        <Card className="gap-0 py-4">
          <CardHeader className="px-5 py-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Screening result
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-sm text-muted-foreground">
              A screening result could not be loaded for this application.
            </p>
          </CardContent>
        </Card>
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

      <p className="text-xs text-slate-400">
        <Link to="/hr" className="underline hover:text-slate-600">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}