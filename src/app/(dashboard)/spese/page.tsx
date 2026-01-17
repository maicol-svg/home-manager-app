import { Receipt, Plus } from "lucide-react";
import Link from "next/link";
import { getExpenses, getExpensesSummary } from "@/app/actions/expenses";
import { createClient } from "@/lib/supabase/server";
import ExpenseList from "@/components/expenses/ExpenseList";
import { Button } from "@/components/ui/button";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);

export default async function SpesePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ expenses, total }, summary] = await Promise.all([
    getExpenses({ limit: 50 }),
    getExpensesSummary(),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spese</h1>
          <p className="text-gray-500 mt-1">Gestisci le spese della casa</p>
        </div>
        <Button asChild>
          <Link href="/spese/nuova">
            <Plus className="w-5 h-5 mr-2" />
            Nuova spesa
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500 mb-1">Totale questo mese</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(summary.total)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500 mb-1">Numero spese</p>
          <p className="text-3xl font-bold text-gray-900">{total}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500 mb-2">Top categoria</p>
          {summary.byCategory.length > 0 ? (
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${summary.byCategory[0].category_color}20`,
                  color: summary.byCategory[0].category_color,
                }}
              >
                {summary.byCategory[0].category_name}
              </span>
              <span className="text-gray-600 font-medium">
                {formatCurrency(summary.byCategory[0].total)}
              </span>
            </div>
          ) : (
            <p className="text-gray-400">-</p>
          )}
        </div>
      </div>

      {/* Expenses List */}
      {expenses.length > 0 ? (
        <ExpenseList expenses={expenses} currentUserId={user?.id || ""} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessuna spesa registrata
          </h3>
          <p className="text-gray-500 mb-6">
            Inizia a tracciare le spese della tua casa per avere sempre sotto
            controllo il budget.
          </p>
          <Button asChild>
            <Link href="/spese/nuova">
              <Plus className="w-5 h-5 mr-2" />
              Aggiungi la prima spesa
            </Link>
          </Button>
        </div>
      )}

      {/* Link to categories */}
      <div className="mt-8 text-center">
        <Link
          href="/spese/categorie"
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Gestisci categorie →
        </Link>
      </div>
    </div>
  );
}
