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
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="space-y-12 py-2">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white px-6 py-12 sm:px-12 sm:py-16 text-center shadow-2xs">
        <div className="mx-auto max-w-3xl space-y-5">
          <Badge variant="secondary" className="px-3 py-1 text-xs font-medium text-neutral-700">
            <Sparkles className="size-3.5 text-neutral-700" />
            AI Screening & Candidate Assessment
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl lg:text-5xl text-balance">
            Streamlined Recruitment with Explainable AI
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-neutral-500 text-pretty">
            End-to-end CV processing, transparent scoring criteria, deterministic rule matching,
            and human-in-the-loop decision workflows.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/apply"
              className={cn(buttonVariants({ variant: "default", size: "lg" }), "px-6")}
            >
              <UserPlus className="size-4" />
              Apply for a Position
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/hr"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-6")}
            >
              <LayoutDashboard className="size-4 text-neutral-600" />
              Open HR Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Main Portals Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
              Platform Portals
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Access the candidate application portal, HR screening dashboard, and job management
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Portal 1: Apply */}
          <Card className="justify-between transition-colors hover:border-neutral-300">
            <div className="space-y-4">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900">
                    <UserPlus className="size-5" />
                  </div>
                  <Badge variant="outline">Candidate Portal</Badge>
                </div>
                <CardTitle>Apply for Positions</CardTitle>
                <CardDescription className="leading-relaxed">
                  Public candidate application flow. Upload PDF resumes with automated size verification and multi-field validation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-neutral-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-neutral-900 shrink-0" />
                    PDF CV Upload & Supabase Storage
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-neutral-900 shrink-0" />
                    Real-time application reference ID
                  </li>
                </ul>
              </CardContent>
            </div>
            <CardFooter className="pt-2">
              <Link
                to="/apply"
                className={cn(buttonVariants({ variant: "outline", size: "default" }), "w-full justify-between")}
              >
                <span>Submit Application</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </CardFooter>
          </Card>

          {/* Portal 2: HR Dashboard */}
          <Card className="justify-between border-neutral-900/20 bg-white transition-colors hover:border-neutral-900/40">
            <div className="space-y-4">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-neutral-950 text-white">
                    <LayoutDashboard className="size-5" />
                  </div>
                  <Badge variant="default">Recruiter Console</Badge>
                </div>
                <CardTitle>HR Screening Dashboard</CardTitle>
                <CardDescription className="leading-relaxed">
                  Review incoming applications, inspect AI qualification scores, filter candidate pipelines, and export to Excel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-neutral-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-neutral-900 shrink-0" />
                    Multi-parameter search & filters
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-neutral-900 shrink-0" />
                    Excel export with complete screening audit
                  </li>
                </ul>
              </CardContent>
            </div>
            <CardFooter className="pt-2">
              <Link
                to="/hr"
                className={cn(buttonVariants({ variant: "default", size: "default" }), "w-full justify-between")}
              >
                <span>Open Dashboard</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </CardFooter>
          </Card>

          {/* Portal 3: Job Management */}
          <Card className="justify-between transition-colors hover:border-neutral-300">
            <div className="space-y-4">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900">
                    <Briefcase className="size-5" />
                  </div>
                  <Badge variant="outline">Requisitions</Badge>
                </div>
                <CardTitle>Create & Manage Jobs</CardTitle>
                <CardDescription className="leading-relaxed">
                  Define job openings, customize required skills, education thresholds, and configure weighted scoring rules for the AI.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-neutral-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-neutral-900 shrink-0" />
                    Custom score weight allocation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-neutral-900 shrink-0" />
                    Full job description ingestion for AI matching
                  </li>
                </ul>
              </CardContent>
            </div>
            <CardFooter className="pt-2">
              <Link
                to="/hr/jobs"
                className={cn(buttonVariants({ variant: "outline", size: "default" }), "w-full justify-between")}
              >
                <span>Manage Job Postings</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Architecture & AI Transparency Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>How the Screening Engine Works</CardTitle>
          <CardDescription>
            A reliable blend of AI extraction, deterministic business rules, and human oversight.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2.5 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
              <div className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-900">
                <FileCheck2 className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-950">1. Document Intelligence</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Extracts text, structured fields, skills, and work history from candidate CVs with field-level provenance.
              </p>
            </div>

            <div className="space-y-2.5 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
              <div className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-900">
                <Cpu className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-950">2. Deterministic Scoring</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Calculates experience, skill matching, and education against job requirements with custom weights.
              </p>
            </div>

            <div className="space-y-2.5 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
              <div className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-900">
                <ShieldCheck className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-950">3. Alignment Verification</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Flags discrepancies between self-reported form data and extracted PDF content without auto-tampering.
              </p>
            </div>

            <div className="space-y-2.5 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
              <div className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-900">
                <FileSpreadsheet className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-950">4. Human Decision</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                HR recruiters make final decisions with full audit logs, one-click CV review, and Excel reporting.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
