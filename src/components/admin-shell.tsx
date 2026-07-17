import { AdminNavigation } from "@/components/admin-navigation";
import type { AdminSession } from "@/lib/admin-auth";

export function AdminShell({ session, children }: { session: AdminSession; children: React.ReactNode }) {
  return (
    <div className="admin-root min-h-screen bg-[#F6F8FB] text-[#172033]">
      <AdminNavigation email={session.email} />
      <div className="lg:pl-60">
        <div className="admin-content min-h-[calc(100vh-3.5rem)]">{children}</div>
      </div>
    </div>
  );
}
