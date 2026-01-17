import { createClient } from "@/lib/supabase/server";
import { User, Users, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getProfile } from "@/app/actions/profile";
import { getHouseholdMembers, getUserHousehold } from "@/app/actions/household";
import LogoutButton from "./LogoutButton";
import { CopyCodeButton, BudgetForm } from "./SettingsActions";

export default async function ImpostazioniPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-500">Accedi per visualizzare le impostazioni</p>
      </div>
    );
  }

  const [profile, household, members] = await Promise.all([
    getProfile(),
    getUserHousehold(),
    getHouseholdMembers(),
  ]);

  // Get user's membership
  const { data: membership } = await supabase
    .from("household_members")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Utente";
  const isAdmin = (membership as { role: string } | null)?.role === "admin";
  const memberCount = members.length;

  const sections = [
    {
      title: "Profilo",
      description: "Modifica nome, email e password",
      icon: User,
      href: "/impostazioni/profilo",
    },
    {
      title: "Gruppo Casa",
      description: `${memberCount} ${memberCount === 1 ? "membro" : "membri"} - ${
        isAdmin ? "Gestisci membri" : "Visualizza membri"
      }`,
      icon: Users,
      href: "/impostazioni/gruppo",
    },
    {
      title: "Privacy & Account",
      description: "Esporta dati, privacy policy, elimina account",
      icon: Shield,
      href: "/impostazioni/privacy",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Impostazioni</h1>
        <p className="text-muted-foreground mt-1">Gestisci il tuo account e le preferenze</p>
      </div>

      {/* User Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-700">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{displayName}</h2>
              <p className="text-gray-500">{user.email}</p>
              {household && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-primary-600">{household.name}</span>
                  {isAdmin && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>

      {/* Budget Form */}
      {household && (
        <div className="mb-6">
          <BudgetForm
            currentBudget={household.monthly_budget}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-primary-200 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-50 rounded-lg">
                <section.icon className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{section.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Household info */}
      {household && (
        <div className="mt-6 bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Codice invito casa</h3>
          <p className="text-sm text-gray-500 mb-3">
            Condividi questo codice per invitare nuovi membri
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 px-4 py-2 bg-white rounded-lg border border-gray-200 font-mono text-lg text-center tracking-widest">
              {household.invite_code}
            </code>
            <CopyCodeButton code={household.invite_code} />
          </div>
        </div>
      )}
    </div>
  );
}
