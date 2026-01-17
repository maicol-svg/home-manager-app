"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Users, ArrowRight, Loader2, Plus, UserPlus } from "lucide-react";
import { createHousehold, joinHousehold } from "@/app/actions/household";

type Step = "choice" | "create" | "join";

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("choice");
  const [houseName, setHouseName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseName.trim()) return;

    setLoading(true);
    setError(null);

    const result = await createHousehold(houseName);

    if (result.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(result.error || "Errore nella creazione");
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setError(null);

    const result = await joinHousehold(inviteCode);

    if (result.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(result.error || "Errore nell'unirsi");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md">
        {/* Choice Step */}
        {step === "choice" && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <Home className="w-8 h-8 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Configura la tua casa</h1>
              <p className="text-gray-500 mt-2">
                Per iniziare, crea una nuova casa o unisciti a una esistente
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setStep("create")}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
              >
                <div className="p-3 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                  <Plus className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">Crea una nuova casa</p>
                  <p className="text-sm text-gray-500">Inizia da zero e invita i tuoi coinquilini</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </button>

              <button
                onClick={() => setStep("join")}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
              >
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">Unisciti a una casa</p>
                  <p className="text-sm text-gray-500">Hai un codice invito? Inseriscilo qui</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* Create Step */}
        {step === "create" && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button
              onClick={() => setStep("choice")}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              ← Indietro
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-3">
                <Plus className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Crea la tua casa</h2>
              <p className="text-gray-500 text-sm mt-1">
                Dai un nome alla tua casa per iniziare
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="houseName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome della casa
                </label>
                <input
                  id="houseName"
                  type="text"
                  value={houseName}
                  onChange={(e) => setHouseName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="es. Casa di Via Roma"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !houseName.trim()}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creazione in corso...
                  </>
                ) : (
                  <>
                    Crea casa
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Join Step */}
        {step === "join" && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button
              onClick={() => setStep("choice")}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              ← Indietro
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <UserPlus className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Unisciti a una casa</h2>
              <p className="text-gray-500 text-sm mt-1">
                Inserisci il codice invito che hai ricevuto
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Codice invito
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-center text-2xl font-mono tracking-widest uppercase"
                  placeholder="ABC123"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || inviteCode.length < 6}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifica in corso...
                  </>
                ) : (
                  <>
                    Unisciti
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
