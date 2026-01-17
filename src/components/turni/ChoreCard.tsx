"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Loader2,
  Star,
  User,
  RotateCcw,
} from "lucide-react";
import { completeChore, deleteChore, type Chore } from "@/app/actions/chores";
import { ConfirmModal } from "@/components/ui/modal";
import { getFrequencyLabel, formatDate } from "@/lib/constants";

interface ChoreCardProps {
  chore: Chore;
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (chore: Chore) => void;
}

type ChoreStatus = "overdue" | "today" | "upcoming" | "completed";

function getChoreStatus(chore: Chore): ChoreStatus {
  if (!chore.is_active) return "completed";
  if (!chore.next_due) return "upcoming";

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const dueDate = new Date(chore.next_due);

  if (dueDate < todayStart) return "overdue";
  if (dueDate < todayEnd) return "today";
  return "upcoming";
}

const statusConfig = {
  overdue: {
    bg: "bg-red-50 border-red-200",
    icon: AlertTriangle,
    iconColor: "text-red-500",
    label: "In ritardo",
    labelColor: "text-red-600 bg-red-100",
  },
  today: {
    bg: "bg-amber-50 border-amber-200",
    icon: Clock,
    iconColor: "text-amber-500",
    label: "Oggi",
    labelColor: "text-amber-600 bg-amber-100",
  },
  upcoming: {
    bg: "bg-white border-gray-200",
    icon: Clock,
    iconColor: "text-gray-400",
    label: "Prossimo",
    labelColor: "text-gray-600 bg-gray-100",
  },
  completed: {
    bg: "bg-green-50 border-green-200",
    icon: CheckCircle2,
    iconColor: "text-green-500",
    label: "Completato",
    labelColor: "text-green-600 bg-green-100",
  },
};

export default function ChoreCard({ chore, currentUserId, isAdmin, onEdit }: ChoreCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [completedPoints, setCompletedPoints] = useState<number | null>(null);
  const router = useRouter();

  const status = getChoreStatus(chore);
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const isMyTurn = chore.current_assignee === currentUserId;
  const canComplete = isMyTurn && chore.is_active;

  const handleComplete = async () => {
    if (!canComplete) return;

    setIsCompleting(true);
    const result = await completeChore(chore.id);

    if (result.success) {
      setCompletedPoints(result.points_earned || chore.points);
      setTimeout(() => {
        setCompletedPoints(null);
        router.refresh();
      }, 1500);
    } else {
      alert(result.error || "Errore nel completamento");
    }
    setIsCompleting(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteChore(chore.id);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Errore nell'eliminazione");
    }
    setIsDeleting(false);
    setShowDeleteModal(false);
  };

  const assigneeName =
    chore.assignee?.full_name ||
    chore.assignee?.email?.split("@")[0] ||
    "Non assegnato";

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`relative rounded-xl border p-4 transition-all ${config.bg}`}
      >
        {/* Points animation on completion */}
        {completedPoints !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 0.8], y: -40 }}
            transition={{ duration: 1.5 }}
            className="absolute -top-4 right-4 flex items-center gap-1 text-amber-500 font-bold text-lg"
          >
            <Star className="w-5 h-5 fill-current" />+{completedPoints}
          </motion.div>
        )}

        <div className="flex items-start justify-between gap-4">
          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon className={`w-5 h-5 ${config.iconColor}`} />
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.labelColor}`}
              >
                {config.label}
              </span>
              <span className="text-xs text-gray-500">
                {getFrequencyLabel(chore.frequency)}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 truncate">{chore.name}</h3>

            <div className="flex items-center gap-4 mt-2 text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <User className="w-4 h-4" />
                <span className={isMyTurn ? "font-medium text-primary-600" : ""}>
                  {isMyTurn ? "Tocca a te!" : assigneeName}
                </span>
              </div>

              {chore.next_due && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(chore.next_due)}</span>
                </div>
              )}
            </div>

            {/* Points and rotation info */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-amber-600">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">{chore.points} pt</span>
              </div>

              {chore.rotation_order && chore.rotation_order.length > 1 && (
                <div className="flex items-center gap-1 text-gray-500">
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-xs">{chore.rotation_order.length} in rotazione</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2">
            {/* Complete button */}
            {canComplete && (
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isCompleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">Fatto</span>
              </button>
            )}

            {/* Admin actions */}
            {isAdmin && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(chore)}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Modifica"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Elimina"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Elimina turno"
        description={`Sei sicuro di voler eliminare "${chore.name}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
