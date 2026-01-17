"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Loader2, ArrowRightLeft } from "lucide-react";
import { switchHousehold } from "@/app/actions/household";

export default function SwitchHouseholdCard() {
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    // Show confirmation first
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await switchHousehold(inviteCode.trim());

    if (result.success) {
      // Redirect to dashboard with new household
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(result.error || "Errore nel cambio casa");
      setShowConfirm(false);
    }

    setIsLoading(false);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setError(null);
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
          <ArrowRightLeft className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Cambia casa</h2>
          <p className="text-sm text-muted-foreground">
            Unisciti a un'altra casa con un codice invito
          </p>
        </div>
      </div>

      {showConfirm ? (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              Sei sicuro di voler cambiare casa?
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Lascerai la casa attuale e le tue spese rimarranno associate ad essa.
              Potrai creare nuove spese nella nuova casa.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-muted-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cambio in corso...
                </>
              ) : (
                "Conferma cambio"
              )}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-foreground mb-1">
              Codice invito
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-colors uppercase"
                placeholder="ABC123"
                maxLength={6}
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!inviteCode.trim() || isLoading}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verifica codice
          </button>

          <p className="text-xs text-muted-foreground">
            Lascerai la casa attuale per unirti alla nuova.
          </p>
        </form>
      )}
    </div>
  );
}
