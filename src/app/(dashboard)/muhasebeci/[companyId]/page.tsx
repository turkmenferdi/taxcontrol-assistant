"use client";

import { useState, useEffect, use } from "react";
import { useLanguage } from "@/contexts/language-context";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import ImportModal from "@/components/invoices/ImportModal";
import {
  ArrowLeft, Building2, AlertTriangle, Upload,
  FileText, Receipt, TrendingUp, Wallet, ClipboardCheck,
  ArrowDownToLine, ArrowUpFromLine, CheckCircle2, RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface CompanyStats {
  company: {
    id: string; name: string; taxNumber: string; taxOffice: string | null;
    companyType: string; vatPeriod: string;
    user: { name: string | null; email: string };
  };
  stats: {
    allIncoming: number; allOutgoing: number; riskyCount: number; reviewCount: number;
    month: {
      incoming: { count: number; net: number; vat: number; gross: number };
      outgoing: { count: number; net: number; vat: number; gross: number };
      calculatedVat: number; deductibleVat: number; payableVat: number; carryForwardVat: number;
    };
    quarter: {
      number: number; year: number; outgoingNet: number; incomingNet: number;
      estimatedProfit: number; taxRate: number; provisionalTax: number;
    };
  };
}

type Tab = "incoming" | "outgoing" | "risky" | "vat";

const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

function StatCard({
  label, value, sub, color = "gray", icon: Icon,
}: {
  label: string; value: string; sub?: string; color?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    gray: "bg-gray-50 text-gray-600 border-gray-100",
  };
  const cls = colors[color] ?? colors.gray;
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium opacity-70">{label}</p>
        <Icon className="w-4 h-4 opacity-50" />
      </div>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const { t } = useLanguage();
  const [data, setData] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("incoming");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showImport, setShowImport] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/accountant/company/${companyId}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [companyId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  if (!data) {
    return <div className="text-center py-16 text-gray-400 text-sm">Firma verisi yüklenemedi.</div>;
  }

  const { company, stats } = data;
  const m = stats.month;
  const q = stats.quarter;
  const now = new Date();
  const monthName = now.toLocaleString("tr-TR", { month: "long", year: "numeric" });

  const tabs: { key: Tab; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
    { key: "incoming", label: t.navIncoming, icon: ArrowDownToLine },
    { key: "outgoing", label: t.navOutgoing, icon: ArrowUpFromLine },
    { key: "risky", label: t.navRisky, icon: AlertTriangle },
    { key: "vat", label: "KDV & Vergi", icon: Receipt },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/muhasebeci" className="text-gray-400 hover:text-gray-600 transition-colors mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{company.name}</h1>
              <p className="text-xs text-gray-400">
                VKN: {company.taxNumber}
                {company.taxOffice && ` · ${company.taxOffice}`}
                {" · "}{company.user.email}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="text-gray-400 hover:text-gray-600 transition-colors p-2">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 text-sm bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-600 px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            {t.importBtnLabel}
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{monthName} — Özet</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Gelen Faturalar" value={String(m.incoming.count)} sub={`₺${fmt(m.incoming.gross)} brüt`} color="blue" icon={ArrowDownToLine} />
          <StatCard label="Giden Faturalar" value={String(m.outgoing.count)} sub={`₺${fmt(m.outgoing.gross)} brüt`} color="purple" icon={ArrowUpFromLine} />
          <StatCard
            label="Tahmini Ödenecek KDV"
            value={m.payableVat > 0 ? `₺${fmt(m.payableVat)}` : "Borç Yok"}
            sub={m.carryForwardVat > 0 ? `₺${fmt(m.carryForwardVat)} devredecek` : `₺${fmt(m.calculatedVat)} hesaplanan`}
            color={m.payableVat > 0 ? "red" : "green"}
            icon={Wallet}
          />
          <StatCard
            label="Riskli / İnceleme"
            value={`${stats.riskyCount} / ${stats.reviewCount}`}
            sub="Riskli · Onay bekleyen"
            color={stats.riskyCount > 0 ? "orange" : "gray"}
            icon={AlertTriangle}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === tb.key
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab !== "vat" ? (
        <InvoiceTable
          key={`${tab}-${refreshKey}`}
          direction={tab === "risky" ? "incoming" : tab}
          riskyOnly={tab === "risky"}
          companyId={companyId}
        />
      ) : (
        <div className="space-y-4">
          {/* VAT Warning */}
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠️ Bu özet tahmini bir ön kontrol raporudur. Kesin KDV beyanı ve yasal sorumluluk mükellef ve sertifikalı muhasebeciye aittir.
          </p>

          {/* Monthly VAT */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">📋 {monthName} — KDV Hesaplama</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: "Satış Matrahı (Net)", value: m.outgoing.net, sub: `${m.outgoing.count} giden fatura`, color: "text-gray-800" },
                { label: "Hesaplanan KDV (Satışlardan)", value: m.calculatedVat, sub: "KDV sorumluluğu", color: "text-blue-700", bold: true },
                { label: "Alış Matrahı (Net)", value: m.incoming.net, sub: `${m.incoming.count} gelen fatura`, color: "text-gray-800" },
                { label: "İndirilecek KDV (Alışlardan)", value: m.deductibleVat, sub: "İndirim hakkı", color: "text-green-700", bold: true },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm text-gray-700">{row.label}</p>
                    <p className="text-xs text-gray-400">{row.sub}</p>
                  </div>
                  <p className={`text-sm font-semibold ${row.color} ${row.bold ? "text-base" : ""}`}>
                    ₺{fmt(row.value)}
                  </p>
                </div>
              ))}
              {/* Result */}
              <div className={`flex items-center justify-between px-5 py-4 ${m.payableVat > 0 ? "bg-red-50" : "bg-green-50"}`}>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {m.payableVat > 0 ? "Tahmini Ödenecek KDV" : "Tahmini Devreden KDV"}
                  </p>
                  <p className="text-xs text-gray-500">Hesaplanan KDV − İndirilecek KDV</p>
                </div>
                <div className="flex items-center gap-2">
                  {m.payableVat === 0 && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  <p className={`text-lg font-bold ${m.payableVat > 0 ? "text-red-600" : "text-green-600"}`}>
                    ₺{fmt(m.payableVat > 0 ? m.payableVat : m.carryForwardVat)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quarterly Provisional Tax */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">
                📊 {q.year} {q.number}. Çeyrek — Geçici Vergi Tahmini
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: "Toplam Ciro (Net Satış)", value: q.outgoingNet, sub: "Çeyrek giden fatura toplamı", color: "text-gray-800" },
                { label: "İndirilebilir Giderler", value: q.incomingNet, sub: "Çeyrek gelen fatura toplamı", color: "text-gray-800" },
                { label: "Tahmini Kâr (Matrah)", value: q.estimatedProfit, sub: "Ciro − Giderler", color: "text-gray-800", bold: true },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm text-gray-700">{row.label}</p>
                    <p className="text-xs text-gray-400">{row.sub}</p>
                  </div>
                  <p className={`text-sm font-semibold ${row.color}`}>₺{fmt(row.value)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-4 bg-orange-50">
                <div>
                  <p className="text-sm font-bold text-gray-800">Tahmini Geçici Vergi</p>
                  <p className="text-xs text-gray-500">%{(q.taxRate * 100).toFixed(0)} oran ile</p>
                </div>
                <p className="text-lg font-bold text-orange-600">₺{fmt(q.provisionalTax)}</p>
              </div>
            </div>
          </div>

          {/* All-time stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Toplam Gelen" value={String(stats.allIncoming)} sub="tüm zamanlar" color="blue" icon={FileText} />
            <StatCard label="Toplam Giden" value={String(stats.allOutgoing)} sub="tüm zamanlar" color="purple" icon={FileText} />
            <StatCard label="Riskli Gider" value={String(stats.riskyCount)} sub="KDV indirimi sorunu" color={stats.riskyCount > 0 ? "red" : "gray"} icon={AlertTriangle} />
            <StatCard label="Onay Bekleyen" value={String(stats.reviewCount)} sub="muhasebeci incelemesi" color={stats.reviewCount > 0 ? "orange" : "gray"} icon={ClipboardCheck} />
          </div>
        </div>
      )}

      {showImport && (
        <ImportModal
          direction={tab === "outgoing" ? "outgoing" : "incoming"}
          companyId={companyId}
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); setRefreshKey((k) => k + 1); load(); }}
        />
      )}
    </div>
  );
}
