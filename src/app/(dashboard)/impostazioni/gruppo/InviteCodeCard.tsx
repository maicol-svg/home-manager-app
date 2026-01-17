"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, RefreshCw, Check, Loader2 } from "lucide-react";
import { regenerateInviteCode } from "@/app/actions/household";

interface InviteCodeCardProps {
  inviteCode: string;
  isAdmin: boolean;
}

export default function InviteCodeCard({ inviteCode, isAdmin }: InviteCodeCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const router = useRouter();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = inviteCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm("Rigenerare il codice? Il codice attuale non funzionerà più.")) {
      return;
    }

    setIsRegenerating(true);
    const result = await regenerateInviteCode();
    if (!result.success) {
      alert(result.error || "Errore");
    }
    router.refresh();
    setIsRegenerating(false);
  };

  return (
    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
      <h2 className="font-semibold mb-2">Codice invito</h2>
      <p className="text-primary-100 text-sm mb-4">
        Condividi questo codice per invitare nuovi membri
      </p>

      <div className="flex items-center gap-3">
        <code className="flex-1 px-4 py-3 bg-white/10 backdrop-blur rounded-lg font-mono text-xl text-center tracking-widest">
          {inviteCode}
        </code>

        <button
          onClick={handleCopy}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          title="Copia codice"
        >
          {isCopied ? (
            <Check className="w-5 h-5" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
        </button>

        {isAdmin && (
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            title="Rigenera codice"
          >
            {isRegenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {isCopied && (
        <p className="text-sm text-primary-100 mt-2">Codice copiato!</p>
      )}
    </div>
  );
}
