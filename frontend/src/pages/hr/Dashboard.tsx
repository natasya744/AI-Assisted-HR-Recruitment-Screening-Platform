import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QualificationBadge from "@/components/QualificationBadge";
import StatusBadge from "@/components/StatusBadge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { ApplicationListItem, Job } from "@/lib/types";

const STATUS_OPTIONS = [
  "",
  "APPLICATION_SUBMITTED",
  "SCREENING",
  "HR_REVIEW",
  "APPROVED",
  "REJECTED",
  "DOCUMENT_PROCESSING_FAILED",
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <CardDescription className="text-xs uppercase tracking-wide">
          {label}
        </CardDescription>
        <CardTitle className="text-2xl font-bold tabular-nums">{value}</CardTitle>
        {hint ? <CardDescription className="text-xs">{hint}</CardDescription> : null}
      </CardHeader>
    </Card>
  );
}

export default function Dashboard() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [filterJobId, setFilterJobId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMinScore, setFilterMinScore] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Job[]>("/api/jobs").then(setJobs).catch(() => {});
  }, []);

  function exportQueryStrings(): URLSearchParams {
    const params = new URLSearchParams();
    if (filterJobId) params.set("job_id", filterJobId);
    if (filterStatus) params.set("status", filterStatus);
    if (filterMinScore) params.set("min_score", filterMinScore);
    if (filterDate) params.set("applied_at_date", filterDate);
    return params;
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = exportQueryStrings();
    const qs = params.toString();

    api
      .get<ApplicationListItem[]>(`/api/hr/applications${qs ? `?${qs}` : ""}`)
      .then((rows) => {
        if (!cancelled) setApplications(rows);
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
  }, [filterJobId, filterStatus, filterMinScore, filterDate]);

  const qualified = applications.filter((a) => a.screening?.is_qualified === true).length;
  const notQualified = applications.filter((a) => a.screening?.is_qualified === false).length;
  const pending = applications.filter((a) => a.screening == null).length;
  const decided = applications.filter((a) => a.status === "APPROVED" || a.status === "REJECTED").length;

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const qs = exportQueryStrings().toString();
      const blob = await api.exportBlob(
        `/api/exports/applications${qs ? `?${qs}` : ""}`,
        { timeout: 60_000 },
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "applications.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setExportError(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">HR Dashboard</h1>
          <p className="text-sm text-slate-500">
            Review, screen, and manage candidate applications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            {exporting ? "Exporting…" : "Export to Excel"}
          </button>
          <Link
            to="/hr/jobs"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Manage jobs
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {exportError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Export failed: {exportError}
        </div>
      ) : null}

      {!loading && !error && applications.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard label="Applications" value={String(applications.length)} hint="Total received" />
          <StatCard label="Qualified" value={String(qualified)} hint="Above threshold" />
          <StatCard label="Not qualified" value={String(notQualified)} hint={`${pending} awaiting screening`} />
          <StatCard label="Decided" value={String(decided)} hint="Finalised" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterJobId}
          onChange={(e) => setFilterJobId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
        >
          <option value="">All jobs</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Min score"
          value={filterMinScore}
          onChange={(e) => setFilterMinScore(e.target.value)}
          className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs tabular-nums text-slate-600"
        />
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
        />
      </div>

      {!loading && !error && applications.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-400">No applications match the current filters.</p>
          <p className="mt-1 text-xs text-slate-400">
            Try adjusting the filters or wait for new applications.
          </p>
        </div>
      ) : null}

      {applications.length > 0 ? (
        <Card className="gap-0 overflow-hidden rounded-xl py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[24%] pl-5">Candidate</TableHead>
                <TableHead className="w-[16%]">Job</TableHead>
                <TableHead className="w-[18%]">Score</TableHead>
                <TableHead className="w-[14%]">Verdict</TableHead>
                <TableHead className="w-[16%]">Status</TableHead>
                <TableHead className="w-[12%] pr-5 text-right">Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => {
                const score = app.screening?.total_score ?? null;
                const max = app.screening?.max_score ?? 100;
                return (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer group"
                    onClick={() => {
                      window.location.href = `/hr/review/${app.id}`;
                    }}
                  >
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/hr/review/${app.id}`}
                            className="font-medium text-slate-800 group-hover:text-indigo-700"
                          >
                            {app.candidate_name}
                          </Link>
                          <p className="truncate text-xs text-slate-400">{app.candidate_email}</p>
                        </div>
                        {app.cv_storage_path ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/hr/review/${app.id}/cv`, "_blank");
                            }}
                            title="View original CV"
                            className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="size-4"
                            >
                              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-2 text-sm text-slate-600">
                        {app.job_title}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Progress
                          value={score ?? 0}
                          max={max}
                          className="h-1.5 w-20 shrink-0"
                          aria-label="Screening score"
                        />
                        <span className="whitespace-nowrap text-xs tabular-nums text-slate-500">
                          {score == null ? "—" : `${score}/${max}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <QualificationBadge
                        classification={app.screening?.classification}
                        isQualified={app.screening?.is_qualified}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-5 text-right text-xs tabular-nums text-slate-500">
                      {formatDate(app.applied_at)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : null}

      <p className="text-xs text-slate-400">
        <Link to="/" className="underline hover:text-slate-600">
          Back to home
        </Link>
      </p>
    </div>
  );
}