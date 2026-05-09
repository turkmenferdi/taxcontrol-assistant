"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, setLang } = useLanguage();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login" ? { email, password } : { email, password, name };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? t.loginError); setLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end gap-1 mb-4">
          <button
            onClick={() => setLang("tr")}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${lang === "tr" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
          >TR</button>
          <button
            onClick={() => setLang("en")}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${lang === "en" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
          >EN</button>
        </div>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TaxControl</h1>
          <p className="text-slate-400 text-sm mt-1">{t.appSubtitle}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button onClick={() => setMode("login")}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${mode === "login" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
              {t.signIn}
            </button>
            <button onClick={() => setMode("register")}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${mode === "register" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
              {t.signUp}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.fullName}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
              {loading ? t.loading : mode === "login" ? t.signIn : t.createAccount}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">{t.authDisclaimer}</p>
      </div>
    </div>
  );
}
