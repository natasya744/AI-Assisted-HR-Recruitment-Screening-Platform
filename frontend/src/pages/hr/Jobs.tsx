import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { Job, JobCreate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/ConfirmDialog";

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

function formatList(list: string[]): string {
  return list.join(", ");
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
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
      score_weights: job.score_weights,
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

  function parseWeights(value: string) {
    try {
      handleChange("score_weights", JSON.parse(value));
    } catch {
      // ignore malformed JSON while typing
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading jobs…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Job Management</h1>
          <p className="text-sm text-slate-500">
            Create and manage job postings with full descriptions for AI screening.
          </p>
        </div>
        <Button onClick={openCreate}>Create Job</Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              {editingJob ? "Edit Job" : "Create Job"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {formError}
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleChange("title", e.target.value)
                  }
                  required
                  placeholder="e.g., Administration Staff"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description (full job posting) *</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    handleChange("description", e.target.value)
                  }
                  rows={8}
                  required
                  placeholder="Paste the full job description here. The AI uses this for screening."
                  className="font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="min_experience_years">Min Experience (years)</Label>
                  <Input
                    id="min_experience_years"
                    type="number"
                    min="0"
                    max="50"
                    value={form.min_experience_years}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleChange("min_experience_years", Number(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Required Skills (comma-separated)</Label>
                  <Input
                    value={formatList(form.required_skills)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleChange("required_skills", parseList(e.target.value))
                    }
                    placeholder="Microsoft Office, SAP"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Education Requirements (comma-separated)</Label>
                  <Input
                    value={formatList(form.education_requirements)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleChange("education_requirements", parseList(e.target.value))
                    }
                    placeholder="Bachelor, Master"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Score Weights (JSON)</Label>
                  <Textarea
                    value={JSON.stringify(form.score_weights, null, 2)}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      parseWeights(e.target.value)
                    }
                    rows={4}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving…" : editingJob ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-400">
            No jobs yet. Click "Create Job" to add one.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Title</TableHead>
                <TableHead className="w-[35%]">Description</TableHead>
                <TableHead className="w-[15%]">Min Exp</TableHead>
                <TableHead className="w-[15%]">Skills</TableHead>
                <TableHead className="w-[10%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium text-slate-800">{job.title}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="line-clamp-2 font-mono text-sm text-slate-600">
                      {job.description || <span className="text-slate-300">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-slate-500">
                    {job.min_experience_years} yr
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {job.required_skills.slice(0, 3).join(", ")}
                    {job.required_skills.length > 3 ? " …" : ""}
                  </TableCell>
<TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(job)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(job.id)}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 text-red-500">
                            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <p className="text-xs text-slate-400">
        <Link to="/hr" className="underline hover:text-slate-600">
          Back to dashboard
        </Link>
      </p>
      {deleteConfirmId ? (
        <ConfirmDialog
          open={!!deleteConfirmId}
          title="Delete this job?"
          message="This will permanently remove the job. It cannot be undone. Applications already submitted to this job must be deleted first."
          confirmLabel="Delete"
          confirmVariant="reject"
          onConfirm={() => handleDeleteJob(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
        />
      ) : null}
    </div>
  );
}