"use client";

import { useState } from "react";
import { Copy, Check, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateHouseholdBudget } from "@/app/actions/household";

interface CopyCodeButtonProps {
  code: string;
}

export function CopyCodeButton({ code }: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="min-w-[100px]"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2 text-green-600" />
          Copiato!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-2" />
          Copia
        </>
      )}
    </Button>
  );
}

interface BudgetFormProps {
  currentBudget: number | null;
  isAdmin: boolean;
}

export function BudgetForm({ currentBudget, isAdmin }: BudgetFormProps) {
  const [budget, setBudget] = useState(currentBudget?.toString() || "");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsLoading(true);
    setMessage(null);

    const budgetValue = parseFloat(budget) || 0;
    const result = await updateHouseholdBudget(budgetValue);

    setIsLoading(false);
    if (result.success) {
      setMessage({ type: "success", text: "Budget aggiornato!" });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: "error", text: result.error || "Errore" });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-primary-50 rounded-lg">
          <Wallet className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Budget Mensile</h3>
          <p className="text-sm text-gray-500">
            Imposta un limite di spesa mensile per la tua casa
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="0"
            min="0"
            step="50"
            disabled={!isAdmin}
            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        {isAdmin ? (
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salva"}
          </Button>
        ) : (
          <p className="text-sm text-gray-500">Solo admin</p>
        )}
      </form>

      {message && (
        <p className={`mt-2 text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      {!currentBudget && (
        <p className="mt-3 text-xs text-gray-400">
          Imposta un budget per vedere la barra di progresso nella dashboard
        </p>
      )}
    </div>
  );
}
