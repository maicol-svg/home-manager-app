"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { InsertTables, UpdateTables } from "@/types/database";

export type Category = {
  id: string;
  household_id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

type HouseholdMembership = {
  household_id: string;
  role?: string;
};

type CategoryHouseholdId = {
  household_id: string;
};

// Ottiene tutte le categorie dell'household dell'utente
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Ottieni l'household dell'utente
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembership | null;
  if (!membership) return [];

  const { data: categories } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("household_id", membership.household_id)
    .order("name");

  return (categories as Category[] | null) || [];
}

// Crea una nuova categoria
export async function createCategory(data: {
  name: string;
  icon?: string;
  color?: string;
}): Promise<{ success: boolean; error?: string; category?: Category }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Ottieni l'household e verifica che sia admin
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembership | null;
  if (!membership) {
    return { success: false, error: "Non sei membro di nessuna casa" };
  }

  if (membership.role !== "admin") {
    return { success: false, error: "Solo gli admin possono creare categorie" };
  }

  // Verifica che non esista già una categoria con lo stesso nome
  const { data: existing } = await supabase
    .from("expense_categories")
    .select("id")
    .eq("household_id", membership.household_id)
    .ilike("name", data.name.trim())
    .single();

  if (existing) {
    return { success: false, error: "Esiste già una categoria con questo nome" };
  }

  const insertData: InsertTables<"expense_categories"> = {
    household_id: membership.household_id,
    name: data.name.trim(),
    icon: data.icon || "tag",
    color: data.color || "#6b7280",
  };

  const { data: category, error } = await supabase
    .from("expense_categories")
    .insert(insertData as never)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/spese");
  return { success: true, category };
}

// Aggiorna una categoria esistente
export async function updateCategory(
  id: string,
  data: {
    name?: string;
    icon?: string;
    color?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Verifica che sia admin
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembership | null;
  if (!membership || membership.role !== "admin") {
    return { success: false, error: "Solo gli admin possono modificare categorie" };
  }

  // Verifica che la categoria appartenga all'household
  const { data: categoryData } = await supabase
    .from("expense_categories")
    .select("household_id")
    .eq("id", id)
    .single();

  const category = categoryData as CategoryHouseholdId | null;
  if (!category || category.household_id !== membership.household_id) {
    return { success: false, error: "Categoria non trovata" };
  }

  const updateData: UpdateTables<"expense_categories"> = {};
  if (data.name) updateData.name = data.name.trim();
  if (data.icon) updateData.icon = data.icon;
  if (data.color) updateData.color = data.color;

  const { error } = await supabase
    .from("expense_categories")
    .update(updateData as never)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/spese");
  return { success: true };
}

// Elimina una categoria
export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Verifica che sia admin
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembership | null;
  if (!membership || membership.role !== "admin") {
    return { success: false, error: "Solo gli admin possono eliminare categorie" };
  }

  // Verifica che la categoria appartenga all'household
  const { data: categoryData } = await supabase
    .from("expense_categories")
    .select("household_id")
    .eq("id", id)
    .single();

  const category = categoryData as CategoryHouseholdId | null;
  if (!category || category.household_id !== membership.household_id) {
    return { success: false, error: "Categoria non trovata" };
  }

  // Le spese con questa categoria avranno category_id = null (grazie a ON DELETE SET NULL)
  const { error } = await supabase
    .from("expense_categories")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/spese");
  return { success: true };
}
