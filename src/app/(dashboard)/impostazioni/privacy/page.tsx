import { ArrowLeft, Shield, Download, Trash2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ExportDataButton from "./ExportDataButton";
import DeleteAccountSection from "./DeleteAccountSection";

export default async function PrivacyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-500">Accedi per visualizzare le impostazioni privacy</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Privacy & Account</h1>
        <p className="text-gray-500 mt-1">Gestisci i tuoi dati e il tuo account</p>
      </div>

      <div className="space-y-6">
        {/* Privacy policy */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-50 rounded-lg">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 mb-2">Privacy Policy</h2>
              <p className="text-sm text-gray-500 mb-4">
                I tuoi dati sono memorizzati in modo sicuro sui server di Supabase (PostgreSQL).
                Non condividiamo i tuoi dati con terze parti. I dati delle spese e dei turni
                sono visibili solo ai membri del tuo gruppo casa.
              </p>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Dati raccolti:</strong> Email, nome, spese, turni completati,
                  calendari configurati.
                </p>
                <p>
                  <strong>Utilizzo:</strong> I dati sono utilizzati esclusivamente per
                  fornire le funzionalità dell&apos;app.
                </p>
                <p>
                  <strong>Conservazione:</strong> I dati vengono conservati fino alla
                  cancellazione dell&apos;account.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Export data (GDPR) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Download className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 mb-2">Esporta i tuoi dati</h2>
              <p className="text-sm text-gray-500 mb-4">
                Scarica una copia di tutti i tuoi dati in formato JSON (GDPR Art. 20).
                Include profilo, spese, turni completati e informazioni del gruppo.
              </p>
              <ExportDataButton />
            </div>
          </div>
        </div>

        {/* Delete account */}
        <DeleteAccountSection />
      </div>
    </div>
  );
}
