"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Building2, FileText, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
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

  async function load() {
    setLoading(true);
    const res = await fetch("/api/accountant/summary");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

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

      {/* Client cards */}
      <div className="space-y-3">
        {data.clients.map(({ company, incomingCount, outgoingCount, thisMonthIncoming, thisMonthOutgoing, riskyInvoices }) => {
          const netVat = thisMonthOutgoing.vatAmount - thisMonthIncoming.vatAmount;
          return (
            <div key={company.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{company.name}</h3>
                  <p className="text-xs text-gray-400">{company.taxNumber} · {company.user.email}</p>
                </div>
                {riskyInvoices > 0 && (
                  <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    {riskyInvoices} {t.riskyLabel}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
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
                  <p className="font-semibold text-gray-700">₺{formatAmount(thisMonthIncoming.vatAmount)} KDV</p>
                  <p className="text-gray-400">{thisMonthIncoming.count} {t.invoiceCount}</p>
                </div>
                <div>
                  <p className="text-gray-400">{t.statNetVat}</p>
                  <p className={`font-semibold ${netVat > 0 ? "text-red-600" : "text-green-600"}`}>
                    ₺{formatAmount(netVat)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
