import { requireCapability } from "@/lib/auth";

export default async function PayrollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCapability("view_payroll");
  return <>{children}</>;
}
