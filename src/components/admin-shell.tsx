import { AdminNavigation } from "@/components/admin-navigation";
import type { AdminSession } from "@/lib/admin-auth";
import type { DatabaseHealthResult } from "@/lib/database-health-status";

export function AdminShell({
  session,
  databaseHealth,
  children,
}: {
  session: AdminSession;
  databaseHealth: DatabaseHealthResult;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-root min-h-screen bg-[#F8FAFC] text-[#475569]">
      <AdminNavigation email={session.email} databaseHealth={databaseHealth} />
      <div className="lg:pl-64">
        <div className="admin-content min-h-[calc(100vh-4rem)]">{children}</div>
      </div>
    </div>
  );
}
