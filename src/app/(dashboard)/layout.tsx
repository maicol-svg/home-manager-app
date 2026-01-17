import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LayoutClient } from "./LayoutClient";
import { joinHousehold } from "@/app/actions/household";

interface Membership {
  household_id: string;
  role: string;
}

interface Household {
  id: string;
  name: string;
  invite_code: string;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's household membership
  let { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .single();

  let membership = membershipData as Membership | null;

  // If user has no membership, check if they have an invite code from registration
  if (!membership) {
    const inviteCode = user.user_metadata?.invite_code;

    if (inviteCode) {
      // Try to join with the invite code
      const result = await joinHousehold(inviteCode);

      if (result.success) {
        // Clear the invite code from user metadata to prevent repeated attempts
        await supabase.auth.updateUser({
          data: { invite_code: null },
        });

        // Re-fetch membership after successful join
        const { data: newMembershipData } = await supabase
          .from("household_members")
          .select("household_id, role")
          .eq("user_id", user.id)
          .single();

        membership = newMembershipData as Membership | null;
      } else {
        // Invalid invite code - clear it and redirect to onboarding
        await supabase.auth.updateUser({
          data: { invite_code: null },
        });
        redirect("/onboarding");
      }
    } else {
      // No invite code, redirect to onboarding
      redirect("/onboarding");
    }
  }

  // At this point, membership should exist
  if (!membership) {
    redirect("/onboarding");
  }

  // Get household details
  const { data: householdData } = await supabase
    .from("households")
    .select("id, name, invite_code")
    .eq("id", membership.household_id)
    .single();

  const household = householdData as Household | null;

  if (!household) {
    redirect("/onboarding");
  }

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Utente";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <LayoutClient
      user={{
        email: user.email || "",
        displayName,
        initials,
      }}
      household={{
        name: household.name,
        inviteCode: household.invite_code,
      }}
    >
      {children}
    </LayoutClient>
  );
}
