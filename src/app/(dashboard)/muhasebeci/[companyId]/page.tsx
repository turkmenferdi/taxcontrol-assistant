"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import ImportModal from "@/components/invoices/ImportModal";
import {
  ArrowLeft, Building2, AlertTriangle, Upload, FileText, Receipt,
  TrendingUp, Wallet, ClipboardCheck, ArrowDownToLine, ArrowUpFromLine,
  CheckCircle2, RefreshCw, Send, BarChart2, Copy, Check,
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

interface TrendMonth {
  label: string;
  incomingNet: number; incomingVat: number; incomingCount: number;
  outgoingNet: number; outgoingVat: number; outgoingCount: number;
  netVat: number;
}

type Tab = "incoming" | "outgoing" | "risky" | "vat" | "trend";

const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtK = (n: number) =>
  n >= 1000 ? `₺${(n / 1000).toFixed(0)}k` : `₺${Math.round(n)}`;

function StatCard({ label, value, sub, color = "gray", icon: Icon }: {
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
  return (
    <div className={`rounded-xl border p-4 ${colors[color] ?? colors.gray}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium opacity-70">{label}</p>
        <Icon className="w-4 h-4 opacity-40" />
      </div>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

function TrendChart({ months }: { months: TrendMonth[] }) {
  const maxVal = Math.max(...months.flatMap(m => [m.outgoingNet, m.incomingNet]), 1);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700">Son 6 Ay — Ciro & Gider Trendi</p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" />Giden</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />Gelen</span>
        </div>
      </div>
      <div className="flex items-end gap-3 h-40">
        {months.map((m) => (
          <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-0.5 items-end" style={{ height: "120px" }}>
              <div
                className="flex-1 bg-blue-400 rounded-t-sm transition-all"
                style={{ height: `${(m.outgoingNet / maxVal) * 100}%`, minHeight: m.outgoingNet > 0 ? "4px" : "0" }}
                title={`Giden: ${fmt(m.outgoingNet)}`}
              />
              <div
                className="flex-1 bg-emerald-400 rounded-t-sm transition-all"
                style={{ height: `${(m.incomingNet / maxVal) * 100}%`, minHeight: m.incomingNet > 0 ? "4px" : "0" }}
                title={`Gelen: ${fmt(m.incomingNet)}`}
              />
            </div>
            <p className="text-xs text-gray-400">{m.label}</p>
            <p className={`text-xs font-semibold ${m.netVat > 0 ? "text-red-500" : m.netVat < 0 ? "text-green-500" : "text-gray-400"}`}>
              {m.netVat !== 0 ? fmtK(Math.abs(m.netVat)) : "—"}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">Alt satır = net KDV yükü (kırmızı: ödeme, yeşil: devir)</p>
    </div>
  );
}

function SendToClientModal({ company, stats, onClose }: {
  company: CompanyStats["company"];
  stats: CompanyStats["stats"];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const now = new Date();
  const monthName = now.toLocaleString("tr-TR", { month: "long", year: "numeric" });
  const m = stats.month;

  const vatLine = m.payableVat > 0
    ? `💰 Tahmini Ödenecek KDV: ₺${fmt(m.payableVat)}\n   ⏰ Son ödeme tarihi: Her ayın 26'sı`
    : `✅ Bu ay KDV devredecek (₺${fmt(m.carryForwardVat)} devreden KDV)`;

  const message = `Sayın ${company.name},

${monthName} dönemi vergi ön kontrolü tamamlandı.

📊 Fatura Özeti:
• Gelen: ${m.incoming.count} fatura — ₺${fmt(m.incoming.gross)} brüt
• Giden: ${m.outgoing.count} fatura — ₺${fmt(m.outgoing.gross)} brüt

${vatLine}

${stats.riskyCount > 0 ? `⚠️ ${stats.riskyCount} adet riskli gider tespit edildi. KDV indirimi reddedilebilir.\n\n` : ""}Bu hesaplama tahmini bir ön kontrol raporudur. Kesin vergi beyanı için onayınızı bekliyorum.

— TaxControl ile hazırlanmıştır`;

  async function copy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Müşteriye Gönder</h2>
            <p className="text-xs text-gray-400 mt-0.5">{company.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg font-light">✕</button>
        </div>
        <div className="p-5">
          <pre className="text-xs text-gray-700 bg-gray-50 rounded-xl p-4 whitespace-pre-wrap font-sans leading-relaxed border border-gray-100 max-h-64 overflow-y-auto">
            {message}
          </pre>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={copy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "Kopyalandı!" : "Kopyala"}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
          >
            <Send className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const { t } = useLanguage();
  const [data, setData] = useState<CompanyStats | null>(null);
  const [trend, setTrend] = useState<TrendMonth[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("incoming");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [showSend, setShowSend] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [statsRes, trendRes] = await Promise.all([
      fetch(`/api/accountant/company/${companyId}`),
      fetch(`/api/accountant/company/${companyId}/trend`),
    ]);
    if (statsRes.ok) setData(await statsRes.json());
    if (trendRes.ok) setTrend((await trendRes.json()).months);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
  if (!data) return <div className="text-center py-16 text-gray-400 text-sm">Firma verisi yüklenemedi.</div>;

  const { company, stats } = data;
  const m = stats.month;
  const q = stats.quarter;
  const now = new Date();
  const monthName = now.toLocaleString("tr-TR", { month: "long", year: "numeric" });

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "incoming", label: t.navIncoming, icon: ArrowDownToLine },
    { key: "outgoing", label: t.navOutgoing, icon: ArrowUpFromLine },
    { key: "risky", label: t.navRisky, icon: AlertTriangle },
    { key: "vat", label: "KDV & Vergi", icon: Receipt },
    { key: "trend", label: "Trend", icon: BarChart2 },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link href="/muhasebeci" className="text-gray-400 hover:text-gray-600 transition-colors mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{company.name}</h1>
              <p className="text-xs text-gray-400">
                VKN: {company.taxNumber}{company.taxOffice && ` · ${company.taxOffice}`} · {company.user.email}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button onClick={load} className="text-gray-400 hover:text-gray-600 p-2 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSend(true)}
            className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium"
          >
            <Send className="w-3.5 h-3.5" />
            Müşteriye Gönder
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 text-sm bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-600 px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            {t.importBtnLabel}
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{monthName} — Özet</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Gelen Faturalar" value={String(m.incoming.count)} sub={`₺${fmt(m.incoming.gross)} brüt`} color="blue" icon={ArrowDownToLine} />
          <StatCard label="Giden Faturalar" value={String(m.outgoing.count)} sub={`₺${fmt(m.outgoing.gross)} brüt`} color="purple" icon={ArrowUpFromLine} />
          <StatCard
            label="Tahmini KDV"
            value={m.payableVat > 0 ? `₺${fmt(m.payableVat)}` : "Borç Yok"}
            sub={m.carryForwardVat > 0 ? `₺${fmt(m.carryForwardVat)} devreden` : `₺${fmt(m.calculatedVat)} hesaplanan`}
            color={m.payableVat > 0 ? "red" : "green"}
            icon={Wallet}
          />
          <StatCard
            label="Riskli / Onay"
            value={`${stats.riskyCount} / ${stats.reviewCount}`}
            sub="riskli · bekleyen"
            color={stats.riskyCount > 0 ? "orange" : "gray"}
            icon={AlertTriangle}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit overflow-x-auto">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === tb.key ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Trend */}
      {tab === "trend" && trend && (
        <div className="space-y-4">
          <TrendChart months={trend} />
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Aylık Detay</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  {["Ay", "Giden Net", "Gelen Net", "Hesaplanan KDV", "İndirilecek KDV", "Net KDV"].map(h => (
                    <th key={h} className="text-left px-5 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trend.map((m) => (
                  <tr key={m.label} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-700">{m.label}</td>
                    <td className="px-5 py-3 text-gray-600">{m.outgoingCount > 0 ? `₺${fmt(m.outgoingNet)}` : "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{m.incomingCount > 0 ? `₺${fmt(m.incomingNet)}` : "—"}</td>
                    <td className="px-5 py-3 text-blue-600 font-medium">{m.outgoingVat > 0 ? `₺${fmt(m.outgoingVat)}` : "—"}</td>
                    <td className="px-5 py-3 text-green-600 font-medium">{m.incomingVat > 0 ? `₺${fmt(m.incomingVat)}` : "—"}</td>
                    <td className={`px-5 py-3 font-bold ${m.netVat > 0 ? "text-red-600" : m.netVat < 0 ? "text-green-600" : "text-gray-400"}`}>
                      {m.netVat !== 0 ? `₺${fmt(Math.abs(m.netVat))}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: KDV & Vergi */}
      {tab === "vat" && (
        <div className="space-y-4">
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠️ Bu özet tahmini bir ön kontrol raporudur. Kesin KDV beyanı ve yasal sorumluluk mükellef ve sertifikalı muhasebeciye aittir.
          </p>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">📋 {monthName} — KDV Hesaplama</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: "Satış Matrahı (Net)", value: m.outgoing.net, sub: `${m.outgoing.count} giden fatura`, color: "text-gray-800" },
                { label: "Hesaplanan KDV", value: m.calculatedVat, sub: "Satışlardan doğan KDV sorumluluğu", color: "text-blue-700" },
                { label: "Alış Matrahı (Net)", value: m.incoming.net, sub: `${m.incoming.count} gelen fatura`, color: "text-gray-800" },
                { label: "İndirilecek KDV", value: m.deductibleVat, sub: "Alışlardan doğan indirim hakkı", color: "text-green-700" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm text-gray-700">{row.label}</p>
                    <p className="text-xs text-gray-400">{row.sub}</p>
                  </div>
                  <p className={`text-sm font-semibold ${row.color}`}>₺{fmt(row.value)}</p>
                </div>
              ))}
              <div className={`flex items-center justify-between px-5 py-4 ${m.payableVat > 0 ? "bg-red-50" : "bg-green-50"}`}>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {m.payableVat > 0 ? "⚠️ Tahmini Ödenecek KDV" : "✅ Tahmini Devreden KDV"}
                  </p>
                  <p className="text-xs text-gray-500">Hesaplanan − İndirilecek KDV</p>
                </div>
                <p className={`text-xl font-bold ${m.payableVat > 0 ? "text-red-600" : "text-green-600"}`}>
                  ₺{fmt(m.payableVat > 0 ? m.payableVat : m.carryForwardVat)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">📊 {q.year} {q.number}. Çeyrek — Geçici Vergi</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: "Toplam Ciro (Net Satış)", value: q.outgoingNet },
                { label: "İndirilebilir Giderler", value: q.incomingNet },
                { label: "Tahmini Kâr (Matrah)", value: q.estimatedProfit },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
                  <p className="text-sm text-gray-700">{row.label}</p>
                  <p className="text-sm font-semibold text-gray-800">₺{fmt(row.value)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-4 bg-orange-50">
                <div>
                  <p className="text-sm font-bold text-gray-800">Tahmini Geçici Vergi</p>
                  <p className="text-xs text-gray-500">%{(q.taxRate * 100).toFixed(0)} oran ile</p>
                </div>
                <p className="text-xl font-bold text-orange-600">₺{fmt(q.provisionalTax)}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Toplam Gelen" value={String(stats.allIncoming)} sub="tüm zamanlar" color="blue" icon={FileText} />
            <StatCard label="Toplam Giden" value={String(stats.allOutgoing)} sub="tüm zamanlar" color="purple" icon={FileText} />
            <StatCard label="Riskli Gider" value={String(stats.riskyCount)} sub="KDV sorunu" color={stats.riskyCount > 0 ? "red" : "gray"} icon={AlertTriangle} />
            <StatCard label="Onay Bekleyen" value={String(stats.reviewCount)} sub="muhasebeci onayı" color={stats.reviewCount > 0 ? "orange" : "gray"} icon={ClipboardCheck} />
          </div>
        </div>
      )}

      {/* Invoice tabs */}
      {tab !== "vat" && tab !== "trend" && (
        <InvoiceTable
          key={`${tab}-${refreshKey}`}
          direction={tab === "risky" ? "incoming" : tab}
          riskyOnly={tab === "risky"}
          companyId={companyId}
          bulkMode
        />
      )}

      {showImport && (
        <ImportModal
          direction={tab === "outgoing" ? "outgoing" : "incoming"}
          companyId={companyId}
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); setRefreshKey(k => k + 1); load(); }}
        />
      )}

      {showSend && data && (
        <SendToClientModal company={company} stats={stats} onClose={() => setShowSend(false)} />
      )}
    </div>
  );
}
