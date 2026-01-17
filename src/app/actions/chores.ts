"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type HouseholdMembership = {
  household_id: string;
  role?: string;
};

type ChoreHouseholdId = {
  household_id: string;
};

// Types
export type Chore = {
  id: string;
  household_id: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  points: number;
  current_assignee: string | null;
  rotation_order: string[];
  last_completed: string | null;
  next_due: string | null;
  is_active: boolean;
  assignee?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
};

export type ChoreCompletion = {
  id: string;
  chore_id: string;
  user_id: string;
  points_earned: number;
  completed_at: string;
  user?: {
    full_name: string | null;
    email: string;
  };
  chore?: {
    name: string;
  };
};

export type ChoreStats = {
  user_id: string;
  user_name: string;
  user_email: string;
  total_points: number;
  completed_count: number;
};

// Get all chores for household
export async function getChores(): Promise<Chore[]> {
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

  const { data: chores, error } = await supabase
    .from("chores")
    .select(
      `
      *,
      assignee:users!chores_current_assignee_fkey (
        id,
        full_name,
        email
      )
    `
    )
    .eq("household_id", membership.household_id)
    .order("next_due", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Error fetching chores:", error);
    return [];
  }

  return (chores as Chore[]) || [];
}

// Create new chore (admin only)
export async function createChore(data: {
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  points?: number;
  rotation_order?: string[];
}): Promise<{ success: boolean; error?: string; chore?: Chore }> {
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
    return { success: false, error: "Solo gli admin possono creare turni" };
  }

  // Calculate next_due based on frequency
  const now = new Date();
  let nextDue: Date;
  switch (data.frequency) {
    case "daily":
      nextDue = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      break;
    case "weekly":
      nextDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case "monthly":
      nextDue = new Date(now.setMonth(now.getMonth() + 1));
      break;
    default:
      nextDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  // Set first assignee from rotation_order if provided
  const rotationOrder = data.rotation_order || [];
  const firstAssignee = rotationOrder.length > 0 ? rotationOrder[0] : null;

  const { data: chore, error } = await supabase
    .from("chores")
    .insert({
      household_id: membership.household_id,
      name: data.name.trim(),
      frequency: data.frequency,
      points: data.points || 1,
      rotation_order: rotationOrder,
      current_assignee: firstAssignee,
      next_due: nextDue.toISOString(),
      is_active: true,
    } as never)
    .select()
    .single();

  if (error) {
    console.error("Error creating chore:", error);
    return { success: false, error: "Errore nella creazione del turno" };
  }

  revalidatePath("/turni");
  revalidatePath("/dashboard");

  return { success: true, chore: chore as Chore };
}

// Update chore (admin only)
export async function updateChore(
  id: string,
  data: Partial<{
    name: string;
    frequency: "daily" | "weekly" | "monthly";
    points: number;
    rotation_order: string[];
    current_assignee: string;
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
    return { success: false, error: "Solo gli admin possono modificare i turni" };
  }

  // Verify chore belongs to household
  const { data: existingChoreData } = await supabase
    .from("chores")
    .select("household_id")
    .eq("id", id)
    .single();

  const existingChore = existingChoreData as ChoreHouseholdId | null;
  if (!existingChore || existingChore.household_id !== membership.household_id) {
    return { success: false, error: "Turno non trovato" };
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.frequency !== undefined) updateData.frequency = data.frequency;
  if (data.points !== undefined) updateData.points = data.points;
  if (data.rotation_order !== undefined) updateData.rotation_order = data.rotation_order;
  if (data.current_assignee !== undefined) updateData.current_assignee = data.current_assignee;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  const { error } = await supabase.from("chores").update(updateData as never).eq("id", id);

  if (error) {
    console.error("Error updating chore:", error);
    return { success: false, error: "Errore nell'aggiornamento del turno" };
  }

  revalidatePath("/turni");
  revalidatePath("/dashboard");

  return { success: true };
}

// Delete chore (admin only)
export async function deleteChore(id: string): Promise<{ success: boolean; error?: string }> {
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
    return { success: false, error: "Solo gli admin possono eliminare i turni" };
  }

  // Verify chore belongs to household
  const { data: existingChoreData } = await supabase
    .from("chores")
    .select("household_id")
    .eq("id", id)
    .single();

  const existingChore = existingChoreData as ChoreHouseholdId | null;
  if (!existingChore || existingChore.household_id !== membership.household_id) {
    return { success: false, error: "Turno non trovato" };
  }

  const { error } = await supabase.from("chores").delete().eq("id", id);

  if (error) {
    console.error("Error deleting chore:", error);
    return { success: false, error: "Errore nell'eliminazione del turno" };
  }

  revalidatePath("/turni");
  revalidatePath("/dashboard");

  return { success: true };
}

