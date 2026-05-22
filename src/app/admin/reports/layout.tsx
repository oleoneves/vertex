import { requireCapability } from "@/lib/auth";

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCapability("view_reports");
  return <>{children}</>;
}
