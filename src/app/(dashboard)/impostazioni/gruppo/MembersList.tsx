"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, UserMinus, Shield, Loader2 } from "lucide-react";
import { removeMember, promoteMember, leaveHousehold } from "@/app/actions/profile";
import { ConfirmModal } from "@/components/ui/modal";

interface Member {
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  user: { full_name: string | null; email: string };
}

interface MembersListProps {
  members: Member[];
  currentUserId: string;
  isAdmin: boolean;
}

export default function MembersList({ members, currentUserId, isAdmin }: MembersListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState<string | null>(null);
  const router = useRouter();

  const handleRemove = async (userId: string) => {
    setRemovingId(userId);
    const result = await removeMember(userId);
    if (!result.success) {
      alert(result.error || "Errore");
    }
    router.refresh();
    setRemovingId(null);
    setShowRemoveModal(null);
  };

  const handlePromote = async (userId: string) => {
    setPromotingId(userId);
    const result = await promoteMember(userId);
    if (!result.success) {
      alert(result.error || "Errore");
    }
    router.refresh();
    setPromotingId(null);
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    const result = await leaveHousehold();
    if (result.success) {
      router.push("/onboarding");
    } else {
      alert(result.error || "Errore");
    }
    setIsLeaving(false);
    setShowLeaveModal(false);
  };

  const getMemberToRemove = () => {
    if (!showRemoveModal) return null;
    return members.find((m) => m.user_id === showRemoveModal);
  };

  return (
    <>
      <div className="divide-y divide-gray-100">
        {members.map((member) => {
          const isCurrentUser = member.user_id === currentUserId;
          const memberName =
            member.user.full_name || member.user.email?.split("@")[0] || "Utente";

          return (
            <div key={member.user_id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      member.role === "admin"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {member.role === "admin" ? (
                      <Crown className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">
                        {memberName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {memberName}
                        {isCurrentUser && (
                          <span className="text-xs text-gray-500 ml-1">(tu)</span>
                        )}
                      </p>
                      {member.role === "admin" && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Promote button (for admins, on non-admins) */}
                  {isAdmin && !isCurrentUser && member.role !== "admin" && (
                    <button
                      onClick={() => handlePromote(member.user_id)}
                      disabled={promotingId === member.user_id}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Promuovi ad admin"
                    >
                      {promotingId === member.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  {/* Remove button (for admins, on other members) */}
                  {isAdmin && !isCurrentUser && (
                    <button
                      onClick={() => setShowRemoveModal(member.user_id)}
                      disabled={removingId === member.user_id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Rimuovi dal gruppo"
                    >
                      {removingId === member.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserMinus className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leave group button */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={() => setShowLeaveModal(true)}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Abbandona gruppo
        </button>
      </div>

      {/* Remove member modal */}
      <ConfirmModal
        isOpen={!!showRemoveModal}
        onClose={() => setShowRemoveModal(null)}
        onConfirm={() => showRemoveModal && handleRemove(showRemoveModal)}
        title="Rimuovi membro"
        description={`Sei sicuro di voler rimuovere ${
          getMemberToRemove()?.user.full_name ||
          getMemberToRemove()?.user.email?.split("@")[0]
        } dal gruppo?`}
        confirmText="Rimuovi"
        variant="danger"
        isLoading={!!removingId}
      />

      {/* Leave group modal */}
      <ConfirmModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleLeave}
        title="Abbandona gruppo"
        description="Sei sicuro di voler abbandonare questo gruppo? Dovrai essere reinvitato per rientrare."
        confirmText="Abbandona"
        variant="danger"
        isLoading={isLeaving}
      />
    </>
  );
}
