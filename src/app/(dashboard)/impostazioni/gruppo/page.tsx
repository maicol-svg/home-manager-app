import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdMembers, getUserHousehold, regenerateInviteCode } from "@/app/actions/household";
import MembersList from "./MembersList";
import InviteCodeCard from "./InviteCodeCard";
import SwitchHouseholdCard from "./SwitchHouseholdCard";

export default async function GruppoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-500">Accedi per visualizzare il gruppo</p>
      </div>
    );
  }

  const [household, members] = await Promise.all([getUserHousehold(), getHouseholdMembers()]);

  // Get user's membership
  const { data: membership } = await supabase
    .from("household_members")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const isAdmin = (membership as { role: string } | null)?.role === "admin";

  if (!household) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href="/impostazioni"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Impostazioni
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna casa</h3>
          <p className="text-gray-500">Non sei ancora membro di nessun gruppo casa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/impostazioni"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Impostazioni
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{household.name}</h1>
        <p className="text-gray-500 mt-1">Gestisci i membri del tuo gruppo casa</p>
      </div>

      <div className="space-y-6">
        {/* Invite code */}
        <InviteCodeCard inviteCode={household.invite_code} isAdmin={isAdmin} />

        {/* Members list */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Membri ({members.length})
            </h2>
          </div>
          <MembersList members={members} currentUserId={user.id} isAdmin={isAdmin} />
        </div>

        {/* Switch household */}
        <SwitchHouseholdCard />
      </div>
    </div>
  );
}
