"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/dashboard/KPICard";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ClipboardCheck,
  Wallet,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

interface DashboardData {
  vat: {
    outgoingNetTotal: number;
    outgoingVatTotal: number;
    incomingNetTotal: number;
    deductibleVatTotal: number;
    estimatedPayableVat: number;
    estimatedCarryForwardVat: number;
  };
  provisional: {
    revenue: number;
    estimatedProfit: number;
    estimatedProvisionalTax: number;
    taxRate: number;
  };
  outgoingCount: number;
  incomingCount: number;
  riskyCount: number;
  reviewCount: number;
  deductibleCount: number;
  totalClassified: number;
  trends: { outgoing: number; incoming: number };
  period: { quarter: number; year: number };
}

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    const res = await fetch("/api/tax/dashboard");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMsg("");
    const res = await fetch("/api/provider/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    setSyncMsg(res.ok ? t.syncDone(json.created, json.skipped) : t.syncError(json.error));
    setSyncing(false);
    fetchDashboard();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">{t.dashboardNoData}</p>
      </div>
    );
  }

  const now = new Date();
  const monthName = now.toLocaleString(lang === "tr" ? "tr-TR" : "en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.dashboardTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {monthName} · {t.quarterPeriod(data.period.year, data.period.quarter)}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? t.syncing : t.syncBtn}
        </button>
      </div>

      {syncMsg && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
          {syncMsg}
        </div>
      )}

      <div className="mb-2">
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {t.dashboardWarning}
        </p>
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-6 mb-3">
        {t.sectionInvoices}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t.kpiOutgoing} value={String(data.outgoingCount)} subtitle={t.thisMonth} icon={ArrowUpFromLine} color="blue" trend={data.trends.outgoing} />
        <KPICard title={t.kpiIncoming} value={String(data.incomingCount)} subtitle={t.thisMonth} icon={ArrowDownToLine} color="purple" trend={data.trends.incoming} />
        <KPICard title={t.kpiRisky} value={String(data.riskyCount)} subtitle={t.pendingApproval} icon={AlertTriangle} color="orange" />
        <KPICard title={t.kpiReview} value={String(data.reviewCount)} subtitle={t.needsReview} icon={ClipboardCheck} color="red" />
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-8 mb-3">
        {t.sectionVat}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t.kpiVatOut} value={formatCurrency(data.vat.outgoingVatTotal)} subtitle={t.fromSales} icon={Receipt} color="blue" />
        <KPICard title={t.kpiVatDeductible} value={formatCurrency(data.vat.deductibleVatTotal)} subtitle={t.fromPurchases} icon={Receipt} color="green" />
        <KPICard title={t.kpiVatPayable} value={formatCurrency(data.vat.estimatedPayableVat)} subtitle={t.estimatedDeclaration} icon={Wallet} color="red" />
        <KPICard
          title={data.vat.estimatedCarryForwardVat > 0 ? t.kpiVatCarry : t.kpiVatStatus}
          value={data.vat.estimatedCarryForwardVat > 0 ? formatCurrency(data.vat.estimatedCarryForwardVat) : t.noLiability}
          subtitle={t.estimated}
          icon={BarChart3}
          color={data.vat.estimatedCarryForwardVat > 0 ? "green" : "gray" as "blue"}
        />
      </div>

      {/* Classification breakdown */}
      {data.totalClassified > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mt-6 mb-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.classBreakdownTitle}</p>
            <p className="text-xs text-gray-400">{t.classBreakdownLabel(data.totalClassified)}</p>
          </div>
          <div className="flex rounded-full overflow-hidden h-3 gap-0.5 mb-2">
            {data.deductibleCount > 0 && (
              <div className="bg-green-500 h-full" style={{ width: `${(data.deductibleCount / data.totalClassified) * 100}%` }} title={`${data.deductibleCount} ${t.decisionDeductible}`} />
            )}
            {data.riskyCount > 0 && (
              <div className="bg-red-400 h-full" style={{ width: `${(data.riskyCount / data.totalClassified) * 100}%` }} title={`${data.riskyCount} ${t.decisionNonDeductible}`} />
            )}
            {data.reviewCount > 0 && (
              <div className="bg-yellow-400 h-full" style={{ width: `${(data.reviewCount / data.totalClassified) * 100}%` }} title={`${data.reviewCount} ${t.kpiReview}`} />
            )}
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />{data.deductibleCount} {t.decisionDeductible}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />{data.riskyCount} {t.decisionNonDeductible}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />{data.reviewCount} {t.kpiReview}</span>
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-8 mb-3">
        {t.sectionProvisional(data.period.year, data.period.quarter)}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard title={t.kpiRevenue} value={formatCurrency(data.provisional.revenue)} subtitle={t.netSales} icon={ArrowUpFromLine} color="blue" />
        <KPICard title={t.kpiProfit} value={formatCurrency(data.provisional.estimatedProfit)} subtitle={t.profitSubtitle} icon={TrendingUp} color="green" />
        <KPICard
          title={t.kpiProvTax}
          value={formatCurrency(data.provisional.estimatedProvisionalTax)}
          subtitle={t.rateWith(data.provisional.taxRate * 100)}
          icon={Wallet}
          color="red"
        />
      </div>
    </div>
  );
}
