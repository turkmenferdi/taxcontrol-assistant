"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

export default function Sidebar() {
  const pathname = usePathname();
  const { t, lang, setLang } = useLanguage();

  const navItems = [
    { href: "/dashboard", label: t.navDashboard, icon: LayoutDashboard },
    { href: "/gelen-faturalar", label: t.navIncoming, icon: ArrowDownToLine },
    { href: "/giden-faturalar", label: t.navOutgoing, icon: ArrowUpFromLine },
    { href: "/riskli-giderler", label: t.navRisky, icon: AlertTriangle },
    { href: "/kdv-ozeti", label: t.navVat, icon: Receipt },
    { href: "/gecici-vergi", label: t.navProvisional, icon: TrendingUp },
    { href: "/raporlar", label: t.navReports, icon: FileBarChart },
    { href: "/ayarlar", label: t.navSettings, icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">TaxControl</p>
            <p className="text-xs text-slate-400 mt-0.5">{t.sidebarSubtitle}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
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
              {item.label}
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
