import { AdminShell } from "@/components/admin-shell";
import { requireAdminSession } from "@/lib/admin-auth";
import { getRequestDatabaseHealth } from "@/lib/database-health";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  const databaseHealth = await getRequestDatabaseHealth();
  return <AdminShell session={session} databaseHealth={databaseHealth}>{children}</AdminShell>;
}
