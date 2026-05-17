"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Building2, FileText, AlertTriangle, TrendingUp, RefreshCw, Search, ChevronRight } from "lucide-react";
import Link from "next/link";

interface ClientSummary {
  company: {
    id: string;
    name: string;
    taxNumber: string;
    vatPeriod: string;
    user: { name: string | null; email: string };
  };
  incomingCount: number;
  outgoingCount: number;
  thisMonthIncoming: { count: number; netAmount: number; vatAmount: number };
  thisMonthOutgoing: { count: number; netAmount: number; vatAmount: number };
  riskyInvoices: number;
}

interface SummaryData {
  clients: ClientSummary[];
  totalCompanies: number;
  totalInvoices: number;
}

function formatAmount(n: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function MuhasebecPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/accountant/summary");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.clients;
    return data.clients.filter(
      (c) =>
        c.company.name.toLowerCase().includes(q) ||
        c.company.taxNumber.includes(q) ||
        c.company.user.email.toLowerCase().includes(q)
    );
  }, [data, search]);

  if (loading) {
    return <div className="p-8 text-center text-gray-400 text-sm">{t.loading}</div>;
  }

  if (!data || data.clients.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <Building2 className="w-12 h-12 mx-auto text-gray-200 mb-3" />
        <p className="text-gray-500 text-sm mb-4">{t.accountantNoClients}</p>
        <Link
          href="/musteri-yonetimi"
          className="inline-flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t.goToClientManagement}
        </Link>
      </div>
    );
  }

  const totalRisky = data.clients.reduce((s, c) => s + c.riskyInvoices, 0);
  const totalThisMonthVat = data.clients.reduce(
    (s, c) => s + c.thisMonthOutgoing.vatAmount - c.thisMonthIncoming.vatAmount,
    0
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">{t.accountantDashboardTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.accountantDashboardDesc}</p>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: t.statTotalClients, value: data.totalCompanies, icon: Building2, color: "blue" },
          { label: t.statTotalInvoices, value: data.totalInvoices, icon: FileText, color: "green" },
          { label: t.statRiskyInvoices, value: totalRisky, icon: AlertTriangle, color: totalRisky > 0 ? "red" : "gray" },
          { label: t.statThisMonthVat, value: `₺${formatAmount(totalThisMonthVat)}`, icon: TrendingUp, color: "purple" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 text-${stat.color}-600`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.clientSearchPlaceholder}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {search && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {filtered.length} / {data.clients.length}
          </span>
        )}
      </div>

      {/* Client cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">{t.clientSearchEmpty}</div>
        ) : (
          filtered.map(({ company, incomingCount, outgoingCount, thisMonthIncoming, thisMonthOutgoing, riskyInvoices }) => {
            const netVat = thisMonthOutgoing.vatAmount - thisMonthIncoming.vatAmount;
            return (
              <Link
                key={company.id}
                href={`/muhasebeci/${company.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">{company.name}</h3>
                      <p className="text-xs text-gray-400">{company.taxNumber} · {company.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {riskyInvoices > 0 && (
                      <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        {riskyInvoices} {t.riskyLabel}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400">{t.statIncoming}</p>
                    <p className="font-semibold text-gray-700">{incomingCount} {t.invoiceCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">{t.statOutgoing}</p>
                    <p className="font-semibold text-gray-700">{outgoingCount} {t.invoiceCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">{t.statThisMonthIncoming}</p>
                    <p className="font-semibold text-gray-700">₺{formatAmount(thisMonthIncoming.vatAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">{t.statNetVat}</p>
                    <p className={`font-semibold ${netVat > 0 ? "text-red-600" : "text-green-600"}`}>
                      ₺{formatAmount(netVat)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
