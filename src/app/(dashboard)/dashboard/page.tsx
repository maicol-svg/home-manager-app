import { createClient } from "@/lib/supabase/server";
import { getDashboardSummary, type DashboardSummary } from "@/app/actions/dashboard";
import { getProfile } from "@/app/actions/profile";
import DashboardContent from "./DashboardContent";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Accedi per visualizzare la dashboard</p>
      </div>
    );
  }

  const [summary, profile] = await Promise.all([getDashboardSummary(), getProfile()]);

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Utente";

  return <DashboardContent summary={summary} userName={displayName} />;
}
