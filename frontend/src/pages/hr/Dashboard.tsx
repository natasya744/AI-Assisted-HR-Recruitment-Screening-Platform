import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Plus,
  Briefcase,
  Search,
  RotateCcw,
  FileText,
  Trash2,
  ArrowUpRight,
  UserCheck,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import QualificationBadge from "@/components/QualificationBadge";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
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

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Dashboard() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
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

  // Client-side search filtering by name/email
  const filteredApplications = useMemo(() => {
    if (!searchQuery.trim()) return applications;
    const q = searchQuery.toLowerCase();
    return applications.filter(
      (app) =>
        app.candidate_name?.toLowerCase().includes(q) ||
        app.candidate_email?.toLowerCase().includes(q) ||
        app.job_title?.toLowerCase().includes(q),
    );
  }, [applications, searchQuery]);

  const qualified = applications.filter((a) => a.screening?.is_qualified === true).length;
  const notQualified = applications.filter((a) => a.screening?.is_qualified === false).length;
  const pending = applications.filter((a) => a.screening == null).length;
  const decided = applications.filter((a) => a.status === "APPROVED" || a.status === "REJECTED").length;

  const hasActiveFilters =
    Boolean(filterJobId) ||
    Boolean(filterStatus) ||
    Boolean(filterMinScore) ||
    Boolean(filterDate) ||
    Boolean(searchQuery);

  function resetFilters() {
    setFilterJobId("");
    setFilterStatus("");
    setFilterMinScore("");
    setFilterDate("");
    setSearchQuery("");
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const qs = exportQueryStrings().toString();
      const blob = await api.exportBlob(`/api/exports/applications${qs ? `?${qs}` : ""}`, {
        timeout: 60_000,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `candidate_screening_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
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

  async function handleDeleteApplication(appId: string) {
    try {
      await api.delete(`/api/hr/applications/${appId}`);
      setDeleteConfirmId(null);
      const params = exportQueryStrings();
      const qs = params.toString();
      const rows = await api.get<ApplicationListItem[]>(
        `/api/hr/applications${qs ? `?${qs}` : ""}`,
      );
      setApplications(rows);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 mb-2">
            <Sparkles className="size-3 text-indigo-600" />
            Recruitment Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            HR Screening Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review, evaluate, and make decisions on AI-screened candidate applications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExport}
            disabled={exporting || applications.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Download Excel report with complete candidate and scoring details"
          >
            {exporting ? (
              <Loader2 className="size-3.5 animate-spin text-indigo-600" />
            ) : (
              <FileSpreadsheet className="size-3.5 text-emerald-600" />
            )}
            <span>{exporting ? "Exporting…" : "Export to Excel"}</span>
          </button>

          <Link
            to="/hr/jobs"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-md transition-all"
          >
            <Plus className="size-3.5" />
            <span>Create & Manage Jobs</span>
          </Link>
        </div>
      </div>

      {/* Error Banners */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="size-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {exportError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="size-5 text-red-500 shrink-0" />
          <span>Export failed: {exportError}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Applications */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Applications
            </span>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
              {loading ? "…" : applications.length}
            </div>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Briefcase className="size-3 text-slate-400" /> Across {jobs.length} open positions
            </span>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Users className="size-6" />
          </div>
        </div>

        {/* Card 2: Qualified */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Qualified
            </span>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-900">
              {loading ? "…" : qualified}
            </div>
            <span className="text-[11px] text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-500" /> Above benchmark score
            </span>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-6" />
          </div>
        </div>

        {/* Card 3: Not Qualified / Pending */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Not Qualified
            </span>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-amber-900">
              {loading ? "…" : notQualified}
            </div>
            <span className="text-[11px] text-amber-600 flex items-center gap-1">
              <Clock className="size-3 text-amber-500" /> {pending} awaiting screening
            </span>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <XCircle className="size-6" />
          </div>
        </div>

        {/* Card 4: Decided */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Decisions Finalized
            </span>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
              {loading ? "…" : decided}
            </div>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <UserCheck className="size-3 text-slate-400" /> Approved or Rejected
            </span>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <UserCheck className="size-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Job */}
            <select
              value={filterJobId}
              onChange={(e) => setFilterJobId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="">All Jobs ({jobs.length})</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.filter(Boolean).map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            {/* Filter Min Score */}
            <input
              type="number"
              placeholder="Min Score"
              min="0"
              max="100"
              value={filterMinScore}
              onChange={(e) => setFilterMinScore(e.target.value)}
              className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium tabular-nums text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none"
            />

            {/* Filter Date */}
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none cursor-pointer"
            />

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="size-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Candidate Applications Data Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <Loader2 className="mx-auto size-7 animate-spin text-indigo-600" />
            <p className="text-xs sm:text-sm font-medium">Loading candidate applications…</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Search className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No applications found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              {hasActiveFilters
                ? "No candidates matched your current filter criteria. Try clearing some filters."
                : "No candidate applications have been received yet."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors mt-2"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-200/80">
                  <TableHead className="py-3.5 pl-6 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Candidate
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Target Position
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    AI Score
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Qualification
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </TableHead>
                  <TableHead className="py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Applied Date
                  </TableHead>
                  <TableHead className="py-3.5 pr-6 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {filteredApplications.map((app) => {
                  const score = app.screening?.total_score ?? null;
                  const max = app.screening?.max_score ?? 100;
                  const scorePct = score != null ? Math.round((score / max) * 100) : null;

                  return (
                    <TableRow
                      key={app.id}
                      className="group cursor-pointer hover:bg-indigo-50/30 transition-colors"
                      onClick={() => {
                        window.location.href = `/hr/review/${app.id}`;
                      }}
                    >
                      {/* Candidate Column */}
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100/80 text-xs font-bold text-indigo-700">
                            {getInitials(app.candidate_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link
                                to={`/hr/review/${app.id}`}
                                className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-xs sm:text-sm truncate"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {app.candidate_name || "Unknown Candidate"}
                              </Link>
                              {app.cv_storage_path && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`/hr/review/${app.id}/cv`, "_blank");
                                  }}
                                  title="View original PDF CV"
                                  className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                                >
                                  <FileText className="size-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="truncate text-xs text-slate-400 mt-0.5">
                              {app.candidate_email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Job Title Column */}
                      <TableCell className="py-4">
                        <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {app.job_title}
                        </span>
                      </TableCell>

                      {/* AI Score Column */}
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2.5">
                          <Progress
                            value={score ?? 0}
                            max={max}
                            className="h-2 w-16 sm:w-20 shrink-0"
                            aria-label="Screening score"
                          />
                          <span
                            className={`text-xs font-bold tabular-nums ${
                              scorePct == null
                                ? "text-slate-400"
                                : scorePct >= 70
                                  ? "text-emerald-600"
                                  : scorePct >= 50
                                    ? "text-amber-600"
                                    : "text-rose-600"
                            }`}
                          >
                            {score == null ? "—" : `${score}/${max}`}
                          </span>
                        </div>
                      </TableCell>

                      {/* Qualification Badge */}
                      <TableCell className="py-4">
                        <QualificationBadge
                          classification={app.screening?.classification}
                          isQualified={app.screening?.is_qualified}
                        />
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="py-4">
                        <StatusBadge status={app.status} />
                      </TableCell>

                      {/* Applied Date */}
                      <TableCell className="py-4 whitespace-nowrap text-xs tabular-nums text-slate-500">
                        {formatDate(app.applied_at)}
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell className="py-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/hr/review/${app.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 shadow-2xs transition-colors"
                          >
                            <span>Review</span>
                            <ArrowUpRight className="size-3" />
                          </Link>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(app.id);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Delete candidate application"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <ConfirmDialog
          open={!!deleteConfirmId}
          title="Delete this candidate application?"
          message="This will permanently delete the application, remove the CV from storage, and delete the candidate record if no other applications remain. This action cannot be undone."
          confirmLabel="Delete Application"
          confirmVariant="reject"
          onConfirm={() => handleDeleteApplication(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}