// Complete chore (current assignee only)
export async function completeChore(
  id: string
): Promise<{ success: boolean; error?: string; points_earned?: number }> {
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

  // Get chore details
  const { data: choreData } = await supabase
    .from("chores")
    .select("*")
    .eq("id", id)
    .single();

  const chore = choreData as Chore | null;
  if (!chore) {
    return { success: false, error: "Turno non trovato" };
  }

  if (chore.household_id !== membership.household_id) {
    return { success: false, error: "Turno non trovato" };
  }

  if (chore.current_assignee !== user.id) {
    return { success: false, error: "Non sei l'assegnatario di questo turno" };
  }

  // Create completion record
  const { error: completionError } = await supabase.from("chore_completions").insert({
    chore_id: id,
    household_id: membership.household_id,
    user_id: user.id,
    points_earned: chore.points || 1,
  } as never);

  if (completionError) {
    console.error("Error creating completion:", completionError);
    return { success: false, error: "Errore nel completamento del turno" };
  }

  // Calculate next assignee (rotation)
  const rotationOrder: string[] = chore.rotation_order || [];
  let nextAssignee = chore.current_assignee;

  if (rotationOrder.length > 0) {
    const currentIndex = rotationOrder.indexOf(user.id);
    if (currentIndex === -1 || currentIndex >= rotationOrder.length - 1) {
      nextAssignee = rotationOrder[0];
    } else {
      nextAssignee = rotationOrder[currentIndex + 1];
    }
  }

  // Calculate next due date
  const now = new Date();
  let nextDue: Date;
  switch (chore.frequency) {
    case "daily":
      nextDue = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      break;
    case "weekly":
      nextDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case "monthly":
      nextDue = new Date(now);
      nextDue.setMonth(nextDue.getMonth() + 1);
      break;
    default:
      nextDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  // Update chore
  const { error: updateError } = await supabase
    .from("chores")
    .update({
      last_completed: new Date().toISOString(),
      current_assignee: nextAssignee,
      next_due: nextDue.toISOString(),
    } as never)
    .eq("id", id);

  if (updateError) {
    console.error("Error updating chore:", updateError);
    return { success: false, error: "Errore nell'aggiornamento del turno" };
  }

  revalidatePath("/turni");
  revalidatePath("/dashboard");

  return { success: true, points_earned: chore.points || 1 };
}

// Get chore stats for all household members
export async function getChoreStats(period?: {
  startDate?: string;
  endDate?: string;
}): Promise<ChoreStats[]> {
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

  // Get all members
  const { data: membersData } = await supabase
    .from("household_members")
    .select(
      `
      user_id,
      users (
        full_name,
        email
      )
    `
    )
    .eq("household_id", membership.household_id);

  type MemberWithUser = {
    user_id: string;
    users: { full_name: string | null; email: string } | null;
  };
  const members = (membersData as MemberWithUser[] | null) || [];
  if (!members.length) return [];

  // Build query for completions
  let query = supabase
    .from("chore_completions")
    .select("user_id, points_earned")
    .eq("household_id", membership.household_id);

  if (period?.startDate) {
    query = query.gte("completed_at", period.startDate);
  }
  if (period?.endDate) {
    query = query.lte("completed_at", period.endDate);
  }

  const { data: completionsData } = await query;

  type CompletionData = {
    user_id: string;
    points_earned: number;
  };
  const completions = (completionsData as CompletionData[] | null) || [];

  // Aggregate stats
  const statsMap = new Map<string, ChoreStats>();

  // Initialize all members with 0 points
  members.forEach((member) => {
    const userData = member.users;
    statsMap.set(member.user_id, {
      user_id: member.user_id,
      user_name: userData?.full_name || "Utente",
      user_email: userData?.email || "",
      total_points: 0,
      completed_count: 0,
    });
  });

  // Add completion data
  completions.forEach((completion) => {
    const existing = statsMap.get(completion.user_id);
    if (existing) {
      existing.total_points += completion.points_earned;
      existing.completed_count += 1;
    }
  });

  // Sort by total points descending
  return Array.from(statsMap.values()).sort((a, b) => b.total_points - a.total_points);
}

// Get recent completions
export async function getRecentCompletions(limit: number = 10): Promise<ChoreCompletion[]> {
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

  const { data: completions } = await supabase
    .from("chore_completions")
    .select(
      `
      *,
      user:users (
        full_name,
        email
      ),
      chore:chores (
        name
      )
    `
    )
    .eq("household_id", membership.household_id)
    .order("completed_at", { ascending: false })
    .limit(limit);

  return (completions as ChoreCompletion[]) || [];
}
