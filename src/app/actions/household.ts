"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type HouseholdMembershipSimple = {
  household_id: string;
};

type HouseholdMemberRole = {
  role: string;
};

export type Household = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  monthly_budget: number | null;
};

export type HouseholdMember = {
  household_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
};

// Ottiene l'household dell'utente corrente
export async function getUserHousehold(): Promise<Household | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Cerca membership dell'utente
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembershipSimple | null;
  if (!membership) return null;

  // Ottiene i dettagli dell'household
  const { data: household } = await supabase
    .from("households")
    .select("*")
    .eq("id", membership.household_id)
    .single();

  return household as Household | null;
}

// Crea un nuovo household e aggiunge l'utente come admin
export async function createHousehold(name: string): Promise<{ success: boolean; error?: string; household?: Household }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Usa la funzione database che bypassa RLS
  const { data, error } = await supabase.rpc("create_household_with_admin" as never, {
    household_name: name.trim(),
  } as never);

  if (error) {
    return { success: false, error: error.message };
  }

  // La funzione restituisce un JSON
  const result = data as { success: boolean; error?: string; household?: Household };

  if (!result.success) {
    return { success: false, error: result.error || "Errore nella creazione della casa" };
  }

  revalidatePath("/");
  return { success: true, household: result.household };
}

// Unisciti a un household esistente tramite codice invito
export async function joinHousehold(inviteCode: string): Promise<{ success: boolean; error?: string; household?: Household }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Usa la funzione database che bypassa RLS
  const { data, error } = await supabase.rpc("join_household_with_code" as never, {
    invite_code_param: inviteCode,
  } as never);

  if (error) {
    return { success: false, error: error.message };
  }

  // La funzione restituisce un JSON
  const result = data as { success: boolean; error?: string; household?: Household };

  if (!result.success) {
    return { success: false, error: result.error || "Codice invito non valido" };
  }

  revalidatePath("/");
  return { success: true, household: result.household };
}

// Ottiene i membri dell'household
export async function getHouseholdMembers(): Promise<Array<{
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  user: { full_name: string | null; email: string };
}>> {
  const supabase = await createClient();

  const household = await getUserHousehold();
  if (!household) return [];

  const { data: membersData } = await supabase
    .from("household_members")
    .select(`
      user_id,
      role,
      joined_at,
      user:users(full_name, email)
    `)
    .eq("household_id", household.id);

  type MemberRow = {
    user_id: string;
    role: string;
    joined_at: string;
    user: { full_name: string | null; email: string } | null;
  };
  const members = (membersData as MemberRow[] | null) || [];
  return members.map((m) => ({
    user_id: m.user_id,
    role: m.role as "admin" | "member",
    joined_at: m.joined_at,
    user: Array.isArray(m.user) ? m.user[0] : (m.user || { full_name: null, email: "" }),
  }));
}

// Rigenera il codice invito (solo admin)
export async function regenerateInviteCode(): Promise<{ success: boolean; error?: string; newCode?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  const household = await getUserHousehold();
  if (!household) {
    return { success: false, error: "Non sei membro di nessuna casa" };
  }

  // Verifica che l'utente sia admin
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("role")
    .eq("household_id", household.id)
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMemberRole | null;
  if (membership?.role !== "admin") {
    return { success: false, error: "Solo gli admin possono rigenerare il codice" };
  }

  // Genera nuovo codice
  const newCode = generateInviteCode();

  const { error } = await supabase
    .from("households")
    .update({ invite_code: newCode } as never)
    .eq("id", household.id);

  if (error) {
    return { success: false, error: "Errore nella rigenerazione del codice" };
  }

  revalidatePath("/");
  return { success: true, newCode };
}

// Helper: genera codice invito casuale
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Aggiorna il budget mensile dell'household (solo admin)
export async function updateHouseholdBudget(
  budget: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  const household = await getUserHousehold();
  if (!household) {
    return { success: false, error: "Non sei membro di nessuna casa" };
  }

  // Verifica che l'utente sia admin
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("role")
    .eq("household_id", household.id)
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMemberRole | null;
  if (membership?.role !== "admin") {
    return { success: false, error: "Solo gli admin possono modificare il budget" };
  }

  // Validazione
  if (budget < 0) {
    return { success: false, error: "Il budget non può essere negativo" };
  }

  const { error } = await supabase
    .from("households")
    .update({ monthly_budget: budget } as never)
    .eq("id", household.id);

  if (error) {
    return { success: false, error: "Errore nell'aggiornamento del budget" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/impostazioni");
  return { success: true };
}

// Switch to a different household (leave current, join new)
// User's expenses stay in the old household
export async function switchHousehold(inviteCode: string): Promise<{
  success: boolean;
  error?: string;
  household?: Household;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Get current membership
  const { data: currentMembershipData } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .single();

  const currentMembership = currentMembershipData as { household_id: string; role: string } | null;

  // Find the new household by invite code
  const { data: newHouseholdData } = await supabase
    .from("households")
    .select("*")
    .eq("invite_code", inviteCode.toUpperCase())
    .single();

  const newHousehold = newHouseholdData as Household | null;

  if (!newHousehold) {
    return { success: false, error: "Codice invito non valido" };
  }

  // Check if user is already in this household
  if (currentMembership?.household_id === newHousehold.id) {
    return { success: false, error: "Sei già membro di questa casa" };
  }

  // If user is the only admin in current household, check if there are other members
  if (currentMembership?.role === "admin") {
    const { data: otherAdmins } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", currentMembership.household_id)
      .eq("role", "admin")
      .neq("user_id", user.id);

    if (!otherAdmins || otherAdmins.length === 0) {
      const { data: otherMembers } = await supabase
        .from("household_members")
        .select("user_id")
        .eq("household_id", currentMembership.household_id)
        .neq("user_id", user.id);

      if (otherMembers && otherMembers.length > 0) {
        return {
          success: false,
          error: "Sei l'unico admin. Promuovi un altro membro prima di cambiare casa.",
        };
      }
    }
  }

  // Remove from current household
  if (currentMembership) {
    const { error: leaveError } = await supabase
      .from("household_members")
      .delete()
      .eq("user_id", user.id)
      .eq("household_id", currentMembership.household_id);

    if (leaveError) {
      return { success: false, error: "Errore nell'abbandono della casa attuale" };
    }
  }

  // Join new household
  const { error: joinError } = await supabase.from("household_members").insert({
    user_id: user.id,
    household_id: newHousehold.id,
    role: "member",
  } as never);

  if (joinError) {
    return { success: false, error: "Errore nell'unione alla nuova casa" };
  }

  revalidatePath("/");
  return { success: true, household: newHousehold };
}
