"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Package, FileText, Wine, Leaf, Cylinder, Box } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { createWasteSchedule, updateWasteSchedule, type WasteSchedule } from "@/app/actions/waste";
import { DAYS_OF_WEEK, WASTE_TYPES } from "@/lib/constants";

const iconMap: Record<string, React.ElementType> = {
  Trash2,
  Package,
  FileText,
  Wine,
  Leaf,
  Cylinder,
  Box,
};

interface WasteFormProps {
  isOpen: boolean;
  onClose: () => void;
  schedule?: WasteSchedule | null;
}

export default function WasteForm({ isOpen, onClose, schedule }: WasteFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form state
  const [wasteType, setWasteType] = useState("indifferenziato");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [deadlineTime, setDeadlineTime] = useState("");

  const isEditing = !!schedule;

  // Reset form when modal opens or schedule changes
  useEffect(() => {
    if (isOpen) {
      if (schedule) {
        setWasteType(schedule.waste_type);
        setDayOfWeek(schedule.day_of_week);
        setReminderTime(schedule.reminder_time.slice(0, 5));
        setDeadlineTime(schedule.deadline_time?.slice(0, 5) || "");
      } else {
        setWasteType("indifferenziato");
        setDayOfWeek(1);
        setReminderTime("20:00");
        setDeadlineTime("");
      }
      setError(null);
    }
  }, [isOpen, schedule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    const data = {
      waste_type: wasteType,
      day_of_week: dayOfWeek,
      reminder_time: `${reminderTime}:00`,
      deadline_time: deadlineTime ? `${deadlineTime}:00` : undefined,
    };

    const result = isEditing
      ? await updateWasteSchedule(schedule.id, data)
      : await createWasteSchedule(data);

    if (result.success) {
      router.refresh();
      onClose();
    } else {
      setError(result.error || "Errore nel salvataggio");
    }
    setIsLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Modifica raccolta" : "Nuova raccolta"}
      description={isEditing ? "Modifica il calendario di raccolta" : "Aggiungi un nuovo giorno di raccolta"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Waste type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo di rifiuto
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {WASTE_TYPES.map((type) => {
              const Icon = iconMap[type.icon] || Trash2;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setWasteType(type.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    wasteType === type.value
                      ? "border-2"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{
                    borderColor: wasteType === type.value ? type.color : undefined,
                    backgroundColor: wasteType === type.value ? `${type.color}10` : undefined,
                  }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: wasteType === type.value ? type.color : "#6b7280" }}
                  />
                  <span
                    style={{ color: wasteType === type.value ? type.color : undefined }}
                  >
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day of week */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giorno di raccolta
          </label>
          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => setDayOfWeek(day.value)}
                className={`px-2 py-3 rounded-lg text-xs font-medium transition-all ${
                  dayOfWeek === day.value
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="reminderTime" className="block text-sm font-medium text-gray-700 mb-1">
              Orario promemoria
            </label>
            <input
              type="time"
              id="reminderTime"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Sera prima della raccolta</p>
          </div>

          <div>
            <label htmlFor="deadlineTime" className="block text-sm font-medium text-gray-700 mb-1">
              Orario scadenza <span className="text-gray-400">(opzionale)</span>
            </label>
            <input
              type="time"
              id="deadlineTime"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Quando passano a ritirare</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? "Salva modifiche" : "Aggiungi"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
