"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type HouseholdMembershipWithRole = {
  household_id: string;
  role: string;
};

// Types
export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  telegram_user_id: string | null;
  telegram_username: string | null;
  created_at: string;
};

// Get current user profile
export async function getProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as UserProfile | null;
}

// Update user profile
export async function updateProfile(data: {
  full_name?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  const updateData: Record<string, unknown> = {};

  if (data.full_name !== undefined) {
    updateData.full_name = data.full_name.trim();
  }

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: "Nessun dato da aggiornare" };
  }

  // Update profile in users table
  const { error } = await supabase.from("users").update(updateData as never).eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Errore nell'aggiornamento del profilo" };
  }

  // Also update user metadata in auth
  if (data.full_name !== undefined) {
    await supabase.auth.updateUser({
      data: { full_name: data.full_name.trim() },
    });
  }

  revalidatePath("/impostazioni");
  revalidatePath("/impostazioni/profilo");

  return { success: true };
}

// Change password
export async function changePassword(data: {
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  if (data.newPassword.length < 6) {
    return { success: false, error: "La password deve essere di almeno 6 caratteri" };
  }

  const { error } = await supabase.auth.updateUser({
    password: data.newPassword,
  });

  if (error) {
    console.error("Error changing password:", error);
    return { success: false, error: "Errore nel cambio password" };
  }

  return { success: true };
}

// Export user data (GDPR)
export async function exportUserData(): Promise<{
  success: boolean;
  data?: {
    profile: UserProfile | null;
    expenses: unknown[];
    chores_completed: unknown[];
    household: unknown;
  };
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Get profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();

  // Get user's household
  const { data: membershipData } = await supabase
    .from("household_members")
    .select(
      `
      *,
      household:households (*)
    `
    )
    .eq("user_id", user.id)
    .single();

  type MembershipWithHousehold = {
    household: unknown;
  };
  const membership = membershipData as MembershipWithHousehold | null;

  // Get user's expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select(
      `
      *,
      category:expense_categories (name, color)
    `
    )
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  // Get user's chore completions
  const { data: chores_completed } = await supabase
    .from("chore_completions")
    .select(
      `
      *,
      chore:chores (name)
    `
    )
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  return {
    success: true,
    data: {
      profile: profile as UserProfile | null,
      expenses: expenses || [],
      chores_completed: chores_completed || [],
      household: membership?.household || null,
    },
  };
}

// Delete account
export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Check if user is the only admin of their household
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembershipWithRole | null;
  if (membership && membership.role === "admin") {
    // Check if there are other admins
    const { data: otherAdmins } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", membership.household_id)
      .eq("role", "admin")
      .neq("user_id", user.id);

    if (!otherAdmins || otherAdmins.length === 0) {
      // Check if there are other members
      const { data: otherMembers } = await supabase
        .from("household_members")
        .select("user_id")
        .eq("household_id", membership.household_id)
        .neq("user_id", user.id);

      if (otherMembers && otherMembers.length > 0) {
        return {
          success: false,
          error:
            "Sei l'unico admin della casa. Promuovi un altro membro ad admin prima di eliminare il tuo account.",
        };
      }
    }
  }

  // Remove from household_members
  if (membership) {
    await supabase.from("household_members").delete().eq("user_id", user.id);
  }

  // Delete user profile
  await supabase.from("users").delete().eq("id", user.id);

  // Note: Deleting from auth.users requires admin privileges
  // In a production app, you might want to use a Supabase Edge Function for this
  // For now, we just sign out the user and their data is orphaned in auth.users
  // The auth.users entry will still exist but the profile is deleted

  return { success: true };
}

// Remove member from household (admin only)
export async function removeMember(
  memberUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Can't remove yourself with this function
  if (memberUserId === user.id) {
    return { success: false, error: "Non puoi rimuovere te stesso. Usa 'Abbandona casa' invece." };
  }

  // Get current user's membership and role
  const { data: currentMembershipData } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .single();

  const currentMembership = currentMembershipData as HouseholdMembershipWithRole | null;
  if (!currentMembership) {
    return { success: false, error: "Non sei membro di nessuna casa" };
  }

  if (currentMembership.role !== "admin") {
    return { success: false, error: "Solo gli admin possono rimuovere membri" };
  }

  // Verify target user is in the same household
  const { data: targetMembershipData } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", memberUserId)
    .eq("household_id", currentMembership.household_id)
    .single();

  const targetMembership = targetMembershipData as HouseholdMembershipWithRole | null;
  if (!targetMembership) {
    return { success: false, error: "Membro non trovato" };
  }

  // Remove the member
  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("user_id", memberUserId)
    .eq("household_id", currentMembership.household_id);

  if (error) {
    console.error("Error removing member:", error);
    return { success: false, error: "Errore nella rimozione del membro" };
  }

  revalidatePath("/impostazioni/gruppo");

  return { success: true };
}

// Leave household (for non-admins or admins with other admins present)
export async function leaveHousehold(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Get user's membership
  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as HouseholdMembershipWithRole | null;
  if (!membership) {
    return { success: false, error: "Non sei membro di nessuna casa" };
  }

  // If admin, check if there are other admins
  if (membership.role === "admin") {
    const { data: otherAdmins } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", membership.household_id)
      .eq("role", "admin")
      .neq("user_id", user.id);

    if (!otherAdmins || otherAdmins.length === 0) {
      // Check if there are other members at all
      const { data: otherMembers } = await supabase
        .from("household_members")
        .select("user_id")
        .eq("household_id", membership.household_id)
        .neq("user_id", user.id);

      if (otherMembers && otherMembers.length > 0) {
        return {
          success: false,
          error:
            "Sei l'unico admin. Promuovi un altro membro ad admin prima di abbandonare la casa.",
        };
      }
    }
  }

  // Leave the household
  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("user_id", user.id)
    .eq("household_id", membership.household_id);

  if (error) {
    console.error("Error leaving household:", error);
    return { success: false, error: "Errore nell'abbandono della casa" };
  }

  revalidatePath("/");

  return { success: true };
}

// Promote member to admin
export async function promoteMember(
  memberUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Utente non autenticato" };
  }

  // Get current user's membership and role
  const { data: currentMembershipData } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .single();

  const currentMembership = currentMembershipData as HouseholdMembershipWithRole | null;
  if (!currentMembership) {
    return { success: false, error: "Non sei membro di nessuna casa" };
  }

  if (currentMembership.role !== "admin") {
    return { success: false, error: "Solo gli admin possono promuovere membri" };
  }

  // Verify target user is in the same household
  const { data: targetMembershipData } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", memberUserId)
    .eq("household_id", currentMembership.household_id)
    .single();

  const targetMembership = targetMembershipData as HouseholdMembershipWithRole | null;
  if (!targetMembership) {
    return { success: false, error: "Membro non trovato" };
  }

  if (targetMembership.role === "admin") {
    return { success: false, error: "Il membro è già admin" };
  }

  // Promote the member
  const { error } = await supabase
    .from("household_members")
    .update({ role: "admin" } as never)
    .eq("user_id", memberUserId)
    .eq("household_id", currentMembership.household_id);

  if (error) {
    console.error("Error promoting member:", error);
    return { success: false, error: "Errore nella promozione del membro" };
  }

  revalidatePath("/impostazioni/gruppo");

  return { success: true };
}
