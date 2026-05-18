"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Receipt,
  TrendingUp,
  FileBarChart,
  Settings,
  LogOut,
  Building2,
  Users,
  CalendarDays,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

interface SidebarProps {
  userRole?: string;
}

export default function Sidebar({ userRole = "owner" }: SidebarProps) {
  const pathname = usePathname();
  const { t, lang, setLang } = useLanguage();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (userRole !== "accountant") return;
    fetch("/api/accountant/summary")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const count = data.clients?.filter((c: { riskyInvoices: number; pendingReviewCount: number }) =>
          c.riskyInvoices > 0 || c.pendingReviewCount > 0
        ).length ?? 0;
        setAlertCount(count);
      })
      .catch(() => {});
  }, [userRole, pathname]);

  const ownerNavItems = [
    { href: "/dashboard", label: t.navDashboard, icon: LayoutDashboard },
    { href: "/gelen-faturalar", label: t.navIncoming, icon: ArrowDownToLine },
    { href: "/giden-faturalar", label: t.navOutgoing, icon: ArrowUpFromLine },
    { href: "/riskli-giderler", label: t.navRisky, icon: AlertTriangle },
    { href: "/kdv-ozeti", label: t.navVat, icon: Receipt },
    { href: "/gecici-vergi", label: t.navProvisional, icon: TrendingUp },
    { href: "/raporlar", label: t.navReports, icon: FileBarChart },
    { href: "/ayarlar", label: t.navSettings, icon: Settings },
  ];

  const accountantNavItems = [
    { href: "/muhasebeci", label: t.navAccountantDashboard, icon: BarChart3 },
    { href: "/musteri-yonetimi", label: t.navClientManagement, icon: Users },
    { href: "/takvim", label: t.navCalendar, icon: CalendarDays },
    { href: "/ayarlar", label: t.navSettings, icon: Settings },
  ];

  const navItems = userRole === "accountant" ? accountantNavItems : ownerNavItems;

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">TaxControl</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {userRole === "accountant" ? t.sidebarSubtitleAccountant : t.sidebarSubtitle}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const showBadge = item.href === "/muhasebeci" && alertCount > 0 && !active;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="flex-shrink-0 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setLang("tr")}
            className={cn(
              "flex-1 text-xs py-1.5 rounded-md font-medium transition-colors",
              lang === "tr" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            TR
          </button>
          <button
            onClick={() => setLang("en")}
            className={cn(
              "flex-1 text-xs py-1.5 rounded-md font-medium transition-colors",
              lang === "en" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            EN
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-3 leading-relaxed">{t.disclaimer}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-full px-3 py-2 rounded-lg hover:bg-slate-800"
        >
          <LogOut className="w-4 h-4" />
          {t.logout}
        </button>
      </div>
    </aside>
  );
}
