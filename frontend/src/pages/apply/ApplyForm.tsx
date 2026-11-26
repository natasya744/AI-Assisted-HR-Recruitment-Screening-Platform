import { useEffect, useState, useRef, type FormEvent, type DragEvent } from "react";
import { useParams } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ArrowRight,
  RotateCcw,
  Loader2,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/http";
import { getErrorMessage } from "@/lib/errors";
import type { ApplicationCreated, PublicJob } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import PublicJobList from "@/components/PublicJobList";

const MAX_CV_SIZE_BYTES = 10 * 1024 * 1024;

function validateCv(file: File): string | null {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Please attach a PDF document.";
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > MAX_CV_SIZE_BYTES) return "The CV must be 10 MB or smaller.";
  return null;
}

export default function ApplyForm() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<PublicJob | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!jobId) {
      setJobLoading(false);
      return;
    }
    let cancelled = false;
    setJobLoading(true);
    api
      .get<PublicJob>(`/api/public/jobs/${jobId}`)
      .then((data) => {
        if (cancelled) return;
        setJob(data);
        setJobError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setJob(null);
        setJobError(
          err instanceof ApiError && err.status === 404
            ? "This position is no longer available."
            : getErrorMessage(err),
        );
      })
      .finally(() => {
        if (!cancelled) setJobLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  function handleFileSelected(file: File | null) {
    setCvError(null);
    if (!file) {
      setCv(null);
      return;
    }
    const problem = validateCv(file);
    if (problem) {
      setCvError(problem);
      setCv(null);
      return;
    }
    setCv(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  }

  function resetForm() {
    setApplicationId(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setLocation("");
    setLinkedinUrl("");
    setCv(null);
    setCvError(null);
    setError(null);
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
      const created = await api.post<ApplicationCreated>("/api/applications", data, {
        timeout: 120_000,
      });
      setApplicationId(created.id);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (applicationId) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <Card className="p-8 sm:p-10 text-center space-y-6">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="size-7" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
              Application Submitted
            </h1>
            <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
              Thank you for applying. Your application has been securely received by our team.
              We will review it and be in touch with you soon.
            </p>
          </div>

          <div className="flex items-center justify-center pt-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              <RotateCcw className="size-3.5" />
              Submit Another Application
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Badge variant="secondary" className="mb-2">
            <Briefcase className="size-3" />
            Candidate Application
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
            Apply for a Position
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Submit your resume and contact information for review by our team.
          </p>
        </div>
      </div>

      {!jobId ? (
        <PublicJobList />
      ) : jobLoading ? (
        <Card className="p-12 text-center space-y-3">
          <Loader2 className="mx-auto size-6 animate-spin text-neutral-400" />
          <p className="text-xs text-neutral-500">Loading position…</p>
        </Card>
      ) : jobError || !job ? (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-400">
            <Briefcase className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900">Position unavailable</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {jobError ?? "This position is no longer available."}
          </p>
        </Card>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <Card className="overflow-hidden py-0 gap-0">
            <div className="border-b border-neutral-200 bg-neutral-50/60 p-6 sm:p-7 space-y-2.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                1. Applying For
              </Label>
              <div className="flex items-center gap-2">
                <Briefcase className="size-4 text-neutral-500" />
                <span className="font-semibold text-neutral-900">{job.title}</span>
              </div>
              {job.description && (
                <p className="whitespace-pre-line text-xs leading-relaxed text-neutral-600">
                  {job.description}
                </p>
              )}
            </div>

            <CardContent className="p-6 sm:p-7 space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                2. Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name">
                    <User className="size-3.5 text-neutral-400" />
                    Full Name *
                  </Label>
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    maxLength={200}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">
                    <Mail className="size-3.5 text-neutral-400" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.morgan@example.com"
                    maxLength={320}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    <Phone className="size-3.5 text-neutral-400" />
                    Phone Number (optional)
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 812 3456 7890"
                    maxLength={40}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location">
                    <MapPin className="size-3.5 text-neutral-400" />
                    Current Location (optional)
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Jakarta, Indonesia"
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="linkedin_url">
                  <Linkedin className="size-3.5 text-neutral-400" />
                  LinkedIn Profile (optional)
                </Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/alexmorgan"
                  maxLength={500}
                />
              </div>
            </CardContent>

            <div className="border-t border-neutral-200 bg-neutral-50/50 p-6 sm:p-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  3. Resume / Curriculum Vitae *
                </h3>
                <span className="text-[11px] text-neutral-400 font-medium">PDF format only · Max 10MB</span>
              </div>

              <input
                ref={fileInputRef}
                id="cv"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
                className="hidden"
                required={!cv}
              />

              {!cv ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all",
                    isDragging
                      ? "border-neutral-950 bg-neutral-100/80 scale-[0.99]"
                      : "border-neutral-300 bg-white hover:border-neutral-500 hover:bg-neutral-50"
                  )}
                >
                  <div className="flex size-11 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700 group-hover:scale-105 transition-transform mb-3">
                    <UploadCloud className="size-5" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">
                    Click to browse or drag and drop your PDF CV
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Your resume will be reviewed as part of your application.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-neutral-300 bg-white p-4 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-950 text-white">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="truncate text-xs sm:text-sm font-semibold text-neutral-950">
                        {cv.name}
                      </p>
                      <p className="text-[11px] text-neutral-500 tabular-nums">
                        {(cv.size / (1024 * 1024)).toFixed(2)} MB · Ready for submission
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setCv(null)}
                      title="Remove file"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              )}

              {cvError && (
                <div className="flex items-center gap-2 text-xs text-red-600 mt-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{cvError}</span>
                </div>
              )}
            </div>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div>
                <AlertTitle>Submission Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex items-center justify-end pt-1">
            <Button
              type="submit"
              size="lg"
              disabled={submitting || !cv || !jobId}
              className="w-full sm:w-auto px-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Waiting for processing…</span>
                </>
              ) : (
                <>
                  <ArrowRight className="size-4" />
                  <span>Submit Application</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
