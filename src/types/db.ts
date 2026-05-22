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

export type WorkerStatus = "onboarding" | "active" | "inactive";
export type PlacementStatus = "active" | "ended" | "paused";
export type ShiftStatus = "scheduled" | "in_progress" | "completed" | "no_show" | "cancelled";
export type InvoiceStatus = "draft" | "sent" | "paid" | "void" | "overdue";
export type PaymentDirection = "in" | "out";

export type Worker = {
  id: string;
  candidate_id: string | null;
  user_id: string | null;
  employee_code: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: WorkerStatus;
  pay_type: "hourly" | "salary";
  default_pay_rate: number | null;
  payment_method: "check" | "ach" | "zelle" | "cashapp";
  zelle_full_name: string | null;
  ssn: string | null;
  w9_document_id: string | null;
  notes: string | null;
  created_at: string;
  // Reliability / rating (added 2026-05-13, inspired by Bluecrew/Instawork/Wonolo)
  rating: number | null;        // 1.0 - 5.0 (null when no ratings yet)
  ratings_count: number;        // total number of ratings received
  is_favorite: boolean;         // employer can favorite a worker
  no_show_count: number;        // count of no-show shifts
};

export type Employer = {
  id: string;
  name: string;
  contact_name: string | null;
  billing_email: string | null;
  billing_address: string | null;
  bill_rate_multiplier: number;
  hourly_bill_rate: number | null;
  hourly_pay_rate: number | null;
  per_diem_rate: number | null;
  per_diem_cost: number | null;
  travel_time_rate: number | null;
  travel_time_cost: number | null;
  payment_terms_days: number;
  notes: string | null;
  created_at: string;
};

export type EmployerContactPosition =
  | "supervisor"
  | "finance"
  | "director"
  | "project_manager"
  | "operations"
  | "safety"
  | "billing"
  | "other";

export type EmployerContact = {
  id: string;
  employer_id: string;
  position: EmployerContactPosition;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export type Placement = {
  id: string;
  worker_id: string;
  employer_id: string;
  job_id: string | null;
  project_id: string | null;
  role_title: string;
  pay_rate: number;
  bill_rate: number;
  start_date: string;
  end_date: string | null;
  status: PlacementStatus;
  max_hours_per_day: number | null;
  earliest_clock_in: string | null;
  latest_clock_out: string | null;
  notes: string | null;
  created_at: string;
};

export type ProjectStatus = "active" | "completed" | "cancelled" | "paused";

export type Project = {
  id: string;
  employer_id: string;
  name: string;
  slug: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  budget_hours: number | null;
  budget_amount: number | null;
  estimate_people: number | null;
  estimate_hours_per_day: number | null;
  estimate_travel_hours_per_person: number | null;
  status: ProjectStatus;
  notes: string | null;
  created_at: string;
};

export type Shift = {
  id: string;
  placement_id: string;
  scheduled_start: string;
  scheduled_end: string;
  location: string | null;
  status: ShiftStatus;
  notes: string | null;
  created_at: string;
};

export type TimeEntry = {
  id: string;
  shift_id: string | null;
  worker_id: string;
  placement_id: string;
  clock_in_at: string;
  clock_out_at: string | null;
  break_minutes: number;
  hours_worked: number | null;
  pay_rate_at_entry: number | null;
  bill_rate_at_entry: number | null;
  approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  location: string | null;
  ticket_number: string | null;
  extra: number | null;
  notes: string | null;
  created_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  employer_id: string;
  period_start: string;
  period_end: string;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  due_date: string | null;
  sent_at: string | null;
  paid_at: string | null;
  pdf_url: string | null;
  project_manager: string | null;
  notes: string | null;
  created_at: string;
};

export type InvoiceLineKind = "labor" | "per_diem" | "travel" | "hotel" | "other";

export type InvoiceLineItem = {
  id: string;
  invoice_id: string;
  worker_id: string | null;
  placement_id: string | null;
  description: string;
  hours: number;
  rate: number;
  amount: number;
  kind: InvoiceLineKind;
  unit: string | null;
};

export type Payment = {
  id: string;
  direction: PaymentDirection;
  invoice_id: string | null;
  worker_id: string | null;
  amount: number;
  method: "check" | "ach" | "zelle" | "cashapp" | "stripe" | "wire";
  reference: string | null;
  occurred_at: string;
  notes: string | null;
  created_at: string;
};

export type DocumentType =
  | "i9"
  | "w9"
  | "drivers_license"
  | "ssn_card"
  | "work_authorization"
  | "osha10"
  | "osha30"
  | "iicrc_wrt"
  | "iicrc_amrt"
  | "workers_comp"
  | "photo"
  | "other";

export type DocumentStatus = "pending" | "approved" | "rejected" | "expired";

export type WorkerDocument = {
  id: string;
  worker_id: string;
  type: DocumentType;
  filename: string;
  storage_path: string;
  status: DocumentStatus;
  expires_at: string | null;
  uploaded_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
};
