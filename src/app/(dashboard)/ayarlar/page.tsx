"use client";

import { useEffect, useState } from "react";

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
  const [form, setForm] = useState<Company>({
    name: "", taxNumber: "", taxOffice: "", companyType: "sole_proprietorship",
    vatPeriod: "monthly", providerName: "mock",
  });
  const [isnetConfig, setIsnetConfig] = useState<IsnetConfig>(DEFAULT_ISNET);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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
    setMsg(res.ok ? "Ayarlar kaydedildi." : "Kaydetme hatası.");
    setSaving(false);
  }

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Firma Ayarları</h1>
      <form onSubmit={handleSave} className="max-w-xl space-y-5">

        {/* Firma Bilgileri */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">Firma Bilgileri</h2>
          <Field label="Firma Adı" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Vergi No / VKN veya TCKN" value={form.taxNumber} onChange={(v) => setForm({ ...form, taxNumber: v })} required />
          <Field label="Vergi Dairesi" value={form.taxOffice} onChange={(v) => setForm({ ...form, taxOffice: v })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firma Türü</label>
            <select value={form.companyType} onChange={(e) => setForm({ ...form, companyType: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="sole_proprietorship">Şahıs Şirketi</option>
              <option value="limited_company">Limited Şirket</option>
              <option value="other">Diğer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KDV Dönemi</label>
            <select value={form.vatPeriod} onChange={(e) => setForm({ ...form, vatPeriod: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="monthly">Aylık</option>
              <option value="quarterly">3 Aylık</option>
            </select>
          </div>
        </div>

        {/* Fatura Sağlayıcı */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">Fatura Sağlayıcı</h2>

          <div className="flex gap-3">
            <ProviderCard
              active={form.providerName === "mock"}
              onClick={() => setForm({ ...form, providerName: "mock" })}
              title="Demo Modu"
              description="Gerçek fatura bağlantısı yok, örnek verilerle çalışır"
              badge="Ücretsiz"
            />
            <ProviderCard
              active={form.providerName === "isnet"}
              onClick={() => setForm({ ...form, providerName: "isnet" })}
              title="İşNet NetteFatura"
              description="İşNet e-fatura hesabınızla bağlanın"
              badge="API"
            />
          </div>

          {form.providerName === "mock" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              Demo modunda örnek faturalar kullanılmaktadır. İstediğiniz zaman İşNet hesabınızla değiştirebilirsiniz.
            </div>
          )}

          {form.providerName === "isnet" && (
            <div className="space-y-3 pt-1">
              <Field
                label="API Base URL"
                value={isnetConfig.baseUrl}
                onChange={(v) => setIsnetConfig({ ...isnetConfig, baseUrl: v })}
              />
              <Field
                label="Kullanıcı Adı / TC Kimlik No"
                value={isnetConfig.username}
                onChange={(v) => setIsnetConfig({ ...isnetConfig, username: v })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                <input
                  type="password"
                  value={isnetConfig.password}
                  onChange={(e) => setIsnetConfig({ ...isnetConfig, password: e.target.value })}
                  placeholder="Değiştirmek için yeni şifre girin"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Field
                label="Firma ID (varsa)"
                value={isnetConfig.companyId}
                onChange={(v) => setIsnetConfig({ ...isnetConfig, companyId: v })}
              />
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
                Şifreler sunucuda şifreli olarak saklanır ve tarayıcıya gönderilmez. API entegrasyonu için İşNet teknik desteğinden doğru endpoint bilgilerini alın.
              </div>
            </div>
          )}
        </div>

        {msg && (
          <p className={`text-sm ${msg.includes("hata") ? "text-red-600" : "text-green-600"}`}>{msg}</p>
        )}

        <button type="submit" disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
          {saving ? "Kaydediliyor..." : "Kaydet"}
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
