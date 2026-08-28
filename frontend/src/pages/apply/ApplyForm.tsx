import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/http";
import type { ApplicationCreated, Job } from "@/lib/types";

const MAX_CV_SIZE_BYTES = 10 * 1024 * 1024;

const inputClasses =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:border-slate-400 focus:outline-none";
const labelClasses = "block text-xs font-medium uppercase tracking-wide text-slate-400";

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const data = error.data as { detail?: unknown } | null;
    if (data && typeof data.detail === "string") return data.detail;
    if (data && Array.isArray(data.detail)) {
      return data.detail
        .map((item) => (item as { msg?: string }).msg ?? "")
        .filter(Boolean)
        .join(", ");
    }
    if (error.isNetworkError) return "Cannot reach the server. Please try again.";
    return error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

function validateCv(file: File): string | null {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Please attach a PDF file.";
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > MAX_CV_SIZE_BYTES) return "The CV must be 10 MB or smaller.";
  return null;
}

export default function ApplyForm() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [jobId, setJobId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Job[]>("/api/jobs")
      .then((openJobs) => {
        if (cancelled) return;
        setJobs(openJobs);
        if (openJobs.length > 0) setJobId(openJobs[0].id);
      })
      .catch((err: unknown) => {
        if (!cancelled) setJobsError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function onCvChange(file: File | null) {
    setCvError(null);
    if (file) {
      const problem = validateCv(file);
      if (problem) {
        setCvError(problem);
        setCv(null);
        return;
      }
    }
    setCv(file);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!jobId || !cv) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = new FormData();
      data.set("job_id", jobId);
      data.set("full_name", fullName);
      data.set("email", email);
      data.set("phone", phone);
      data.set("location", location);
      data.set("linkedin_url", linkedinUrl);
      data.set("cv", cv);
      const created = await api.post<ApplicationCreated>("/api/applications", data);
      setApplicationId(created.id);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (applicationId) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Application received</h1>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-700">
          Thank you! Your application has been submitted and your CV is being processed.
        </div>
        <p className="text-xs text-slate-400">Reference: {applicationId}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-800">Apply for a Position</h1>
        <p className="text-slate-500 text-sm">
          Submit your application and CV. The system will process and screen your profile
          automatically.
        </p>
      </div>

      {jobsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {jobsError}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
          There are no open positions right now.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div className="space-y-1">
            <label htmlFor="job" className={labelClasses}>
              Position
            </label>
            <select
              id="job"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className={inputClasses}
              required
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="full_name" className={labelClasses}>
              Full name
            </label>
            <input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClasses}
              placeholder="Your full name"
              maxLength={200}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="email" className={labelClasses}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                placeholder="you@example.com"
                maxLength={320}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="phone" className={labelClasses}>
                Phone (optional)
              </label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClasses}
                placeholder="+62 ..."
                maxLength={40}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="location" className={labelClasses}>
                Location (optional)
              </label>
              <input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClasses}
                placeholder="City, Country"
                maxLength={200}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="linkedin_url" className={labelClasses}>
                LinkedIn (optional)
              </label>
              <input
                id="linkedin_url"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className={inputClasses}
                placeholder="https://linkedin.com/in/..."
                maxLength={500}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="cv" className={labelClasses}>
              CV (PDF, max 10 MB)
            </label>
            <input
              id="cv"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => onCvChange(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
              required
            />
            {cvError && <p className="text-xs text-red-500">{cvError}</p>}
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !cv || !jobId}
            className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit application"}
          </button>
        </form>
      )}
    </div>
  );
}
