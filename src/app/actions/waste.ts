"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type HouseholdMembership = {
  household_id: string;
  role?: string;
};

type ScheduleHouseholdId = {
  household_id: string;
  is_active?: boolean;
};

// Types
export type WasteSchedule = {
  id: string;
  household_id: string;
  waste_type: string;
  day_of_week: number; // 0-6 (Domenica-Sabato)
  reminder_time: string; // "HH:MM:SS"
  deadline_time: string | null;
  is_active: boolean;
};

// Get all waste schedules for household
export async function getWasteSchedules(): Promise<WasteSchedule[]> {
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

  const { data: schedules, error } = await supabase
    .from("waste_schedules")
    .select("*")
    .eq("household_id", membership.household_id)
    .order("day_of_week", { ascending: true });

  if (error) {
    console.error("Error fetching waste schedules:", error);
    return [];
  }

  return (schedules as WasteSchedule[] | null) || [];
}

// Create waste schedule (admin only)
export async function createWasteSchedule(data: {
  waste_type: string;
  day_of_week: number;
  reminder_time: string;
  deadline_time?: string;
}): Promise<{ success: boolean; error?: string; schedule?: WasteSchedule }> {
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
    return { success: false, error: "Solo gli admin possono creare calendari rifiuti" };
  }

  // Validate day_of_week
  if (data.day_of_week < 0 || data.day_of_week > 6) {
    return { success: false, error: "Giorno della settimana non valido" };
  }

  const { data: schedule, error } = await supabase
    .from("waste_schedules")
    .insert({
      household_id: membership.household_id,
      waste_type: data.waste_type,
      day_of_week: data.day_of_week,
      reminder_time: data.reminder_time,
      deadline_time: data.deadline_time || null,
      is_active: true,
    } as never)
    .select()
    .single();

  if (error) {
    console.error("Error creating waste schedule:", error);
    return { success: false, error: "Errore nella creazione del calendario" };
  }

  revalidatePath("/rifiuti");
  revalidatePath("/dashboard");

  return { success: true, schedule };
}

// Update waste schedule (admin only)
export async function updateWasteSchedule(
  id: string,
  data: Partial<{
    waste_type: string;
    day_of_week: number;
    reminder_time: string;
    deadline_time: string | null;
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
    return { success: false, error: "Solo gli admin possono modificare i calendari" };
  }

  // Verify schedule belongs to household
  const { data: existingScheduleData } = await supabase
    .from("waste_schedules")
    .select("household_id")
    .eq("id", id)
    .single();

  const existingSchedule = existingScheduleData as ScheduleHouseholdId | null;
  if (!existingSchedule || existingSchedule.household_id !== membership.household_id) {
    return { success: false, error: "Calendario non trovato" };
  }

  // Validate day_of_week if provided
  if (data.day_of_week !== undefined && (data.day_of_week < 0 || data.day_of_week > 6)) {
    return { success: false, error: "Giorno della settimana non valido" };
  }

  const { error } = await supabase.from("waste_schedules").update(data as never).eq("id", id);

  if (error) {
    console.error("Error updating waste schedule:", error);
    return { success: false, error: "Errore nell'aggiornamento del calendario" };
  }

  revalidatePath("/rifiuti");
  revalidatePath("/dashboard");

  return { success: true };
}

// Delete waste schedule (admin only)
export async function deleteWasteSchedule(
  id: string
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
    return { success: false, error: "Solo gli admin possono eliminare i calendari" };
  }

  // Verify schedule belongs to household
  const { data: existingScheduleData } = await supabase
    .from("waste_schedules")
    .select("household_id")
    .eq("id", id)
    .single();

  const existingSchedule = existingScheduleData as ScheduleHouseholdId | null;
  if (!existingSchedule || existingSchedule.household_id !== membership.household_id) {
    return { success: false, error: "Calendario non trovato" };
  }

  const { error } = await supabase.from("waste_schedules").delete().eq("id", id);

  if (error) {
    console.error("Error deleting waste schedule:", error);
    return { success: false, error: "Errore nell'eliminazione del calendario" };
  }

  revalidatePath("/rifiuti");
  revalidatePath("/dashboard");

  return { success: true };
}

// Toggle waste schedule active status
export async function toggleWasteSchedule(
  id: string
): Promise<{ success: boolean; error?: string; is_active?: boolean }> {
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
    return { success: false, error: "Solo gli admin possono modificare i calendari" };
  }

  // Get current status
  const { data: scheduleData } = await supabase
    .from("waste_schedules")
    .select("household_id, is_active")
    .eq("id", id)
    .single();

  const schedule = scheduleData as ScheduleHouseholdId | null;
  if (!schedule || schedule.household_id !== membership.household_id) {
    return { success: false, error: "Calendario non trovato" };
  }

  const newStatus = !schedule.is_active;

  const { error } = await supabase
    .from("waste_schedules")
    .update({ is_active: newStatus } as never)
    .eq("id", id);

  if (error) {
    console.error("Error toggling waste schedule:", error);
    return { success: false, error: "Errore nell'aggiornamento del calendario" };
  }

  revalidatePath("/rifiuti");
  revalidatePath("/dashboard");

  return { success: true, is_active: newStatus };
}

// Get next waste collection (for dashboard)
export async function getNextWasteCollection(): Promise<{
  type: string;
  day: string;
  dayNumber: number;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's household
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembership | null;
  if (!membership) return null;

  type WasteScheduleRow = { waste_type: string; day_of_week: number };
  const { data: schedulesData } = await supabase
    .from("waste_schedules")
    .select("waste_type, day_of_week")
    .eq("household_id", membership.household_id)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true });

  const schedules = (schedulesData as WasteScheduleRow[] | null) || [];
  if (schedules.length === 0) return null;

  const today = new Date().getDay(); // 0 = Sunday
  const days = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

  // Find next collection
  // First, look for collections later this week
  let nextCollection = schedules.find((s) => s.day_of_week > today);

  // If none found, get the first one next week
  if (!nextCollection) {
    nextCollection = schedules[0];
  }

  return {
    type: nextCollection.waste_type,
    day: days[nextCollection.day_of_week],
    dayNumber: nextCollection.day_of_week,
  };
}
