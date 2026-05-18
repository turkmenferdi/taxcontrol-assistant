"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Building2, Plus, Trash2, RefreshCw, AlertCircle, Search, ChevronRight, Check, X, StickyNote } from "lucide-react";
import Link from "next/link";

interface ClientCompany {
  id: string;
  name: string;
  taxNumber: string;
  taxOffice: string | null;
  companyType: string;
  vatPeriod: string;
  note: string | null;
  _count: { invoices: number };
  user: { name: string | null; email: string };
}

export default function MusteriYonetimiPage() {
  const { t } = useLanguage();
  const [clients, setClients] = useState<ClientCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [taxNumber, setTaxNumber] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/accountant/clients");
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addClient(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/accountant/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taxNumber: taxNumber.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess(t.clientAddSuccess);
      setTaxNumber("");
      load();
      setTimeout(() => setSuccess(""), 3500);
    } else {
      setError(data.error || t.clientAddError);
    }
    setAdding(false);
  }

  async function removeClient(companyId: string) {
    await fetch("/api/accountant/clients", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId }),
    });
    setConfirmingId(null);
    load();
  }

  const vatPeriodLabel = (p: string) =>
    p === "monthly" ? t.vatPeriodMonthly : p === "quarterly" ? t.vatPeriodQuarterly : p;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.taxNumber.includes(q) ||
        c.user.email.toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">{t.clientManagementTitle}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.clientManagementDesc}</p>
      </div>

      {/* Add client form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t.clientAddTitle}
        </h2>
        <form onSubmit={addClient} className="flex gap-3">
          <input
            type="text"
            value={taxNumber}
            onChange={(e) => setTaxNumber(e.target.value)}
            placeholder={t.clientTaxNumberPlaceholder}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={11}
          />
          <button
            type="submit"
            disabled={adding || !taxNumber.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {adding ? t.clientAdding : t.clientAddBtn}
          </button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </p>
        )}
        {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
      </div>

      {/* Client list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 gap-3">
          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            {t.clientListTitle} ({clients.length})
          </span>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.clientSearchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={load} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">{t.loading}</div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t.clientListEmpty}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">{t.clientSearchEmpty}</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <Link href={`/muhasebeci/${c.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                      {c.note && (
                        <StickyNote className="w-3 h-3 text-yellow-400 flex-shrink-0" title="Not var" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {t.taxNumberLabel}: {c.taxNumber}
                      {c.taxOffice && ` · ${c.taxOffice}`}
                      {" · "}{vatPeriodLabel(c.vatPeriod)}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className="text-xs text-gray-400">{c._count.invoices} {t.invoiceCount}</span>
                  {confirmingId === c.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-600 font-medium">Emin misiniz?</span>
                      <button onClick={() => removeClient(c.id)}
                        className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirmingId(null)}
                        className="p-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Link href={`/muhasebeci/${c.id}`} className="text-gray-300 hover:text-blue-500 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setConfirmingId(c.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
