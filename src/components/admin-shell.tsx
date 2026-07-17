import { AdminNavigation } from "@/components/admin-navigation";
import type { AdminSession } from "@/lib/admin-auth";

export function AdminShell({ session, children }: { session: AdminSession; children: React.ReactNode }) {
  return (
    <div className="admin-root min-h-screen bg-[#F8FAFC] text-[#475569]">
      <AdminNavigation email={session.email} />
      <div className="lg:pl-64">
        <div className="admin-content min-h-[calc(100vh-4rem)]">{children}</div>
      </div>
    </div>
  );
}
