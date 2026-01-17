"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Users, Lock } from "lucide-react";
import { createExpense, updateExpense, type Expense } from "@/app/actions/expenses";
import { type Category } from "@/app/actions/categories";

interface ExpenseFormProps {
  expense?: Expense;
  categories: Category[];
  mode: "create" | "edit";
}

export default function ExpenseForm({ expense, categories, mode }: ExpenseFormProps) {
  const [amount, setAmount] = useState(expense?.amount?.toString() || "");
  const [description, setDescription] = useState(expense?.description || "");
  const [categoryId, setCategoryId] = useState(expense?.category_id || "");
  const [date, setDate] = useState(
    expense?.date || new Date().toISOString().split("T")[0]
  );
  const [isShared, setIsShared] = useState(expense?.is_shared !== false); // default true
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = {
      amount: parseFloat(amount),
      description: description || undefined,
      category_id: categoryId || undefined,
      date,
      is_shared: isShared,
    };

    let result;
    if (mode === "create") {
      result = await createExpense(data);
    } else {
      result = await updateExpense(expense!.id, data);
    }

    if (result.success) {
      router.push("/spese");
      router.refresh();
    } else {
      setError(result.error || "Errore nel salvataggio");
      setLoading(false);
    }
  };

  const formatAmount = (value: string) => {
    // Rimuovi tutto tranne numeri e punto/virgola
    const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".");
    // Permetti solo un punto decimale
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }
    // Limita a 2 decimali
    if (parts[1]?.length > 2) {
      return parts[0] + "." + parts[1].slice(0, 2);
    }
    return cleaned;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Importo */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Importo *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            €
          </span>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(formatAmount(e.target.value))}
            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-2xl font-semibold"
            placeholder="0.00"
            required
            autoFocus
          />
        </div>
      </div>

      {/* Descrizione */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descrizione
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="es. Spesa settimanale al supermercato"
        />
      </div>

      {/* Categoria */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Categoria
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
        >
          <option value="">Seleziona categoria</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Data */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          Data
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          required
        />
      </div>

      {/* Spesa condivisa/personale toggle */}
      <div className="border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={() => setIsShared(!isShared)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
            isShared
              ? "border-primary-200 bg-primary-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isShared
                  ? "bg-primary-100 text-primary-600"
                  : "bg-amber-100 text-amber-600"
              }`}
            >
              {isShared ? (
                <Users className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">
                {isShared ? "Spesa condivisa" : "Spesa personale"}
              </p>
              <p className="text-sm text-gray-500">
                {isShared
                  ? "Visibile a tutti i membri della casa"
                  : "Visibile solo a te"}
              </p>
            </div>
          </div>
          <div
            className={`w-12 h-7 rounded-full p-1 transition-colors ${
              isShared ? "bg-primary-500" : "bg-amber-500"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isShared ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
        </button>
      </div>

      {/* Errore */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !amount || parseFloat(amount) <= 0}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Salvataggio...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            {mode === "create" ? "Aggiungi spesa" : "Salva modifiche"}
          </>
        )}
      </button>
    </form>
  );
}
