"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { InsertTables, UpdateTables } from "@/types/database";

// Types
export type Bill = {
  id: string;
  household_id: string;
  name: string;
  amount: number | null;
  due_day: number; // 1-31
  reminder_days_before: number;
  category: string | null;
  is_active: boolean;
  last_paid_date: string | null;
  source: "manual" | "gmail";
};

type HouseholdMembership = {
  household_id: string;
  role?: string;
};

type BillHouseholdId = {
  household_id: string;
};

// Get all bills for household
export async function getBills(): Promise<Bill[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get user's household
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembership | null;
  if (!membership) return [];

  const { data: bills, error } = await supabase
    .from("recurring_bills")
    .select("*")
    .eq("household_id", membership.household_id)
    .order("due_day", { ascending: true });

  if (error) {
    console.error("Error fetching bills:", error);
    return [];
  }

  return bills || [];
}

// Create bill (admin only)
export async function createBill(data: {
  name: string;
  amount?: number;
  due_day: number;
  reminder_days_before?: number;
  category?: string;
}): Promise<{ success: boolean; error?: string; bill?: Bill }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Get user's household and role
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
    return { success: false, error: "Solo gli admin possono creare scadenze" };
  }

  // Validate due_day
  if (data.due_day < 1 || data.due_day > 31) {
    return { success: false, error: "Giorno di scadenza non valido (1-31)" };
  }

  const insertData: InsertTables<"recurring_bills"> = {
    household_id: membership.household_id,
    name: data.name.trim(),
    amount: data.amount || null,
    due_day: data.due_day,
    reminder_days_before: data.reminder_days_before || 3,
    category: data.category || null,
    is_active: true,
    source: "manual",
  };

  const { data: bill, error } = await supabase
    .from("recurring_bills")
    .insert(insertData as never)
    .select()
    .single();

  if (error) {
    console.error("Error creating bill:", error);
    return { success: false, error: "Errore nella creazione della scadenza" };
  }

  revalidatePath("/bollette");
  revalidatePath("/dashboard");

  return { success: true, bill };
}

// Update bill (admin only)
export async function updateBill(
  id: string,
  data: Partial<{
    name: string;
    amount: number | null;
    due_day: number;
    reminder_days_before: number;
    category: string | null;
    is_active: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Get user's household and role
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
    return { success: false, error: "Solo gli admin possono modificare le scadenze" };
  }

  // Verify bill belongs to household
  const { data: existingBillData } = await supabase
    .from("recurring_bills")
    .select("household_id")
    .eq("id", id)
    .single();

  const existingBill = existingBillData as BillHouseholdId | null;
  if (!existingBill || existingBill.household_id !== membership.household_id) {
    return { success: false, error: "Scadenza non trovata" };
  }

  // Validate due_day if provided
  if (data.due_day !== undefined && (data.due_day < 1 || data.due_day > 31)) {
    return { success: false, error: "Giorno di scadenza non valido (1-31)" };
  }

  const updateData: UpdateTables<"recurring_bills"> = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.due_day !== undefined) updateData.due_day = data.due_day;
  if (data.reminder_days_before !== undefined)
    updateData.reminder_days_before = data.reminder_days_before;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  const { error } = await supabase.from("recurring_bills").update(updateData as never).eq("id", id);

  if (error) {
    console.error("Error updating bill:", error);
    return { success: false, error: "Errore nell'aggiornamento della scadenza" };
  }

  revalidatePath("/bollette");
  revalidatePath("/dashboard");

  return { success: true };
}

// Delete bill (admin only)
export async function deleteBill(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Get user's household and role
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
    return { success: false, error: "Solo gli admin possono eliminare le scadenze" };
  }

  // Verify bill belongs to household
  const { data: existingBillData } = await supabase
    .from("recurring_bills")
    .select("household_id")
    .eq("id", id)
    .single();

  const existingBill = existingBillData as BillHouseholdId | null;
  if (!existingBill || existingBill.household_id !== membership.household_id) {
    return { success: false, error: "Scadenza non trovata" };
  }

  const { error } = await supabase.from("recurring_bills").delete().eq("id", id);

  if (error) {
    console.error("Error deleting bill:", error);
    return { success: false, error: "Errore nell'eliminazione della scadenza" };
  }

  revalidatePath("/bollette");
  revalidatePath("/dashboard");

  return { success: true };
}

// Mark bill as paid
export async function markBillPaid(
  id: string,
  paidDate?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Get user's household
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembership | null;
  if (!membership) {
    return { success: false, error: "Non sei membro di nessuna casa" };
  }

  // Verify bill belongs to household
  const { data: existingBillData } = await supabase
    .from("recurring_bills")
    .select("household_id")
    .eq("id", id)
    .single();

  const existingBill = existingBillData as BillHouseholdId | null;
  if (!existingBill || existingBill.household_id !== membership.household_id) {
    return { success: false, error: "Scadenza non trovata" };
  }

  const updateData: UpdateTables<"recurring_bills"> = {
    last_paid_date: paidDate || new Date().toISOString().split("T")[0],
  };
  const { error } = await supabase
    .from("recurring_bills")
    .update(updateData as never)
    .eq("id", id);

  if (error) {
    console.error("Error marking bill as paid:", error);
    return { success: false, error: "Errore nel segnare la scadenza come pagata" };
  }

  revalidatePath("/bollette");
  revalidatePath("/dashboard");

  return { success: true };
}

// Get upcoming bills (for dashboard)
export async function getUpcomingBills(): Promise<Bill[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get user's household
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembership | null;
  if (!membership) return [];

  const { data: billsData } = await supabase
    .from("recurring_bills")
    .select("*")
    .eq("household_id", membership.household_id)
    .eq("is_active", true);

  const bills = (billsData as Bill[] | null) || [];
  if (!bills.length) return [];

  // Filter bills that are upcoming (within reminder window)
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  return bills.filter((bill) => {
    // Check if already paid this month
    if (bill.last_paid_date) {
      const lastPaid = new Date(bill.last_paid_date);
      if (lastPaid.getMonth() === currentMonth && lastPaid.getFullYear() === currentYear) {
        return false; // Already paid this month
      }
    }

    // Check if within reminder window
    const dueDay = bill.due_day;
    const reminderDays = bill.reminder_days_before || 3;

    // Simple check: is due_day within the next reminderDays days?
    const daysUntilDue = dueDay - currentDay;

    // If due_day is in the past this month, it's for next month
    if (daysUntilDue < 0) {
      return false; // Due next month
    }

    return daysUntilDue <= reminderDays;
  });
}

// getBillStatus is exported from @/lib/constants
