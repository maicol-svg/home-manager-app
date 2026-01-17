"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Trash2,
  Package,
  FileText,
  Wine,
  Leaf,
  Cylinder,
  Box,
  Edit,
  Trash,
  Clock,
  Loader2,
} from "lucide-react";
import { deleteWasteSchedule, toggleWasteSchedule, type WasteSchedule } from "@/app/actions/waste";
import { ConfirmModal } from "@/components/ui/modal";
import { Toggle } from "@/components/ui/toggle";
import { getDayLabel, formatTime, WASTE_TYPES } from "@/lib/constants";

const iconMap: Record<string, React.ElementType> = {
  Trash2,
  Package,
  FileText,
  Wine,
  Leaf,
  Cylinder,
  Box,
};

interface WasteCardProps {
  schedule: WasteSchedule;
  isAdmin: boolean;
  onEdit: (schedule: WasteSchedule) => void;
}

export default function WasteCard({ schedule, isAdmin, onEdit }: WasteCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

  const wasteType = WASTE_TYPES.find((w) => w.value === schedule.waste_type);
  const Icon = iconMap[wasteType?.icon || "Trash2"] || Trash2;
  const color = wasteType?.color || "#6b7280";
  const label = wasteType?.label || schedule.waste_type;

  const handleToggle = async () => {
    setIsToggling(true);
    const result = await toggleWasteSchedule(schedule.id);
    if (!result.success) {
      alert(result.error || "Errore");
    }
    router.refresh();
    setIsToggling(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteWasteSchedule(schedule.id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Errore");
    }
    setIsDeleting(false);
    setShowDeleteModal(false);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-white rounded-xl border p-4 transition-all ${
          schedule.is_active ? "border-gray-200" : "border-gray-100 opacity-60"
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{label}</h3>
              {!schedule.is_active && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  Disattivato
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-1">{getDayLabel(schedule.day_of_week)}</p>

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Promemoria: {formatTime(schedule.reminder_time)}</span>
              </div>
              {schedule.deadline_time && (
                <div className="flex items-center gap-1">
                  <span>Scadenza: {formatTime(schedule.deadline_time)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Toggle
                checked={schedule.is_active}
                onChange={handleToggle}
                disabled={isToggling}
                size="sm"
              />
              <button
                onClick={() => onEdit(schedule)}
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
                <Trash className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Elimina raccolta"
        description={`Sei sicuro di voler eliminare la raccolta "${label}" del ${getDayLabel(
          schedule.day_of_week
        )}?`}
        confirmText="Elimina"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
