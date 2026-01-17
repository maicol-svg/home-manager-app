import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { getCategories } from "@/app/actions/categories";

export default async function NuovaSpesaPage() {
  const categories = await getCategories();

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
        <h1 className="text-xl font-bold text-gray-900 mb-6">Nuova spesa</h1>
        <ExpenseForm categories={categories} mode="create" />
      </div>
    </div>
  );
}
