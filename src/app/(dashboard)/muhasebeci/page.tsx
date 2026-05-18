"use client";

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Building2, FileText, AlertTriangle, TrendingUp, RefreshCw, Search, ChevronRight, Clock, ClipboardList } from "lucide-react";
import Link from "next/link";

interface ClientSummary {
  company: {
    id: string; name: string; taxNumber: string; vatPeriod: string;
    user: { name: string | null; email: string };
  };
  incomingCount: number;
  outgoingCount: number;
  thisMonthIncoming: { count: number; netAmount: number; vatAmount: number };
  thisMonthOutgoing: { count: number; netAmount: number; vatAmount: number };
  riskyInvoices: number;
  pendingReviewCount: number;
}

interface SummaryData {
  clients: ClientSummary[];
  totalCompanies: number;
  totalInvoices: number;
}

function getKdvCountdown() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const deadline = new Date(year, month, 26, 23, 59, 59);
  if (now > deadline) {
    const nextDeadline = new Date(year, month + 1, 26, 23, 59, 59);
    const diff = Math.ceil((nextDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { days: diff, isPast: true, nextMonth: true };
  }
  const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { days: diff, isPast: false, nextMonth: false };
}

function healthScore(c: ClientSummary): { score: number; color: "green" | "yellow" | "red"; emoji: string } {
  let score = 100;
  score -= Math.min(c.riskyInvoices * 8, 40);
  score -= Math.min(c.pendingReviewCount * 5, 20);
  if (c.thisMonthIncoming.count === 0 && c.thisMonthOutgoing.count === 0) score -= 10;
  const netVat = c.thisMonthOutgoing.vatAmount - c.thisMonthIncoming.vatAmount;
  if (netVat > 50000) score -= 10;

  if (score >= 80) return { score, color: "green", emoji: "🟢" };
  if (score >= 50) return { score, color: "yellow", emoji: "🟡" };
  return { score, color: "red", emoji: "🔴" };
}

const healthColors = {
  green: "bg-green-50 text-green-700 border-green-200",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
  red: "bg-red-50 text-red-700 border-red-200",
};

export default function MuhasebecPage() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterHealth, setFilterHealth] = useState<"all" | "red" | "yellow" | "green">("all");

  const formatAmount = (n: number) =>
    new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const healthLabel = { green: t.healthClean, yellow: t.healthCaution, red: t.healthUrgent };

  async function load() {
    setLoading(true);
    const res = await fetch("/api/accountant/summary");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.clients;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(c =>
      c.company.name.toLowerCase().includes(q) ||
      c.company.taxNumber.includes(q) ||
      c.company.user.email.toLowerCase().includes(q)
    );
    if (filterHealth !== "all") list = list.filter(c => healthScore(c).color === filterHealth);
    return list;
  }, [data, search, filterHealth]);

  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">{t.loading}</div>;

  if (!data || data.clients.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <Building2 className="w-12 h-12 mx-auto text-gray-200 mb-3" />
        <p className="text-gray-500 text-sm mb-4">{t.accountantNoClients}</p>
        <Link href="/musteri-yonetimi" className="inline-flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          {t.goToClientManagement}
        </Link>
      </div>
    );
  }

  const healthCounts = data.clients.reduce(
    (acc, c) => { acc[healthScore(c).color]++; return acc; },
    { green: 0, yellow: 0, red: 0 }
  );
  const totalRisky = data.clients.reduce((s, c) => s + c.riskyInvoices, 0);
  const totalPendingReview = data.clients.reduce((s, c) => s + c.pendingReviewCount, 0);
  const totalThisMonthVat = data.clients.reduce(
    (s, c) => s + c.thisMonthOutgoing.vatAmount - c.thisMonthIncoming.vatAmount, 0
  );

  const kdv = getKdvCountdown();
  const kdvUrgent = kdv.days <= 3;
  const kdvWarning = kdv.days <= 7 && !kdvUrgent;

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

      {/* KDV deadline countdown */}
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 mb-5 ${
        kdvUrgent ? "bg-red-50 border-red-200" : kdvWarning ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"
      }`}>
        <Clock className={`w-5 h-5 flex-shrink-0 ${kdvUrgent ? "text-red-500" : kdvWarning ? "text-yellow-500" : "text-blue-500"}`} />
        <div className="flex-1">
          <p className={`text-sm font-semibold ${kdvUrgent ? "text-red-700" : kdvWarning ? "text-yellow-700" : "text-blue-700"}`}>
            {kdv.nextMonth ? t.kdvDeadlineDone : t.kdvDeadlineTitle}
          </p>
          <p className={`text-xs mt-0.5 ${kdvUrgent ? "text-red-600" : kdvWarning ? "text-yellow-600" : "text-blue-600"}`}>
            {kdv.nextMonth ? t.kdvNextMonthDays(kdv.days) : t.kdvDaysLeft(kdv.days)}
          </p>
        </div>
        <div className={`text-2xl font-bold flex-shrink-0 ${kdvUrgent ? "text-red-600" : kdvWarning ? "text-yellow-600" : "text-blue-600"}`}>
          {kdv.days}{t.kdvDaysUnit}
        </div>
      </div>

      {/* Bulk review CTA */}
      {(totalPendingReview > 0 || totalRisky > 0) && (
        <Link
          href="/toplu-inceleme"
          className="flex items-center gap-3 bg-white border border-blue-200 hover:border-blue-400 rounded-xl px-4 py-3 mb-5 shadow-sm transition-all group"
        >
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
            <ClipboardList className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">{t.navBulkReview}</p>
            <p className="text-xs text-gray-500">
              {totalPendingReview > 0 && t.pendingReviewLabel(totalPendingReview)}
              {totalPendingReview > 0 && totalRisky > 0 && " · "}
              {totalRisky > 0 && t.riskyInvoiceLabel(totalRisky)}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
        </Link>
      )}

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
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

      {/* Health filter + search */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "red", "yellow", "green"] as const).map((f) => {
          const labels = {
            all: t.filterAll(data.clients.length),
            red: t.filterUrgent(healthCounts.red),
            yellow: t.filterCaution(healthCounts.yellow),
            green: t.filterClean(healthCounts.green),
          };
          return (
            <button
              key={f}
              onClick={() => setFilterHealth(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${filterHealth === f ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
            >
              {labels[f]}
            </button>
          );
        })}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.clientSearchPlaceholder}
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
        </div>
      </div>

      {/* Client cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">{t.clientSearchEmpty}</div>
        ) : filtered.map((c) => {
          const health = healthScore(c);
          const netVat = c.thisMonthOutgoing.vatAmount - c.thisMonthIncoming.vatAmount;
          return (
            <Link
              key={c.company.id}
              href={`/muhasebeci/${c.company.id}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
            >
              {/* Health badge */}
              <div className={`w-16 text-center py-1.5 rounded-lg border text-xs font-bold flex-shrink-0 ${healthColors[health.color]}`}>
                <div className="text-lg leading-none">{health.emoji}</div>
                <div className="mt-0.5">{healthLabel[health.color]}</div>
              </div>

              {/* Company info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{c.company.name}</p>
                <p className="text-xs text-gray-400 truncate">{c.company.taxNumber} · {c.company.user.email}</p>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-6 text-xs flex-shrink-0">
                <div className="text-center">
                  <p className="text-gray-400">{t.statIncoming}</p>
                  <p className="font-semibold text-gray-700">{c.thisMonthIncoming.count}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">{t.statOutgoing}</p>
                  <p className="font-semibold text-gray-700">{c.thisMonthOutgoing.count}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">{t.statNetVatShort}</p>
                  <p className={`font-semibold ${netVat > 0 ? "text-red-600" : "text-green-600"}`}>
                    ₺{formatAmount(netVat)}
                  </p>
                </div>
                {c.riskyInvoices > 0 && (
                  <div className="flex items-center gap-1 text-red-500 bg-red-50 px-2 py-1 rounded-full" title={t.riskyInvoiceTooltip}>
                    <AlertTriangle className="w-3 h-3" />
                    <span className="font-semibold">{c.riskyInvoices}</span>
                  </div>
                )}
                {c.pendingReviewCount > 0 && (
                  <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full" title={t.pendingReviewTooltip}>
                    <span className="text-xs">⏳</span>
                    <span className="font-semibold">{c.pendingReviewCount}</span>
                  </div>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
