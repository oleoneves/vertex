import { requireCapability } from "@/lib/auth";

export default async function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCapability("manage_payments");
  return <>{children}</>;
}
