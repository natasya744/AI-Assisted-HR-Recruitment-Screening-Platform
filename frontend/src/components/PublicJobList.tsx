import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Briefcase } from "lucide-react";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { PublicJob } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PublicJobList() {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<PublicJob[]>("/api/public/jobs")
      .then((data) => {
        if (!cancelled) setJobs(data);
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

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
          Open Positions
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Choose a role to view its details and apply.
        </p>
      </div>

      {loading ? (
        <Card className="p-10 text-center text-xs text-neutral-500">Loading positions…</Card>
      ) : error ? (
        <Card className="p-10 text-center space-y-2">
          <AlertCircle className="mx-auto size-6 text-red-500" />
          <p className="text-xs text-red-600">{error}</p>
        </Card>
      ) : jobs.length === 0 ? (
        <Card className="p-10 text-center space-y-2">
          <Briefcase className="mx-auto size-6 text-neutral-400" />
          <p className="text-sm font-semibold text-neutral-900">No open positions yet</p>
          <p className="text-xs text-neutral-500">Please check back later.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {jobs.map((job) => (
            <Card key={job.id} className="justify-between transition-colors hover:border-neutral-300">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900">
                    <Briefcase className="size-5" />
                  </div>
                  <Badge variant="success">Open</Badge>
                </div>
                <CardTitle className="text-base sm:text-lg">{job.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {job.description ? (
                  <p className="line-clamp-3 text-xs leading-relaxed text-neutral-500">
                    {job.description}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-400">No detailed description provided.</p>
                )}
              </CardContent>
              <CardFooter className="pt-2">
                <Link
                  to={`/apply/${job.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "w-full justify-between",
                  )}
                >
                  <span>Apply for this position</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
