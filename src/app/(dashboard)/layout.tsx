import Sidebar from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const userRole = session?.user.role ?? "owner";

  return (
    <div className="flex h-full">
      <Sidebar userRole={userRole} />
      <main className="flex-1 ml-64 min-h-screen bg-gray-50">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
