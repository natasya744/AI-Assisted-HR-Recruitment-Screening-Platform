export type Job = {
  id: string;
  title: string;
  description: string | null;
  min_experience_years: number;
  required_skills: string[];
  education_requirements: string[];
  score_weights: Record<string, number>;
  is_open: boolean;
};

export type JobCreate = {
  title: string;
  description: string;
  min_experience_years: number;
  required_skills: string[];
  education_requirements: string[];
  score_weights: Record<string, number>;
};

export type ApplicationCreated = {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  cv_storage_path: string | null;
  applied_at: string;
};

export type ScreeningSummary = {
  total_score: number | null;
  max_score: number | null;
  passing_score: number | null;
  is_qualified: boolean | null;
  classification: string | null;
};

export type ScreeningBreakdownCategory = {
  score: number;
  max: number;
  matched?: string[];
  years?: number;
};

export type ScreeningResult = {
  total_score: number;
  max_score: number;
  passing_score: number;
  is_qualified: boolean;
  classification: string;
  breakdown: Record<string, ScreeningBreakdownCategory>;
  evidence: Record<string, unknown>;
  ai_advice: Record<string, unknown>;
  created_at: string;
};

export type ApplicationListItem = {
  id: string;
  status: string;
  applied_at: string;
  job_title: string;
  candidate_name: string;
  candidate_email: string;
  screening: ScreeningSummary | null;
};

export type CandidateInfo = {
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
};

export type WorkExperience = {
  title?: string | null;
  company?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export type Education = {
  degree?: string | null;
  institution?: string | null;
  field?: string | null;
};

export type ExtractedProfile = {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  professional_summary?: string | null;
  skills: string[];
  total_experience_years?: number | null;
  work_experience: WorkExperience[];
  education: Education[];
  certifications: string[];
  languages: string[];
};

/** Field key -> provenance tag (ai | deterministic | manual | missing | ai_approximate). */
export type ProfileProvenance = Record<string, string>;

export type AlignmentField = {
  status: string;
  form_value: unknown;
  pdf_value: unknown;
};

export type AlignmentCheck = {
  fields?: Record<string, AlignmentField>;
  has_mismatch?: boolean;
  mismatch_count?: number;
};

export type PdfProfile = {
  extracted_data: ExtractedProfile;
  provenance: ProfileProvenance;
  extraction_status: string;
  alignment_check: AlignmentCheck;
  created_at: string;
};

export type ApplicationDetail = {
  id: string;
  job_id: string;
  job_title: string;
  candidate: CandidateInfo;
  status: string;
  cv_storage_path: string | null;
  applied_at: string;
  form_data: Record<string, unknown> | null;
  pdf_profile: PdfProfile | null;
  screening: ScreeningResult | null;
};

export type DecisionRequest = {
  decision: "APPROVED" | "REJECTED";
  reviewer_email: string;
  notes: string | null;
};

export type DecisionRead = {
  id: string;
  application_id: string;
  decision: string;
  reviewer_email: string;
  notes: string | null;
  decided_at: string;
};

export type HistoryEntry = {
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
};