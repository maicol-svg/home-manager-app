import { Plus, FileText, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBills } from "@/app/actions/bills";
import BillList from "@/components/bollette/BillList";
import BillFormWrapper from "./BillFormWrapper";
import { Button } from "@/components/ui/button";

export default async function BollettePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <p className="text-gray-500">Accedi per visualizzare le scadenze</p>
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

  // Get bills
  const bills = await getBills();
  const hasBills = bills.length > 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bollette e Scadenze</h1>
          <p className="text-gray-500 mt-1">Gestisci le scadenze ricorrenti</p>
        </div>
        {isAdmin ? (
          <BillFormWrapper>
            <Button>
              <Plus className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Nuova scadenza</span>
            </Button>
          </BillFormWrapper>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">Solo admin</span>
          </div>
        )}
      </div>

      {hasBills ? (
        <BillList bills={bills} isAdmin={isAdmin} />
      ) : (
        /* Empty state */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessuna scadenza configurata
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Aggiungi le tue bollette e scadenze ricorrenti per ricevere promemoria
            automatici prima della scadenza.
          </p>
          {isAdmin ? (
            <BillFormWrapper>
              <Button>
                <Plus className="w-5 h-5 mr-2" />
                Aggiungi la prima scadenza
              </Button>
            </BillFormWrapper>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg">
              <Info className="w-4 h-4" />
              Solo gli admin possono aggiungere scadenze
            </div>
          )}
        </div>
      )}
    </div>
  );
}
