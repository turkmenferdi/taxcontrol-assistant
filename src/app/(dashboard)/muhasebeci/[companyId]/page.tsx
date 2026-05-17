"use client";

import { useState, useEffect, use } from "react";
import { useLanguage } from "@/contexts/language-context";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import ImportModal from "@/components/invoices/ImportModal";
import { ArrowLeft, Building2, AlertTriangle, Upload } from "lucide-react";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  taxNumber: string;
  taxOffice: string | null;
  companyType: string;
  vatPeriod: string;
  user: { name: string | null; email: string };
}

type Tab = "incoming" | "outgoing" | "risky";

export default function ClientDetailPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const { t } = useLanguage();
  const [company, setCompany] = useState<Company | null>(null);
  const [tab, setTab] = useState<Tab>("incoming");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    fetch("/api/accountant/clients")
      .then((r) => r.json())
      .then((clients: Company[]) => {
        const found = clients.find((c) => c.id === companyId);
        if (found) setCompany(found);
      });
  }, [companyId]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "incoming", label: t.navIncoming },
    { key: "outgoing", label: t.navOutgoing },
    { key: "risky", label: t.navRisky },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/muhasebeci"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              {company?.name ?? "..."}
            </h1>
            {company && (
              <p className="text-xs text-gray-400">
                {t.taxNumberLabel}: {company.taxNumber}
                {company.taxOffice && ` · ${company.taxOffice}`}
                {" · "}{company.user.email}
              </p>
            )}
          </div>
        </div>

        <div className="ml-auto">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 text-sm bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-600 px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            {t.importBtnLabel}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === tb.key
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tb.key === "risky" && <AlertTriangle className="w-3.5 h-3.5" />}
            {tb.label}
          </button>
        ))}
      </div>

      <InvoiceTable
        key={`${tab}-${refreshKey}`}
        direction={tab === "risky" ? "incoming" : tab}
        riskyOnly={tab === "risky"}
        companyId={companyId}
      />

      {showImport && (
        <ImportModal
          direction={tab === "outgoing" ? "outgoing" : "incoming"}
          companyId={companyId}
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); setRefreshKey((k) => k + 1); }}
        />
      )}
    </div>
  );
}
