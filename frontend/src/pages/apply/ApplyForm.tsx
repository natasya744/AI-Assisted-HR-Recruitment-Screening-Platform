import { useEffect, useState, useRef, type FormEvent, type DragEvent } from "react";
import { Link } from "react-router-dom";
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
  Sparkles,
  Loader2,
  X,
  Eye,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { ApplicationCreated, Job } from "@/lib/types";

const MAX_CV_SIZE_BYTES = 10 * 1024 * 1024;

function validateCv(file: File): string | null {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Please attach a PDF document.";
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
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (jobs.length > 0) setJobId(jobs[0].id);
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

  const selectedJob = jobs.find((j) => j.id === jobId);

  // Success Screen
  if (applicationId) {
    return (
      <div className="mx-auto max-w-2xl py-6">
        <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white p-8 sm:p-10 shadow-lg shadow-emerald-500/5 text-center space-y-6">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
            <CheckCircle2 className="size-9" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Application Submitted!
            </h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Your application and CV have been securely received. Our AI screening engine is
              evaluating your profile against the position requirements.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 text-left space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Application Reference ID:</span>
              <span className="font-mono font-semibold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                {applicationId}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Position Applied:</span>
              <span className="font-medium text-indigo-700">{selectedJob?.title || "Role"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Candidate:</span>
              <span className="font-medium text-slate-800">{fullName || email}</span>
            </div>
          </div>

          {/* Timeline What Happens Next */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-3 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-indigo-600" />
              What happens next?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="rounded-xl bg-white p-3 border border-indigo-100/60 shadow-2xs">
                <span className="font-semibold text-slate-900 block mb-0.5">1. CV Parsing</span>
                <span>Document text and skills extracted</span>
              </div>
              <div className="rounded-xl bg-white p-3 border border-indigo-100/60 shadow-2xs">
                <span className="font-semibold text-slate-900 block mb-0.5">2. Match Scoring</span>
                <span>Automated criteria & qualification check</span>
              </div>
              <div className="rounded-xl bg-white p-3 border border-indigo-100/60 shadow-2xs">
                <span className="font-semibold text-slate-900 block mb-0.5">3. HR Review</span>
                <span>Recruiter makes final hiring decision</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="size-3.5" />
              Submit Another Application
            </button>
            <Link
              to="/hr"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              View in HR Dashboard
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 mb-2">
            <Briefcase className="size-3 text-indigo-600" />
            Candidate Application
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Apply for a Position
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Submit your resume and contact information for automated AI evaluation and recruiter review.
          </p>
        </div>

        <Link
          to="/hr"
          className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          Recruiter Login
          <ArrowRight className="size-3.5 text-slate-400" />
        </Link>
      </div>

      {jobsError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="size-5 text-red-500 shrink-0" />
          <span>Error loading job listings: {jobsError}</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Briefcase className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No Open Positions</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no active job requisitions. Please check back later or create a job in the HR portal.
          </p>
          <Link
            to="/hr/jobs"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors mt-2"
          >
            Create a Job Posting
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Main Card Container */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
            {/* Section 1: Role Selection */}
            <div className="border-b border-slate-100 bg-slate-50/50 p-6 sm:p-7">
              <label htmlFor="job" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                1. Select Target Position *
              </label>
              <div className="relative">
                <select
                  id="job"
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-3 focus:ring-indigo-500/10 cursor-pointer"
                  required
                >
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} — ({job.min_experience_years}y min exp)
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <Briefcase className="size-4" />
                </div>
              </div>

              {selectedJob && (
                <div className="mt-3 rounded-2xl bg-white p-4 border border-slate-200/80 text-xs text-slate-600 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                      <Briefcase className="size-3.5 text-indigo-600" />
                      Job Overview & Requirements
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowJobModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      <Eye className="size-3 text-indigo-600" />
                      <span>View Full Job Details</span>
                    </button>
                  </div>
                  {selectedJob.description && (
                    <p className="line-clamp-2 leading-relaxed text-slate-500">
                      {selectedJob.description}
                    </p>
                  )}
                  {selectedJob.required_skills?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[11px] font-medium text-slate-400 mr-1">Skills:</span>
                      {selectedJob.required_skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md border border-indigo-100 bg-indigo-50/60 px-2 py-0.5 text-[11px] font-medium text-indigo-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 2: Personal & Contact Information */}
            <div className="p-6 sm:p-7 space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="full_name" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <User className="size-3.5 text-slate-400" />
                    Full Name *
                  </label>
                  <input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-3 focus:ring-indigo-500/10 transition-all"
                    placeholder="e.g. Alex Morgan"
                    maxLength={200}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="size-3.5 text-slate-400" />
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-3 focus:ring-indigo-500/10 transition-all"
                    placeholder="alex.morgan@example.com"
                    maxLength={320}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Phone className="size-3.5 text-slate-400" />
                    Phone Number (optional)
                  </label>
                  <input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-3 focus:ring-indigo-500/10 transition-all"
                    placeholder="+62 812 3456 7890"
                    maxLength={40}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="location" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-slate-400" />
                    Current Location (optional)
                  </label>
                  <input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-3 focus:ring-indigo-500/10 transition-all"
                    placeholder="Jakarta, Indonesia"
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="linkedin_url" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Linkedin className="size-3.5 text-slate-400" />
                  LinkedIn Profile (optional)
                </label>
                <input
                  id="linkedin_url"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-3 focus:ring-indigo-500/10 transition-all"
                  placeholder="https://linkedin.com/in/alexmorgan"
                  maxLength={500}
                />
              </div>
            </div>

            {/* Section 3: CV Upload Dropzone */}
            <div className="border-t border-slate-100 bg-slate-50/40 p-6 sm:p-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  3. Resume / Curriculum Vitae *
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">PDF format only · Max 10MB</span>
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
                  className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-50/80 scale-[0.99]"
                      : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/50 shadow-2xs"
                  }`}
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform mb-3">
                    <UploadCloud className="size-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    Click to browse or drag and drop your PDF CV
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Our AI will analyze your experience, skills, and education automatically
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="truncate text-xs sm:text-sm font-semibold text-slate-900">
                        {cv.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {(cv.size / (1024 * 1024)).toFixed(2)} MB · Ready for submission
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setCv(null)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                      title="Remove file"
                    >
                      <X className="size-4" />
                    </button>
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
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-start gap-3">
              <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Submission Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !cv || !jobId}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Processing CV with AI…</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Full Job Details Modal */}
      {showJobModal && selectedJob && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowJobModal(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 p-6 sm:p-7 border-b border-slate-100 bg-slate-50/70">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                  <Briefcase className="size-3 text-indigo-600" />
                  Position Details
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {selectedJob.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <Briefcase className="size-3 text-slate-400" />
                    Min Experience: <strong className="text-slate-800">{selectedJob.min_experience_years} years</strong>
                  </span>
                  {selectedJob.is_open && (
                    <span className="inline-flex items-center gap-1 font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="size-3 text-emerald-600" />
                      Active Opening
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowJobModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 sm:p-7 space-y-6 flex-1 text-sm">
              {/* Full Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="size-3.5 text-indigo-600" />
                  Job Description & Responsibilities
                </h3>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5 text-slate-700 leading-relaxed text-xs sm:text-sm whitespace-pre-line">
                  {selectedJob.description || "No detailed description provided."}
                </div>
              </div>

              {/* Required Skills */}
              {selectedJob.required_skills?.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Required Skills & Technical Competencies ({selectedJob.required_skills.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.required_skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-xl border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-xs font-medium text-indigo-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education Requirements */}
              {selectedJob.education_requirements?.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <GraduationCap className="size-3.5 text-indigo-600" />
                    Educational Background Requirements
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.education_requirements.map((edu) => (
                      <span
                        key={edu}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {edu}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowJobModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setShowJobModal(false)}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              >
                Continue Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

