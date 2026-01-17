import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/app/actions/profile";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";

export default async function ProfiloPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-500">Accedi per modificare il profilo</p>
      </div>
    );
  }

  const profile = await getProfile();

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
        <h1 className="text-2xl font-bold text-gray-900">Profilo</h1>
        <p className="text-gray-500 mt-1">Gestisci le tue informazioni personali</p>
      </div>

      <div className="space-y-6">
        {/* Profile info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Informazioni personali</h2>
          <ProfileForm
            initialName={profile?.full_name || ""}
            email={user.email || ""}
          />
        </div>

        {/* Password */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Cambia password</h2>
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
