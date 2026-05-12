export type EmploymentType = "full_time" | "part_time" | "seasonal" | "contract";
export type ApplicationStatus = "new" | "reviewing" | "accepted" | "rejected";

export type Job = {
  id: string;
  slug: string;
  title: string;
  employer: string;
  category: string;
  employment_type: EmploymentType;
  location_city: string;
  location_state: string;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  description: string;
  requirements: string | null;
  benefits: string | null;
  active: boolean;
  featured: boolean;
  created_at: string;
};

export type Candidate = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  locale: "en" | "es" | "pt";
  created_at: string;
};

export type Application = {
  id: string;
  job_id: string;
  candidate_id: string;
  cv_url: string | null;
  experience_summary: string | null;
  status: ApplicationStatus;
  ai_score: number | null;
  ai_summary: string | null;
  created_at: string;
};
