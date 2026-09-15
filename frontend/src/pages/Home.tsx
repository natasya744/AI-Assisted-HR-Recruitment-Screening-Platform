import { Link } from "react-router-dom";
import {
  UserPlus,
  LayoutDashboard,
  Briefcase,
  Sparkles,
  FileCheck2,
  Cpu,
  ShieldCheck,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-b from-indigo-50/70 via-white to-white p-8 sm:p-12 text-center shadow-xs">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-2xs">
            <Sparkles className="size-3.5 text-indigo-500" />
            Next-Gen AI Screening & Candidate Assessment
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl" style={{ color: '#1e1b4b' }}>
            Streamlined Recruitment with{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-sky-600 bg-clip-text text-transparent">Explainable AI</span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600">
            End-to-end CV processing, transparent scoring criteria, deterministic rule matching,
            and human-in-the-loop decision workflows.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 hover:shadow-lg transition-all"
            >
              <UserPlus className="size-4" />
              Apply for a Position
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/hr"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-indigo-600 transition-all"
            >
              <LayoutDashboard className="size-4 text-slate-500" />
              Open HR Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Portals Grid (Consistent frame and equal sizing) */}
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: '#312e81' }}>Platform Portals</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Access the candidate application portal, HR screening dashboard, and job management
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Portal 1: Apply */}
          <div className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 group-hover:scale-105 transition-transform">
                  <UserPlus className="size-6" />
                </div>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">
                  Candidate Portal
                </span>
              </div>
              <h3 className="text-lg font-bold" style={{ color: '#1e293b' }}>Apply for Positions</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Public candidate application flow. Upload PDF resumes with automated size verification and multi-field validation.
              </p>
              <ul className="space-y-1.5 pt-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  PDF CV Upload & Supabase Storage
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  Real-time application reference ID
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                to="/apply"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-600 transition-colors"
              >
                Submit Application
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Portal 2: HR Dashboard */}
          <div className="group flex flex-col justify-between rounded-2xl border border-indigo-200/80 bg-white p-6 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-indigo-500 to-sky-500" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
                  <LayoutDashboard className="size-6" />
                </div>
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                  Recruiter Console
                </span>
              </div>
              <h3 className="text-lg font-bold" style={{ color: '#1e293b' }}>HR Screening Dashboard</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Review incoming applications, inspect AI qualification scores, filter candidate pipelines, and export to Excel.
              </p>
              <ul className="space-y-1.5 pt-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  Multi-parameter search & filters
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  Excel export with complete screening audit
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                to="/hr"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                Open Dashboard
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Portal 3: Job Management */}
          <div className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600 group-hover:scale-105 transition-transform">
                  <Briefcase className="size-6" />
                </div>
                <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                  Requisitions
                </span>
              </div>
              <h3 className="text-lg font-bold" style={{ color: '#1e293b' }}>Create & Manage Jobs</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Define job openings, customize required skills, education thresholds, and configure weighted scoring rules for the AI.
              </p>
              <ul className="space-y-1.5 pt-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  Custom score weight allocation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  Full job description ingestion for AI matching
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                to="/hr/jobs"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-600 transition-colors"
              >
                Manage Job Postings
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture & AI Transparency Highlights */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="mb-6">
          <h2 className="text-lg font-bold" style={{ color: '#312e81' }}>How the Screening Engine Works</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A reliable blend of AI extraction, deterministic business rules, and human oversight.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <FileCheck2 className="size-4" />
            </div>
            <h4 className="text-sm font-semibold" style={{ color: '#1e293b' }}>1. Document Intelligence</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Extracts text, structured fields, skills, and work history from candidate CVs with field-level provenance.
            </p>
          </div>

          <div className="space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <Cpu className="size-4" />
            </div>
            <h4 className="text-sm font-semibold" style={{ color: '#1e293b' }}>2. Deterministic Scoring</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Calculates experience, skill matching, and education against job requirements with custom weights.
            </p>
          </div>

          <div className="space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <ShieldCheck className="size-4" />
            </div>
            <h4 className="text-sm font-semibold" style={{ color: '#1e293b' }}>3. Alignment Verification</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Flags discrepancies between self-reported form data and extracted PDF content without auto-tampering.
            </p>
          </div>

          <div className="space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="size-4" />
            </div>
            <h4 className="text-sm font-semibold" style={{ color: '#1e293b' }}>4. Human Decision</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              HR recruiters make final decisions with full audit logs, one-click CV review, and Excel reporting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}