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
  period: { quarter: number; year: number };
}

export default function DashboardPage() {
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
    const res = await fetch("/api/provider/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const json = await res.json();
    setSyncMsg(
      res.ok
        ? `Senkronizasyon tamamlandı: ${json.created} yeni, ${json.skipped} mevcut fatura.`
        : `Hata: ${json.error}`
    );
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
        <p className="text-gray-500 mb-4">Veriye ulaşılamadı. Lütfen firma ayarlarınızı tamamlayın.</p>
      </div>
    );
  }

  const now = new Date();
  const monthName = now.toLocaleString("tr-TR", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{monthName} · {data.period.year} {data.period.quarter}. Çeyrek</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Senkronize Ediliyor..." : "Faturaları Senkronize Et"}
        </button>
      </div>

      {syncMsg && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
          {syncMsg}
        </div>
      )}

      <div className="mb-2">
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ Bu dashboard tahmini ön-kontrol verileri içermektedir. Kesin vergi beyanı ve yasal sorumluluk için sertifikalı muhasebeciye danışınız.
        </p>
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-6 mb-3">Bu Ay — Fatura Özeti</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Giden Faturalar" value={String(data.outgoingCount)} subtitle="Bu ay" icon={ArrowUpFromLine} color="blue" />
        <KPICard title="Gelen Faturalar" value={String(data.incomingCount)} subtitle="Bu ay" icon={ArrowDownToLine} color="purple" />
        <KPICard title="Riskli Giderler" value={String(data.riskyCount)} subtitle="Onay bekliyor" icon={AlertTriangle} color="orange" />
        <KPICard title="Muhasebeci Onayı" value={String(data.reviewCount)} subtitle="İncelenmeli" icon={ClipboardCheck} color="red" />
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-8 mb-3">Bu Ay — Tahmini KDV</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Hesaplanan KDV" value={formatCurrency(data.vat.outgoingVatTotal)} subtitle="Satışlardan" icon={Receipt} color="blue" />
        <KPICard title="İndirilecek KDV" value={formatCurrency(data.vat.deductibleVatTotal)} subtitle="Alışlardan" icon={Receipt} color="green" />
        <KPICard title="Tahmini Ödenecek KDV" value={formatCurrency(data.vat.estimatedPayableVat)} subtitle="Beyan tahmini" icon={Wallet} color="red" />
        <KPICard
          title={data.vat.estimatedCarryForwardVat > 0 ? "Devreden KDV" : "KDV Durumu"}
          value={data.vat.estimatedCarryForwardVat > 0 ? formatCurrency(data.vat.estimatedCarryForwardVat) : "Borç Yok"}
          subtitle="Tahmini"
          icon={BarChart3}
          color={data.vat.estimatedCarryForwardVat > 0 ? "green" : "gray" as "blue"}
        />
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-8 mb-3">{data.period.year} {data.period.quarter}. Çeyrek — Geçici Vergi Tahmini</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard title="Tahmini Ciro" value={formatCurrency(data.provisional.revenue)} subtitle="Net satışlar" icon={ArrowUpFromLine} color="blue" />
        <KPICard title="Tahmini Kâr" value={formatCurrency(data.provisional.estimatedProfit)} subtitle="Gelir - İndirilebilir Gider" icon={TrendingUp} color="green" />
        <KPICard
          title="Tahmini Geçici Vergi"
          value={formatCurrency(data.provisional.estimatedProvisionalTax)}
          subtitle={`%${(data.provisional.taxRate * 100).toFixed(0)} oran ile`}
          icon={Wallet}
          color="red"
        />
      </div>
    </div>
  );
}
