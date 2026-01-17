"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteAccount } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";

export default function DeleteAccountSection() {
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirmText !== "ELIMINA") {
      setError("Digita ELIMINA per confermare");
      return;
    }

    setIsDeleting(true);
    setError(null);

    const result = await deleteAccount();

    if (result.success) {
      // Sign out and redirect
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } else {
      setError(result.error || "Errore nell'eliminazione dell'account");
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setConfirmText("");
    setError(null);
  };

  return (
    <>
      <div className="bg-red-50 rounded-xl border border-red-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-red-800 mb-2">Elimina account</h2>
            <p className="text-sm text-red-600 mb-4">
              L&apos;eliminazione del tuo account è permanente e irreversibile.
              Tutti i tuoi dati personali, le spese registrate e i turni completati
              verranno eliminati definitivamente.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
            >
              Elimina il mio account
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title="Conferma eliminazione account"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">
                Questa azione è irreversibile
              </p>
              <p className="text-sm text-red-600 mt-1">
                Una volta eliminato, non sarà possibile recuperare il tuo account
                o i tuoi dati.
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-700 mb-2">
              Per confermare, digita <strong>ELIMINA</strong> nel campo sottostante:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="ELIMINA"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== "ELIMINA"}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Elimina definitivamente
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
