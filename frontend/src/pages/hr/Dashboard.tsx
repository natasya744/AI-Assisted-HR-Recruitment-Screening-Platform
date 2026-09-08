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
import type { ApplicationListItem } from "@/lib/types";

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ApplicationListItem[]>("/api/applications")
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
  }, []);

  const qualified = applications.filter((a) => a.screening?.is_qualified === true).length;
  const notQualified = applications.filter((a) => a.screening?.is_qualified === false).length;
  const pending = applications.filter((a) => a.screening == null).length;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-800">HR Dashboard</h1>
        <p className="text-sm text-slate-500">
          Review, screen, and manage candidate applications.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {!loading && !error && applications.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Applications"
            value={String(applications.length)}
            hint="Total received"
          />
          <StatCard
            label="Qualified"
            value={String(qualified)}
            hint="Above threshold"
          />
          <StatCard
            label="Not qualified"
            value={String(notQualified)}
            hint={`${pending} awaiting screening`}
          />
        </div>
      ) : null}

      {!loading && !error && applications.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-400">No applications yet.</p>
          <p className="mt-1 text-xs text-slate-400">
            They will appear here as soon as candidates apply.
          </p>
        </div>
      ) : null}

      {applications.length > 0 ? (
        <Card className="gap-0 overflow-hidden rounded-xl py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[26%] pl-5">Candidate</TableHead>
                <TableHead className="w-[18%]">Job</TableHead>
                <TableHead className="w-[20%]">Score</TableHead>
                <TableHead className="w-[16%]">Verdict</TableHead>
                <TableHead className="w-[12%]">Status</TableHead>
                <TableHead className="w-[8%] pr-5 text-right">Applied</TableHead>
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
                      <Link
                        to={`/hr/review/${app.id}`}
                        className="font-medium text-slate-800 group-hover:text-indigo-700"
                      >
                        {app.candidate_name}
                      </Link>
                      <p className="truncate text-xs text-slate-400">{app.candidate_email}</p>
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
