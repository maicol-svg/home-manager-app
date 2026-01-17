import { Plus, Users, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getChores, getChoreStats } from "@/app/actions/chores";
import { getHouseholdMembers } from "@/app/actions/household";
import ChoreList from "@/components/turni/ChoreList";
import ChoreStats from "@/components/turni/ChoreStats";
import ChoreFormWrapper from "./ChoreFormWrapper";
import { Button } from "@/components/ui/button";

export default async function TurniPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <p className="text-gray-500">Accedi per visualizzare i turni</p>
      </div>
    );
  }

  // Get user role
  const { data: membership } = await supabase
    .from("household_members")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const isAdmin = (membership as { role: string } | null)?.role === "admin";

  // Get data in parallel
  const [chores, members, stats] = await Promise.all([
    getChores(),
    getHouseholdMembers(),
    getChoreStats({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    }),
  ]);

  // Transform members for the form
  const membersList = members.map((m) => ({
    user_id: m.user_id,
    user: m.user,
  }));

  const hasChores = chores.length > 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Turni Domestici</h1>
          <p className="text-gray-500 mt-1">
            Gestisci i turni e guadagna punti completandoli
          </p>
        </div>
        {isAdmin ? (
          <ChoreFormWrapper members={membersList}>
            <Button>
              <Plus className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Nuovo turno</span>
            </Button>
          </ChoreFormWrapper>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">Solo admin</span>
          </div>
        )}
      </div>

      {hasChores ? (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content - Chore list */}
          <div className="lg:col-span-2">
            <ChoreList
              chores={chores}
              currentUserId={user.id}
              isAdmin={isAdmin}
              members={membersList}
            />
          </div>

          {/* Sidebar - Stats */}
          <div className="lg:col-span-1">
            <ChoreStats stats={stats} currentUserId={user.id} />
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessun turno configurato
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Crea turni a rotazione per le faccende domestiche. Ogni membro guadagnerà punti
            completando i turni assegnati.
          </p>
          {isAdmin ? (
            <ChoreFormWrapper members={membersList}>
              <Button>
                <Plus className="w-5 h-5 mr-2" />
                Crea il primo turno
              </Button>
            </ChoreFormWrapper>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg">
              <Info className="w-4 h-4" />
              Solo gli admin possono creare turni
            </div>
          )}
        </div>
      )}
    </div>
  );
}
