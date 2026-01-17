"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Loader2, Lock } from "lucide-react";
import { deleteExpense, type Expense } from "@/app/actions/expenses";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface ExpenseListProps {
  expenses: Expense[];
  currentUserId: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);

export default function ExpenseList({ expenses, currentUserId }: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa spesa?")) return;

    setDeletingId(id);
    const result = await deleteExpense(id);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Errore nell'eliminazione");
    }
    setDeletingId(null);
  };

  if (expenses.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrizione
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chi
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Importo
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map((expense) => {
              const isOwner = expense.user_id === currentUserId;
              return (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {format(new Date(expense.date), "d MMM yyyy", { locale: it })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      {expense.description || "-"}
                      {!expense.is_shared && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600" title="Spesa personale">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {expense.category ? (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${expense.category.color}20`,
                          color: expense.category.color || "#6b7280",
                        }}
                      >
                        {expense.category.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {expense.user?.full_name || expense.user?.email?.split("@")[0] || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {isOwner && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/spese/${expense.id}`)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="Modifica"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={deletingId === expense.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Elimina"
                        >
                          {deletingId === expense.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {expenses.map((expense) => {
          const isOwner = expense.user_id === currentUserId;
          return (
            <div key={expense.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-500">
                      {format(new Date(expense.date), "d MMM", { locale: it })}
                    </span>
                    {expense.category && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${expense.category.color}20`,
                          color: expense.category.color || "#6b7280",
                        }}
                      >
                        {expense.category.name}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 font-medium truncate flex items-center gap-1.5">
                    {expense.description || "Spesa"}
                    {!expense.is_shared && (
                      <Lock className="w-3 h-3 text-amber-500" />
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {expense.user?.full_name || expense.user?.email?.split("@")[0]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(expense.amount)}
                  </p>
                  {isOwner && (
                    <div className="flex items-center justify-end gap-1 mt-2">
                      <button
                        onClick={() => router.push(`/spese/${expense.id}`)}
                        className="p-1.5 text-gray-400 hover:text-primary-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId === expense.id}
                        className="p-1.5 text-gray-400 hover:text-red-600"
                      >
                        {deletingId === expense.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
