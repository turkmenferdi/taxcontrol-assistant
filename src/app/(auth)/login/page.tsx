"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Briefcase, Calculator } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, setLang } = useLanguage();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"owner" | "accountant">("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login" ? { email, password } : { email, password, name, role };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? t.loginError); setLoading(false); return; }
    router.push(mode === "register" && role === "accountant" ? "/muhasebeci" : "/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Lang toggle */}
        <div className="flex justify-end gap-1 mb-4">
          {(["tr", "en"] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${lang === l ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TaxControl</h1>
          <p className="text-slate-400 text-sm mt-1">{t.appSubtitle}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Mode tabs */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            {([["login", t.signIn], ["register", t.signUp]] as const).map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${mode === m ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                {/* Role selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.registerRoleLabel}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("owner")}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${role === "owner" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      <Briefcase className="w-5 h-5" />
                      <span className="text-xs font-semibold">{t.registerRoleOwner}</span>
                      <span className="text-xs opacity-60 leading-tight">{t.registerRoleOwnerDesc}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("accountant")}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${role === "accountant" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      <Calculator className="w-5 h-5" />
                      <span className="text-xs font-semibold">{t.registerRoleAccountant}</span>
                      <span className="text-xs opacity-60 leading-tight">{t.registerRoleAccountantDesc}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.fullName}</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 shadow-sm">
              {loading ? t.loading : mode === "login" ? t.signIn : t.createAccount}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4 px-4">{t.authDisclaimer}</p>
      </div>
    </div>
  );
}
