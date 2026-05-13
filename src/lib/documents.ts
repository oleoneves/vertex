import "server-only";
import { getSupabaseServer } from "./supabase/server";
import { getSupabaseAdmin } from "./supabase/admin";
import { isDemoMode, demoWorkerDocuments } from "./demo";
import type { DocumentType, WorkerDocument } from "@/types/db";

export const DOCUMENT_TYPES: { value: DocumentType; label: string; required: boolean }[] = [
  { value: "i9", label: "I-9 (Employment Eligibility)", required: true },
  { value: "w9", label: "W-9 (Tax Form)", required: true },
  { value: "drivers_license", label: "Driver's License or State ID", required: true },
  { value: "ssn_card", label: "SSN Card or ITIN", required: true },
  { value: "work_authorization", label: "Work Authorization", required: false },
  { value: "osha10", label: "OSHA-10 Card", required: false },
  { value: "osha30", label: "OSHA-30 Card", required: false },
  { value: "iicrc_wrt", label: "IICRC Water Restoration", required: false },
  { value: "iicrc_amrt", label: "IICRC Mold Remediation", required: false },
  { value: "workers_comp", label: "Workers Comp Acknowledgment", required: false },
  { value: "photo", label: "Profile Photo", required: false },
  { value: "other", label: "Other", required: false },
];

export const DOCUMENT_LABELS: Record<DocumentType, string> = Object.fromEntries(
  DOCUMENT_TYPES.map((t) => [t.value, t.label]),
) as Record<DocumentType, string>;

export async function listWorkerDocuments(workerId: string): Promise<WorkerDocument[]> {
  if (isDemoMode()) {
    return demoWorkerDocuments(workerId);
  }
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("worker_id", workerId)
    .order("uploaded_at", { ascending: false });
  return (data as WorkerDocument[]) ?? [];
}

export async function signedDocumentUrl(path: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from("documents")
    .createSignedUrl(path, 60 * 10); // 10-minute access
  if (error || !data) return null;
  return data.signedUrl;
}

export type ComplianceStatus = {
  type: DocumentType;
  label: string;
  required: boolean;
  uploaded: boolean;
  approved: boolean;
  doc: WorkerDocument | null;
};

export function complianceFor(docs: WorkerDocument[]): ComplianceStatus[] {
  return DOCUMENT_TYPES.map((t) => {
    const latest = docs.find((d) => d.type === t.value) ?? null;
    return {
      type: t.value,
      label: t.label,
      required: t.required,
      uploaded: !!latest,
      approved: latest?.status === "approved",
      doc: latest,
    };
  });
}
