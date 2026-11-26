import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Badge variant="secondary" className="mb-2">
            <Sparkles className="size-3" />
            Recruitment Command Center
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
            HR Screening Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Review, evaluate, and make decisions on AI-screened candidate applications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleExport}
            disabled={exporting || applications.length === 0}
            title="Download Excel report with complete candidate and scoring details"
          >
            {exporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="size-3.5 text-neutral-600" />
            )}
            <span>{exporting ? "Exporting…" : "Export to Excel"}</span>
          </Button>

          <Link
            to="/hr/jobs"
            className={cn(buttonVariants({ variant: "default", size: "default" }))}
          >
            <Plus className="size-3.5" />
            <span>Create & Manage Jobs</span>
          </Link>
        </div>
      </div>

      {/* Error Banners */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {exportError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <AlertDescription>Export failed: {exportError}</AlertDescription>
        </Alert>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="py-5">
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Total Applications
              </span>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-neutral-950">
                {loading ? "…" : applications.length}
              </div>
              <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                <Briefcase className="size-3 text-neutral-400" /> Across {jobs.length} open positions
              </span>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-5">
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Qualified
              </span>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-neutral-950">
                {loading ? "…" : qualified}
              </div>
              <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-600" /> Above benchmark score
              </span>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-5">
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Not Qualified
              </span>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-neutral-950">
                {loading ? "…" : notQualified}
              </div>
              <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                <Clock className="size-3 text-neutral-400" /> {pending} awaiting screening
              </span>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700">
              <XCircle className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-5">
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Decisions Finalized
              </span>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-neutral-950">
                {loading ? "…" : decided}
              </div>
              <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                <UserCheck className="size-3 text-neutral-400" /> Approved or Rejected
              </span>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700">
              <UserCheck className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="py-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search candidate name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-neutral-50/60 focus-visible:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-44">
              <Select
                value={filterJobId}
                onChange={(e) => setFilterJobId(e.target.value)}
                aria-label="Filter by job"
              >
                <option value="">All Jobs ({jobs.length})</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </Select>
            </div>

            <div className="w-44">
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.filter(Boolean).map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              type="number"
              placeholder="Min Score"
              min="0"
              max="100"
              value={filterMinScore}
              onChange={(e) => setFilterMinScore(e.target.value)}
              className="w-28 tabular-nums"
              aria-label="Minimum score"
            />

            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-40 cursor-pointer"
              aria-label="Filter by applied date"
            />

            {hasActiveFilters && (
              <Button
                type="button"
                variant="secondary"
                size="default"
                onClick={resetFilters}
                title="Reset all filters"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Candidate Applications Data Table */}
      <Card className="overflow-hidden py-0 gap-0">
        {loading ? (
          <div className="p-16 text-center text-neutral-400 space-y-3">
            <Loader2 className="mx-auto size-6 animate-spin text-neutral-900" />
            <p className="text-xs sm:text-sm font-medium">Loading candidate applications…</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-400">
              <Search className="size-5" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900">No applications found</h3>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
              {hasActiveFilters
                ? "No candidates matched your current filter criteria. Try clearing some filters."
                : "No candidate applications have been received yet."}
            </p>
            {hasActiveFilters && (
              <Button type="button" size="sm" onClick={resetFilters} className="mt-2">
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Candidate</TableHead>
                <TableHead>Target Position</TableHead>
                <TableHead>AI Score</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((app) => {
                const score = app.screening?.total_score ?? null;
                const max = app.screening?.max_score ?? 100;
                const scorePct = score != null ? Math.round((score / max) * 100) : null;

                return (
                  <TableRow
                    key={app.id}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/hr/review/${app.id}`)}
                  >
                    {/* Candidate Column */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-xs font-semibold text-neutral-800">
                          {getInitials(app.candidate_name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/hr/review/${app.id}`}
                              className="font-semibold text-neutral-950 group-hover:underline text-xs sm:text-sm truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {app.candidate_name || "Unknown Candidate"}
                            </Link>
                            {app.cv_storage_path && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/hr/review/${app.id}/cv`, "_blank");
                                }}
                                title="View original PDF CV"
                                className="shrink-0 rounded p-1 text-neutral-400 hover:bg-neutral-200/70 hover:text-neutral-900 transition-colors cursor-pointer"
                              >
                                <FileText className="size-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="truncate text-xs text-neutral-500 mt-0.5">
                            {app.candidate_email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Job Title Column */}
                    <TableCell>
                      <Badge variant="outline" className="bg-neutral-50 font-medium text-neutral-800">
                        {app.job_title}
                      </Badge>
                    </TableCell>

                    {/* AI Score Column */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Progress
                          value={score ?? 0}
                          max={max}
                          className="h-1.5 w-16 sm:w-20 shrink-0"
                          aria-label="Screening score"
                        />
                        <span
                          className={cn(
                            "text-xs font-semibold tabular-nums whitespace-nowrap",
                            scorePct == null
                              ? "text-neutral-400"
                              : scorePct >= 70
                                ? "text-emerald-700"
                                : scorePct >= 50
                                  ? "text-amber-700"
                                  : "text-red-600"
                          )}
                        >
                          {score == null ? "—" : `${score}/${max}`}
                        </span>
                      </div>
                    </TableCell>

                    {/* Qualification Badge */}
                    <TableCell>
                      <QualificationBadge
                        classification={app.screening?.classification}
                        isQualified={app.screening?.is_qualified}
                      />
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <StatusBadge status={app.status} />
                    </TableCell>

                    {/* Applied Date */}
                    <TableCell className="whitespace-nowrap text-xs tabular-nums text-neutral-500">
                      {formatDate(app.applied_at)}
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/hr/review/${app.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(buttonVariants({ variant: "outline", size: "xs" }))}
                        >
                          <span>Review</span>
                          <ArrowUpRight className="size-3" />
                        </Link>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(app.id);
                          }}
                          className="text-neutral-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete candidate application"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

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
