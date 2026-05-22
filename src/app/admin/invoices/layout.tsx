import { requireCapability } from "@/lib/auth";

export default async function InvoicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCapability("manage_invoices");
  return <>{children}</>;
}
