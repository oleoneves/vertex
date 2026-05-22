import { requireCapability } from "@/lib/auth";

export default async function NewProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCapability("create_project");
  return <>{children}</>;
}
