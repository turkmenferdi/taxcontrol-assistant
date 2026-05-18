"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import ImportModal from "@/components/invoices/ImportModal";
import {
  ArrowLeft, Building2, AlertTriangle, Upload, FileText, Receipt,
  TrendingUp, Wallet, ClipboardCheck, ArrowDownToLine, ArrowUpFromLine,
  CheckCircle2, RefreshCw, Send, BarChart2, Copy, Check, StickyNote,
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

type Tab = "incoming" | "outgoing" | "risky" | "vat" | "trend" | "notes";

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
  const { t } = useLanguage();
  const maxVal = Math.max(...months.flatMap(m => [m.outgoingNet, m.incomingNet]), 1);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700">{t.trendTitle}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" />{t.statOutgoing}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />{t.statIncoming}</span>
        </div>
      </div>
      <div className="flex items-end gap-3 h-40">
        {months.map((m) => (
          <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-0.5 items-end" style={{ height: "120px" }}>
              <div
                className="flex-1 bg-blue-400 rounded-t-sm transition-all"
                style={{ height: `${(m.outgoingNet / maxVal) * 100}%`, minHeight: m.outgoingNet > 0 ? "4px" : "0" }}
                title={`${t.statOutgoing}: ${fmt(m.outgoingNet)}`}
              />
              <div
                className="flex-1 bg-emerald-400 rounded-t-sm transition-all"
                style={{ height: `${(m.incomingNet / maxVal) * 100}%`, minHeight: m.incomingNet > 0 ? "4px" : "0" }}
                title={`${t.statIncoming}: ${fmt(m.incomingNet)}`}
              />
            </div>
            <p className="text-xs text-gray-400">{m.label}</p>
            <p className={`text-xs font-semibold ${m.netVat > 0 ? "text-red-500" : m.netVat < 0 ? "text-green-500" : "text-gray-400"}`}>
              {m.netVat !== 0 ? fmtK(Math.abs(m.netVat)) : "—"}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">{t.trendFootnote}</p>
    </div>
  );
}

function SendToClientModal({ company, stats, onClose }: {
  company: CompanyStats["company"];
  stats: CompanyStats["stats"];
  onClose: () => void;
}) {
  const { t } = useLanguage();
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
            <h2 className="text-base font-semibold text-gray-800">{t.sendToClient}</h2>
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
            {copied ? t.copiedLabel : t.copyLabel}
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
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [statsRes, trendRes, noteRes] = await Promise.all([
      fetch(`/api/accountant/company/${companyId}`),
      fetch(`/api/accountant/company/${companyId}/trend`),
      fetch(`/api/accountant/company/${companyId}/note`),
    ]);
    if (statsRes.ok) setData(await statsRes.json());
    if (trendRes.ok) setTrend((await trendRes.json()).months);
    if (noteRes.ok) setNote((await noteRes.json()).note ?? "");
    setLoading(false);
  }, [companyId]);

  async function saveNote() {
    setNoteSaving(true);
    await fetch(`/api/accountant/company/${companyId}/note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setNoteSaving(false);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
  if (!data) return <div className="text-center py-16 text-gray-400 text-sm">{t.companyDataError}</div>;

  const { company, stats } = data;
  const m = stats.month;
  const q = stats.quarter;
  const now = new Date();
  const monthName = now.toLocaleString("tr-TR", { month: "long", year: "numeric" });

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "incoming", label: t.navIncoming, icon: ArrowDownToLine },
    { key: "outgoing", label: t.navOutgoing, icon: ArrowUpFromLine },
    { key: "risky", label: t.navRisky, icon: AlertTriangle },
    { key: "vat", label: t.tabVatTax, icon: Receipt },
    { key: "trend", label: t.tabTrend, icon: BarChart2 },
    { key: "notes", label: t.tabNotes, icon: StickyNote },
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
            {t.sendToClient}
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
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t.summaryLabel(monthName)}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label={t.kpiIncoming} value={String(m.incoming.count)} sub={`₺${fmt(m.incoming.gross)} brüt`} color="blue" icon={ArrowDownToLine} />
          <StatCard label={t.kpiOutgoing} value={String(m.outgoing.count)} sub={`₺${fmt(m.outgoing.gross)} brüt`} color="purple" icon={ArrowUpFromLine} />
          <StatCard
            label={t.statEstVat}
            value={m.payableVat > 0 ? `₺${fmt(m.payableVat)}` : t.noLiability}
            sub={m.carryForwardVat > 0 ? `₺${fmt(m.carryForwardVat)} ${t.kpiVatCarry}` : `₺${fmt(m.calculatedVat)} ${t.kpiVatOut}`}
            color={m.payableVat > 0 ? "red" : "green"}
            icon={Wallet}
          />
          <StatCard
            label={t.statRiskyReview}
            value={`${stats.riskyCount} / ${stats.reviewCount}`}
            sub={t.statRiskyReviewSub}
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
              <p className="text-sm font-semibold text-gray-700">{t.trendMonthlyDetail}</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  {[t.trendHeaderMonth, t.trendHeaderOutNet, t.trendHeaderInNet, t.trendHeaderCalcVat, t.trendHeaderDeductVat, t.trendHeaderNetVat].map(h => (
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
            {t.vatWarning}
          </p>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">📋 {t.vatCalcTitle(monthName)}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: t.vatSalesBase, value: m.outgoing.net, sub: t.vatSalesSub(m.outgoing.count), color: "text-gray-800" },
                { label: t.vatCalculated, value: m.calculatedVat, sub: t.vatCalcSub, color: "text-blue-700" },
                { label: t.vatPurchaseBase, value: m.incoming.net, sub: t.vatPurchSub(m.incoming.count), color: "text-gray-800" },
                { label: t.vatDeductible, value: m.deductibleVat, sub: t.vatDeductSub, color: "text-green-700" },
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
                    {m.payableVat > 0 ? `⚠️ ${t.kpiVatPayable}` : `✅ ${t.kpiVatCarry}`}
                  </p>
                  <p className="text-xs text-gray-500">{t.vatFormulaShort}</p>
                </div>
                <p className={`text-xl font-bold ${m.payableVat > 0 ? "text-red-600" : "text-green-600"}`}>
                  ₺{fmt(m.payableVat > 0 ? m.payableVat : m.carryForwardVat)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">📊 {t.quarterlyTax(q.year, q.number)}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: t.provRevenue, value: q.outgoingNet },
                { label: t.provExpenses, value: q.incomingNet },
                { label: t.provProfit, value: q.estimatedProfit },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
                  <p className="text-sm text-gray-700">{row.label}</p>
                  <p className="text-sm font-semibold text-gray-800">₺{fmt(row.value)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-4 bg-orange-50">
                <div>
                  <p className="text-sm font-bold text-gray-800">{t.provTax}</p>
                  <p className="text-xs text-gray-500">{t.rateWith(q.taxRate * 100)}</p>
                </div>
                <p className="text-xl font-bold text-orange-600">₺{fmt(q.provisionalTax)}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label={t.statAllIncoming} value={String(stats.allIncoming)} sub={t.allTimeLabel} color="blue" icon={FileText} />
            <StatCard label={t.statAllOutgoing} value={String(stats.allOutgoing)} sub={t.allTimeLabel} color="purple" icon={FileText} />
            <StatCard label={t.statRiskyLabel} value={String(stats.riskyCount)} sub={t.statRiskySub} color={stats.riskyCount > 0 ? "red" : "gray"} icon={AlertTriangle} />
            <StatCard label={t.statPendingLabel} value={String(stats.reviewCount)} sub={t.statPendingSub} color={stats.reviewCount > 0 ? "orange" : "gray"} icon={ClipboardCheck} />
          </div>
        </div>
      )}

      {/* Tab: Notes */}
      {tab === "notes" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="w-4 h-4 text-yellow-500" />
            <p className="text-sm font-semibold text-gray-700">{t.clientNotesTitle}</p>
          </div>
          <p className="text-xs text-gray-400 mb-3">{t.clientNotesDesc}</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={10}
            placeholder="Müşteriyle ilgili notlarınızı buraya yazın...&#10;&#10;Örnek:&#10;• Beyanname teslim etmem gerekiyor&#10;• KDV iadesi takip ediliyor&#10;• E-fatura sistemine geçiş planlanıyor"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-400">{note.length} karakter</p>
            <button
              onClick={saveNote}
              disabled={noteSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {noteSaved ? (
                <><CheckCircle2 className="w-4 h-4 text-green-300" /> {t.savedOk}</>
              ) : noteSaving ? t.saving : (
                <><Check className="w-4 h-4" /> {t.save}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Invoice tabs */}
      {tab !== "vat" && tab !== "trend" && tab !== "notes" && (
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
