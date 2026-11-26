import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Sliders,
  GraduationCap,
  Award,
  AlertCircle,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { Job, JobCreate } from "@/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";
import TagInput from "@/components/TagInput";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const DEFAULT_WEIGHTS = { skills: 30, experience: 30, education: 20, other: 20 };

function emptyForm(): JobCreate {
  return {
    title: "",
    description: "",
    min_experience_years: 0,
    required_skills: [],
    education_requirements: [],
    score_weights: DEFAULT_WEIGHTS,
  };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form, setForm] = useState<JobCreate>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function handleCopyLink(jobId: string) {
    const url = new URL(`/apply/${jobId}`, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedJobId(jobId);
      window.setTimeout(() => setCopiedJobId(null), 2000);
    } catch {
      setError("Could not copy the link. Use the Public Apply Link instead.");
    }
  }

  async function loadJobs() {
    try {
      setLoading(true);
      const data = await api.get<Job[]>("/api/jobs");
      setJobs(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(emptyForm());
    setEditingJob(null);
    setFormError(null);
  }

  function handleChange<K extends keyof JobCreate>(field: K, value: JobCreate[K]) {
    setForm((prev: JobCreate) => ({ ...prev, [field]: value }));
  }

  function handleWeightChange(key: string, val: number) {
    setForm((prev) => ({
      ...prev,
      score_weights: {
        ...prev.score_weights,
        [key]: val,
      },
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const payload: JobCreate = { ...form };
      if (editingJob) {
        await api.put(`/api/jobs/${editingJob.id}`, payload);
      } else {
        await api.post("/api/jobs", payload);
      }
      resetForm();
      setShowForm(false);
      await loadJobs();
    } catch (err: unknown) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(job: Job) {
    setEditingJob(job);
    setForm({
      title: job.title,
      description: job.description || "",
      min_experience_years: job.min_experience_years,
      required_skills: job.required_skills,
      education_requirements: job.education_requirements,
      score_weights: job.score_weights || DEFAULT_WEIGHTS,
    });
    setShowForm(true);
  }

  async function handleDeleteJob(jobId: string) {
    try {
      await api.delete(`/api/jobs/${jobId}`);
      setDeleteConfirmId(null);
      await loadJobs();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  const currentWeights = form.score_weights || DEFAULT_WEIGHTS;
  const totalWeight = Object.values(currentWeights).reduce((sum, w) => sum + (Number(w) || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Link
            to="/hr"
            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-950 transition-colors"
          >
            <ChevronLeft className="size-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 mt-2">
            Job Requisitions
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Configure job openings, skill criteria, and customized scoring weights for automated AI screening.
          </p>
        </div>

        <Button
          type="button"
          onClick={openCreate}
          className="self-start sm:self-center"
        >
          <Plus className="size-4" />
          <span>Create New Job</span>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Jobs Grid / List */}
      {loading ? (
        <div className="p-16 text-center text-neutral-400 space-y-3">
          <Loader2 className="mx-auto size-6 animate-spin text-neutral-900" />
          <p className="text-xs sm:text-sm font-medium">Loading job requisitions…</p>
        </div>
      ) : jobs.length === 0 ? (
        <Card className="p-16 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-400">
            <Briefcase className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900">No Job Requisitions Yet</h3>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
            Create your first job posting to start receiving and screening candidate applications.
          </p>
          <div className="pt-2">
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              Create Job Posting
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => {
            const weights = job.score_weights || DEFAULT_WEIGHTS;
            return (
              <Card
                key={job.id}
                className="group justify-between transition-colors hover:border-neutral-300"
              >
                <div className="space-y-4">
                  <CardHeader className="pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <Badge variant="secondary" className="text-[11px]">
                          {job.min_experience_years > 0
                            ? `${job.min_experience_years}y+ min experience`
                            : "Entry level"}
                        </Badge>
                        <h3 className="text-lg font-semibold tracking-tight text-neutral-950">
                          {job.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => startEdit(job)}
                          title="Edit Job"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteConfirmId(job.id)}
                          className="text-neutral-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete Job"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {job.description && (
                      <p className="line-clamp-3 text-xs sm:text-sm text-neutral-500 leading-relaxed">
                        {job.description}
                      </p>
                    )}

                    {/* Skills Chips */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                        <Award className="size-3" />
                        Required Skills ({job.required_skills?.length ?? 0})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {job.required_skills?.length > 0 ? (
                          job.required_skills.map((s) => (
                            <Badge key={s} variant="outline" className="bg-neutral-50 text-[11px]">
                              {s}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-neutral-400 italic">None specified</span>
                        )}
                      </div>
                    </div>

                    {/* Education Chips */}
                    {job.education_requirements && job.education_requirements.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                          <GraduationCap className="size-3" />
                          Education
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {job.education_requirements.map((edu) => (
                            <Badge key={edu} variant="outline" className="bg-neutral-50 text-[11px]">
                              {edu}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Score Weights Breakdown Visualizer */}
                    <div className="rounded-xl bg-neutral-50/80 p-3.5 border border-neutral-200/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-600">
                        <span className="flex items-center gap-1.5">
                          <Sliders className="size-3 text-neutral-500" />
                          AI Score Weights
                        </span>
                        <span className="text-neutral-400 font-normal">Total 100%</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                        <div className="rounded-lg bg-white p-2 border border-neutral-200/80">
                          <span className="text-neutral-400 block text-[10px]">Skills</span>
                          <span className="font-semibold tabular-nums text-neutral-950">{weights.skills ?? 30}%</span>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-neutral-200/80">
                          <span className="text-neutral-400 block text-[10px]">Exp</span>
                          <span className="font-semibold tabular-nums text-neutral-950">{weights.experience ?? 30}%</span>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-neutral-200/80">
                          <span className="text-neutral-400 block text-[10px]">Edu</span>
                          <span className="font-semibold tabular-nums text-neutral-950">{weights.education ?? 20}%</span>
                        </div>
                        <div className="rounded-lg bg-white p-2 border border-neutral-200/80">
                          <span className="text-neutral-400 block text-[10px]">Other</span>
                          <span className="font-semibold tabular-nums text-neutral-950">{weights.other ?? 20}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-4 border-t border-neutral-100 justify-between text-xs text-neutral-400 gap-3">
                  <span className="font-mono text-[11px]">ID: {job.id.slice(0, 8)}…</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void handleCopyLink(job.id)}
                      className="font-medium text-neutral-500 hover:text-neutral-950 transition-colors"
                      title="Copy the public apply link for this job"
                    >
                      {copiedJobId === job.id ? "Copied!" : "Copy Apply Link"}
                    </button>
                    <Link
                      to={`/apply/${job.id}`}
                      className="font-medium text-neutral-700 hover:text-neutral-950 transition-colors"
                    >
                      Public Apply Link →
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent
          onClose={() => setShowForm(false)}
          className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-6"
        >
          <DialogHeader className="border-b border-neutral-200 pb-4 pr-8">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900">
                <Briefcase className="size-5" />
              </div>
              <div>
                <DialogTitle>
                  {editingJob ? "Edit Job Requisition" : "Create New Job Requisition"}
                </DialogTitle>
                <DialogDescription>
                  Provide the job details and configure AI evaluation scoring weights.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Job Title *
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleChange("title", e.target.value)
                  }
                  required
                  placeholder="e.g. Senior Machine Learning Engineer"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="min_experience_years"
                  className="text-xs font-semibold uppercase tracking-wider text-neutral-600"
                >
                  Min Experience (years)
                </Label>
                <Input
                  id="min_experience_years"
                  type="number"
                  min="0"
                  max="50"
                  value={form.min_experience_years}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleChange("min_experience_years", Number(e.target.value))
                  }
                  className="tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="description"
                  className="text-xs font-semibold uppercase tracking-wider text-neutral-600"
                >
                  Job Description (Full Requirements) *
                </Label>
                <span className="text-[11px] text-neutral-400">Used by AI for semantic matching</span>
              </div>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  handleChange("description", e.target.value)
                }
                rows={6}
                required
                placeholder="Paste complete responsibilities, technical requirements, qualifications, and role summary here..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TagInput
                id="required_skills"
                label="Required Skills"
                items={form.required_skills}
                onChange={(skills) => handleChange("required_skills", skills)}
                placeholder="e.g. Python, PyTorch, Azure, SQL..."
                badgeTone="indigo"
              />

              <TagInput
                id="education_requirements"
                label="Education Requirements"
                items={form.education_requirements}
                onChange={(edu) => handleChange("education_requirements", edu)}
                placeholder="e.g. Bachelor's, Master's..."
                badgeTone="slate"
              />
            </div>

            {/* Score Weights Configurator */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-neutral-700" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
                    AI Scoring Weights Allocation
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    totalWeight === 100 ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  Sum: {totalWeight}% {totalWeight !== 100 && "(recommend 100%)"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(["skills", "experience", "education", "other"] as const).map((key) => {
                  const defaultVal = DEFAULT_WEIGHTS[key];
                  const val = currentWeights[key] ?? defaultVal;
                  return (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-600 flex justify-between capitalize">
                        <span>{key === "experience" ? "Experience" : key === "education" ? "Education" : key}</span>
                        <span className="font-semibold tabular-nums text-neutral-950">{val}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={val}
                        onChange={(e) => handleWeightChange(key, Number(e.target.value))}
                        className="w-full accent-neutral-950 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="border-t border-neutral-200 pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : editingJob ? (
                  "Update Job Posting"
                ) : (
                  "Create Job Posting"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <ConfirmDialog
          open={!!deleteConfirmId}
          title="Delete this job requisition?"
          message="This will permanently delete the job. Applications already submitted for this job should be managed first. This action cannot be undone."
          confirmLabel="Delete Job"
          confirmVariant="reject"
          onConfirm={() => handleDeleteJob(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}
