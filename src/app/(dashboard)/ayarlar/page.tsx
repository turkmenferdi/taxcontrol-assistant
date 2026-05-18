"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { User } from "lucide-react";

interface Company {
  name: string;
  taxNumber: string;
  taxOffice: string;
  companyType: string;
  vatPeriod: string;
  providerName: string;
}

interface IsnetConfig {
  baseUrl: string;
  username: string;
  password: string;
  companyId: string;
}

const DEFAULT_ISNET: IsnetConfig = {
  baseUrl: "https://api.nettafatura.com.tr",
  username: "",
  password: "",
  companyId: "",
};

export default function AyarlarPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState<Company>({
    name: "", taxNumber: "", taxOffice: "", companyType: "sole_proprietorship",
    vatPeriod: "monthly", providerName: "mock",
  });
  const [isnetConfig, setIsnetConfig] = useState<IsnetConfig>(DEFAULT_ISNET);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Profile section
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; role: string } | null>(null);
  const [profileName, setProfileName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  useEffect(() => {
    fetch("/api/company")
      .then((r) => r.json())
      .then((d) => {
        if (d.company) {
          setForm((f) => ({ ...f, ...d.company }));
          if (d.company.providerConfig) {
            try {
              const cfg = JSON.parse(d.company.providerConfig);
              setIsnetConfig((c) => ({ ...c, ...cfg, password: "" }));
            } catch {}
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg("");

    const providerConfig =
      form.providerName === "isnet"
        ? { baseUrl: isnetConfig.baseUrl, username: isnetConfig.username, companyId: isnetConfig.companyId, ...(isnetConfig.password ? { password: isnetConfig.password } : {}) }
        : null;

    const res = await fetch("/api/company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, providerConfig }),
    });
    setMsg(res.ok ? t.savedOk : t.saveError);
    setSaving(false);
  }

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.settingsTitle}</h1>
      <form onSubmit={handleSave} className="max-w-xl space-y-5">

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">{t.companyInfo}</h2>
          <Field label={t.companyName} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label={t.taxId} value={form.taxNumber} onChange={(v) => setForm({ ...form, taxNumber: v })} required />
          <Field label={t.taxOffice} value={form.taxOffice} onChange={(v) => setForm({ ...form, taxOffice: v })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.companyType}</label>
            <select value={form.companyType} onChange={(e) => setForm({ ...form, companyType: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="sole_proprietorship">{t.typeSole}</option>
              <option value="limited_company">{t.typeLimited}</option>
              <option value="other">{t.typeOther}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.vatPeriodLabel}</label>
            <select value={form.vatPeriod} onChange={(e) => setForm({ ...form, vatPeriod: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="monthly">{t.vatMonthly}</option>
              <option value="quarterly">{t.vatQuarterly}</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">{t.providerSection}</h2>

          <div className="flex gap-3">
            <ProviderCard
              active={form.providerName === "mock"}
              onClick={() => setForm({ ...form, providerName: "mock" })}
              title={t.demoMode}
              description={t.demoDesc}
              badge={t.free}
            />
            <ProviderCard
              active={form.providerName === "isnet"}
              onClick={() => setForm({ ...form, providerName: "isnet" })}
              title="İşNet NetteFatura"
              description={t.isnetDesc}
              badge="API"
            />
          </div>

          {form.providerName === "mock" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              {t.demoInfo}
            </div>
          )}

          {form.providerName === "isnet" && (
            <div className="space-y-3 pt-1">
              <Field label={t.apiBaseUrl} value={isnetConfig.baseUrl} onChange={(v) => setIsnetConfig({ ...isnetConfig, baseUrl: v })} />
              <Field label={t.username} value={isnetConfig.username} onChange={(v) => setIsnetConfig({ ...isnetConfig, username: v })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
                <input
                  type="password"
                  value={isnetConfig.password}
                  onChange={(e) => setIsnetConfig({ ...isnetConfig, password: e.target.value })}
                  placeholder={t.passwordPlaceholder}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Field label={t.companyId} value={isnetConfig.companyId} onChange={(v) => setIsnetConfig({ ...isnetConfig, companyId: v })} />
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
                {t.isnetNote}
              </div>
            </div>
          )}
        </div>

        {msg && (
          <p className={`text-sm ${msg === t.saveError ? "text-red-600" : "text-green-600"}`}>{msg}</p>
        )}

        <button type="submit" disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
          {saving ? t.loading : t.saveBtn}
        </button>
      </form>
    </div>
  );
}

function ProviderCard({ active, onClick, title, description, badge }: {
  active: boolean; onClick: () => void; title: string; description: string; badge: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 text-left p-4 rounded-xl border-2 transition-colors ${active ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm text-gray-900">{title}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${active ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"}`}>{badge}</span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </button>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}
