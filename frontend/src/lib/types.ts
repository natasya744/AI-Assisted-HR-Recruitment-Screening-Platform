export type Job = {
  id: string;
  title: string;
  min_experience_years: number;
  required_skills: string[];
  education_requirements: string[];
  score_weights: Record<string, number>;
  is_open: boolean;
};

export type ApplicationCreated = {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  cv_storage_path: string | null;
  applied_at: string;
};
