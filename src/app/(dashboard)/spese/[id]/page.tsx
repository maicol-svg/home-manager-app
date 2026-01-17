import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { getCategories } from "@/app/actions/categories";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ExpenseWithRelations {
  id: string;
  user_id: string;
  household_id: string;
  category_id: string | null;
  amount: number;
  description: string | null;
  date: string;
  is_shared: boolean;
  created_at: string;
  category: { id: string; name: string; icon: string | null; color: string } | null;
  user: { full_name: string | null; email: string } | null;
}

export default async function ModificaSpesaPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Ottieni l'utente corrente
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ottieni la spesa
  const { data: expenseData } = await supabase
    .from("expenses")
    .select(`
      *,
      category:expense_categories(id, name, icon, color),
      user:users(full_name, email)
    `)
    .eq("id", id)
    .single();

  const expense = expenseData as ExpenseWithRelations | null;

  if (!expense) {
    notFound();
  }

  // Verifica che l'utente sia il proprietario
  if (expense.user_id !== user.id) {
    redirect("/spese");
  }

  const categories = await getCategories();

  // Formatta la spesa per il form
  const formattedExpense = {
    ...expense,
    category: Array.isArray(expense.category) ? expense.category[0] : expense.category,
    user: Array.isArray(expense.user) ? expense.user[0] : expense.user,
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/spese"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alle spese
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Modifica spesa</h1>
        <ExpenseForm expense={formattedExpense} categories={categories} mode="edit" />
      </div>
    </div>
  );
}
