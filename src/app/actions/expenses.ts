"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type HouseholdMembership = {
  household_id: string;
  role?: string;
};

export type Expense = {
  id: string;
  household_id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  is_shared: boolean; // true = visible to all, false = personal/private
  category?: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  user?: {
    full_name: string | null;
    email: string;
  } | null;
};

export type ExpenseFilters = {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
};

// Ottiene le spese dell'household con filtri opzionali
export async function getExpenses(filters?: ExpenseFilters): Promise<{
  expenses: Expense[];
  total: number;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { expenses: [], total: 0 };

  // Ottieni l'household dell'utente
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembership | null;
  if (!membership) return { expenses: [], total: 0 };

  // Query base
  let query = supabase
    .from("expenses")
    .select(`
      *,
      category:expense_categories(id, name, icon, color),
      user:users(full_name, email)
    `, { count: "exact" })
    .eq("household_id", membership.household_id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  // Applica filtri
  if (filters?.startDate) {
    query = query.gte("date", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("date", filters.endDate);
  }
  if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters?.userId) {
    query = query.eq("user_id", filters.userId);
  }

  // Paginazione
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching expenses:", error);
    return { expenses: [], total: 0 };
  }

  const expenses = (data as Expense[] | null) || [];
  return {
    expenses: expenses.map((e) => ({
      ...e,
      category: Array.isArray(e.category) ? e.category[0] : e.category,
      user: Array.isArray(e.user) ? e.user[0] : e.user,
    })),
    total: count || 0,
  };
}

// Crea una nuova spesa
export async function createExpense(data: {
  amount: number;
  description?: string;
  category_id?: string;
  date?: string;
  is_shared?: boolean; // default true
}): Promise<{ success: boolean; error?: string; expense?: Expense }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Ottieni l'household
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembership | null;
  if (!membership) {
    return { success: false, error: "Non sei membro di nessuna casa" };
  }

  // Validazione
  if (!data.amount || data.amount <= 0) {
    return { success: false, error: "L'importo deve essere maggiore di zero" };
  }

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      household_id: membership.household_id,
      user_id: user.id,
      amount: data.amount,
      description: data.description?.trim() || null,
      category_id: data.category_id || null,
      date: data.date || new Date().toISOString().split("T")[0],
      is_shared: data.is_shared !== false, // default to true
    } as never)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/spese");
  revalidatePath("/dashboard");
  return { success: true, expense };
}

// Aggiorna una spesa esistente (solo proprie spese)
export async function updateExpense(
  id: string,
  data: {
    amount?: number;
    description?: string;
    category_id?: string | null;
    date?: string;
    is_shared?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Verifica che la spesa appartenga all'utente
  const { data: expenseData } = await supabase
    .from("expenses")
    .select("user_id")
    .eq("id", id)
    .single();

  type ExpenseUserId = { user_id: string };
  const expense = expenseData as ExpenseUserId | null;
  if (!expense) {
    return { success: false, error: "Spesa non trovata" };
  }

  if (expense.user_id !== user.id) {
    return { success: false, error: "Puoi modificare solo le tue spese" };
  }

  // Validazione
  if (data.amount !== undefined && data.amount <= 0) {
    return { success: false, error: "L'importo deve essere maggiore di zero" };
  }

  const updateData: Record<string, unknown> = {};
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.category_id !== undefined) updateData.category_id = data.category_id;
  if (data.date !== undefined) updateData.date = data.date;
  if (data.is_shared !== undefined) updateData.is_shared = data.is_shared;

  const { error } = await supabase
    .from("expenses")
    .update(updateData as never)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/spese");
  revalidatePath("/dashboard");
  return { success: true };
}

// Elimina una spesa (solo proprie spese)
export async function deleteExpense(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Verifica che la spesa appartenga all'utente
  const { data: expenseData } = await supabase
    .from("expenses")
    .select("user_id")
    .eq("id", id)
    .single();

  type ExpenseUserId = { user_id: string };
  const expense = expenseData as ExpenseUserId | null;
  if (!expense) {
    return { success: false, error: "Spesa non trovata" };
  }

  if (expense.user_id !== user.id) {
    return { success: false, error: "Puoi eliminare solo le tue spese" };
  }

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/spese");
  revalidatePath("/dashboard");
  return { success: true };
}

// Ottiene il riepilogo delle spese per periodo
export async function getExpensesSummary(period?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  total: number;
  byCategory: Array<{
    category_id: string | null;
    category_name: string;
    category_color: string;
    total: number;
    count: number;
  }>;
  byUser: Array<{
    user_id: string;
    user_name: string;
    total: number;
    count: number;
  }>;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { total: 0, byCategory: [], byUser: [] };
  }

  // Ottieni l'household
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembership | null;
  if (!membership) {
    return { total: 0, byCategory: [], byUser: [] };
  }

  // Periodo default: mese corrente
  const now = new Date();
  const startDate = period?.startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const endDate = period?.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  // Ottieni tutte le spese del periodo
  type ExpenseSummaryRow = {
    id: string;
    amount: number;
    category_id: string | null;
    user_id: string;
    category: { name: string; color: string } | null;
    user: { full_name: string | null; email: string } | null;
  };
  const { data: expensesData } = await supabase
    .from("expenses")
    .select(`
      id,
      amount,
      category_id,
      user_id,
      category:expense_categories(name, color),
      user:users(full_name, email)
    `)
    .eq("household_id", membership.household_id)
    .gte("date", startDate)
    .lte("date", endDate);

  const expenses = (expensesData as ExpenseSummaryRow[] | null) || [];
  if (expenses.length === 0) {
    return { total: 0, byCategory: [], byUser: [] };
  }

  // Calcola totale
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Raggruppa per categoria
  const categoryMap = new Map<string, { name: string; color: string; total: number; count: number }>();
  expenses.forEach((e) => {
    const catId = e.category_id || "uncategorized";
    const cat = Array.isArray(e.category) ? e.category[0] : e.category;
    const existing = categoryMap.get(catId) || {
      name: cat?.name || "Senza categoria",
      color: cat?.color || "#6b7280",
      total: 0,
      count: 0,
    };
    existing.total += Number(e.amount);
    existing.count += 1;
    categoryMap.set(catId, existing);
  });

  // Raggruppa per utente
  const userMap = new Map<string, { name: string; total: number; count: number }>();
  expenses.forEach((e) => {
    const usr = Array.isArray(e.user) ? e.user[0] : e.user;
    const existing = userMap.get(e.user_id) || {
      name: usr?.full_name || usr?.email?.split("@")[0] || "Utente",
      total: 0,
      count: 0,
    };
    existing.total += Number(e.amount);
    existing.count += 1;
    userMap.set(e.user_id, existing);
  });

  return {
    total,
    byCategory: Array.from(categoryMap.entries())
      .map(([id, data]) => ({
        category_id: id === "uncategorized" ? null : id,
        category_name: data.name,
        category_color: data.color,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total),
    byUser: Array.from(userMap.entries())
      .map(([id, data]) => ({
        user_id: id,
        user_name: data.name,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total),
  };
}
