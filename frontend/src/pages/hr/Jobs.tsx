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
  X,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { Job, JobCreate } from "@/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";
import TagInput from "@/components/TagInput";

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

  useEffect(() => {
    loadJobs();
  }, []);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/hr"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2" style={{ color: '#312e81' }}>
            Job Requisitions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure job openings, skill criteria, and customized scoring weights for automated AI screening.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-md transition-all self-start sm:self-center"
        >
          <Plus className="size-4" />
          <span>Create New Job</span>
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="size-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Jobs Grid / List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 space-y-3">
          <Loader2 className="mx-auto size-7 animate-spin text-indigo-600" />
          <p className="text-xs sm:text-sm font-medium">Loading job requisitions…</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-xs space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Briefcase className="size-6" />
          </div>
          <h3 className="text-base font-semibold" style={{ color: '#1e293b' }}>No Job Requisitions Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Create your first job posting to start receiving and screening candidate applications.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors mt-2"
          >
            <Plus className="size-3.5" />
            Create Job Posting
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => {
            const weights = job.score_weights || DEFAULT_WEIGHTS;
            return (
              <div
                key={job.id}
                className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-lg border border-indigo-100 bg-indigo-50/70 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                          {job.min_experience_years > 0
                            ? `${job.min_experience_years}y+ min experience`
                            : "Entry level"}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold group-hover:text-indigo-600 transition-colors" style={{ color: '#1e293b' }}>
                        {job.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(job)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                        title="Edit Job"
                      >
                        <Edit2 className="size-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(job.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Delete Job"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {job.description && (
                    <p className="line-clamp-3 text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
                      {job.description}
                    </p>
                  )}

                  {/* Skills Chips */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Award className="size-3 text-slate-400" />
                      Required Skills ({job.required_skills?.length ?? 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {job.required_skills?.length > 0 ? (
                        job.required_skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">None specified</span>
                      )}
                    </div>
                  </div>

                  {/* Education Chips */}
                  {job.education_requirements && job.education_requirements.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <GraduationCap className="size-3 text-slate-400" />
                        Education
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {job.education_requirements.map((edu) => (
                          <span
                            key={edu}
                            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                          >
                            {edu}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Score Weights Breakdown Visualizer */}
                  <div className="rounded-2xl bg-slate-50/80 p-3.5 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span className="flex items-center gap-1">
                        <Sliders className="size-3 text-indigo-500" />
                        AI Score Weights
                      </span>
                      <span className="text-slate-400">Total 100%</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                      <div className="rounded-lg bg-white p-1.5 border border-slate-200/60 shadow-2xs">
                        <span className="text-slate-400 block">Skills</span>
                        <span className="font-bold text-slate-800">{weights.skills ?? 30}%</span>
                      </div>
                      <div className="rounded-lg bg-white p-1.5 border border-slate-200/60 shadow-2xs">
                        <span className="text-slate-400 block">Exp</span>
                        <span className="font-bold text-slate-800">{weights.experience ?? 30}%</span>
                      </div>
                      <div className="rounded-lg bg-white p-1.5 border border-slate-200/60 shadow-2xs">
                        <span className="text-slate-400 block">Edu</span>
                        <span className="font-bold text-slate-800">{weights.education ?? 20}%</span>
                      </div>
                      <div className="rounded-lg bg-white p-1.5 border border-slate-200/60 shadow-2xs">
                        <span className="text-slate-400 block">Other</span>
                        <span className="font-bold text-slate-800">{weights.other ?? 20}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[11px]">ID: {job.id.slice(0, 8)}…</span>
                  <Link
                    to="/apply"
                    className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Public Apply Link →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Briefcase className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#312e81' }}>
                    {editingJob ? "Edit Job Requisition" : "Create New Job Requisition"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Provide the job details and configure AI evaluation scoring weights.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {formError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-center gap-3">
                <AlertCircle className="size-5 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Title & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Job Title *
                  </label>
                  <input
                    id="title"
                    value={form.title}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleChange("title", e.target.value)
                    }
                    required
                    placeholder="e.g. Senior Machine Learning Engineer"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="min_experience_years"
                    className="text-xs font-bold uppercase tracking-wider text-slate-600"
                  >
                    Min Experience (years)
                  </label>
                  <input
                    id="min_experience_years"
                    type="number"
                    min="0"
                    max="50"
                    value={form.min_experience_years}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleChange("min_experience_years", Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm tabular-nums text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Full Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="description"
                    className="text-xs font-bold uppercase tracking-wider text-slate-600"
                  >
                    Job Description (Full Requirements) *
                  </label>
                  <span className="text-[11px] text-slate-400">Used by AI for semantic matching</span>
                </div>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    handleChange("description", e.target.value)
                  }
                  rows={6}
                  required
                  placeholder="Paste complete responsibilities, technical requirements, qualifications, and role summary here..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm leading-relaxed text-slate-800 placeholder:text-slate-300 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>

              {/* Skills and Education */}
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
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                      AI Scoring Weights Allocation
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      totalWeight === 100 ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    Sum: {totalWeight}% {totalWeight !== 100 && "(recommend 100%)"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 flex justify-between">
                      <span>Skills</span>
                      <span className="font-bold text-indigo-600">{currentWeights.skills ?? 30}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={currentWeights.skills ?? 30}
                      onChange={(e) => handleWeightChange("skills", Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 flex justify-between">
                      <span>Experience</span>
                      <span className="font-bold text-indigo-600">{currentWeights.experience ?? 30}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={currentWeights.experience ?? 30}
                      onChange={(e) => handleWeightChange("experience", Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 flex justify-between">
                      <span>Education</span>
                      <span className="font-bold text-indigo-600">{currentWeights.education ?? 20}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={currentWeights.education ?? 20}
                      onChange={(e) => handleWeightChange("education", Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 flex justify-between">
                      <span>Other</span>
                      <span className="font-bold text-indigo-600">{currentWeights.other ?? 20}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={currentWeights.other ?? 20}
                      onChange={(e) => handleWeightChange("other", Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-md disabled:opacity-50 transition-all"
                >
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
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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