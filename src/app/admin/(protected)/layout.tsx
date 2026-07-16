import { AdminShell } from "@/components/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  return <AdminShell session={session}>{children}</AdminShell>;
}
