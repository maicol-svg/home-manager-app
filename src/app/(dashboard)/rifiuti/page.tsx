import { Plus, Trash2, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWasteSchedules } from "@/app/actions/waste";
import WasteCalendar from "@/components/rifiuti/WasteCalendar";
import WasteList from "./WasteList";
import WasteFormWrapper from "./WasteFormWrapper";
import { Button } from "@/components/ui/button";

export default async function RifiutiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <p className="text-gray-500">Accedi per visualizzare il calendario rifiuti</p>
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

  // Get schedules
  const schedules = await getWasteSchedules();
  const hasSchedules = schedules.length > 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raccolta Rifiuti</h1>
          <p className="text-gray-500 mt-1">Calendario della raccolta differenziata</p>
        </div>
        {isAdmin ? (
          <WasteFormWrapper>
            <Button>
              <Plus className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Aggiungi</span>
            </Button>
          </WasteFormWrapper>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">Solo admin</span>
          </div>
        )}
      </div>

      {hasSchedules ? (
        <div className="space-y-8">
          {/* Calendar view */}
          <WasteCalendar schedules={schedules} />

          {/* List view */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dettaglio raccolte</h2>
            <WasteList schedules={schedules} isAdmin={isAdmin} />
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Trash2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Calendario non configurato
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Configura i giorni e gli orari della raccolta differenziata per ricevere
            promemoria automatici.
          </p>
          {isAdmin ? (
            <WasteFormWrapper>
              <Button>
                <Plus className="w-5 h-5 mr-2" />
                Configura il calendario
              </Button>
            </WasteFormWrapper>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg">
              <Info className="w-4 h-4" />
              Solo gli admin possono configurare il calendario
            </div>
          )}
        </div>
      )}
    </div>
  );
}
