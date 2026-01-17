"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Zap,
  Wifi,
  Shield,
  CreditCard,
  Home,
  Building,
  FileText,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { createBill, updateBill, type Bill } from "@/app/actions/bills";
import { BILL_CATEGORIES } from "@/lib/constants";

const iconMap: Record<string, React.ElementType> = {
  Zap,
  Wifi,
  Shield,
  CreditCard,
  Home,
  Building,
  FileText,
};

interface BillFormProps {
  isOpen: boolean;
  onClose: () => void;
  bill?: Bill | null;
}

export default function BillForm({ isOpen, onClose, bill }: BillFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState(1);
  const [reminderDays, setReminderDays] = useState(3);
  const [category, setCategory] = useState<string | null>(null);

  const isEditing = !!bill;

  // Reset form when modal opens or bill changes
  useEffect(() => {
    if (isOpen) {
      if (bill) {
        setName(bill.name);
        setAmount(bill.amount?.toString() || "");
        setDueDay(bill.due_day);
        setReminderDays(bill.reminder_days_before);
        setCategory(bill.category);
      } else {
        setName("");
        setAmount("");
        setDueDay(1);
        setReminderDays(3);
        setCategory(null);
      }
      setError(null);
    }
  }, [isOpen, bill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Inserisci un nome per la scadenza");
      return;
    }

    setIsLoading(true);
    setError(null);

    const data = {
      name: name.trim(),
      amount: amount ? parseFloat(amount) : undefined,
      due_day: dueDay,
      reminder_days_before: reminderDays,
      category: category || undefined,
    };

    const result = isEditing
      ? await updateBill(bill.id, data)
      : await createBill(data);

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
      title={isEditing ? "Modifica scadenza" : "Nuova scadenza"}
      description={
        isEditing
          ? "Modifica i dettagli della scadenza"
          : "Aggiungi una nuova bolletta o scadenza ricorrente"
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="es. Bolletta luce, Affitto..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria <span className="text-gray-400">(opzionale)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BILL_CATEGORIES.map((cat) => {
              const Icon = iconMap[cat.icon] || FileText;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(category === cat.value ? null : cat.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    category === cat.value
                      ? "border-2"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{
                    borderColor: category === cat.value ? cat.color : undefined,
                    backgroundColor: category === cat.value ? `${cat.color}10` : undefined,
                  }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: category === cat.value ? cat.color : "#6b7280" }}
                  />
                  <span style={{ color: category === cat.value ? cat.color : undefined }}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Importo <span className="text-gray-400">(opzionale)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Due day */}
        <div>
          <label htmlFor="dueDay" className="block text-sm font-medium text-gray-700 mb-1">
            Giorno di scadenza
          </label>
          <select
            id="dueDay"
            value={dueDay}
            onChange={(e) => setDueDay(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Giorno del mese in cui scade la bolletta
          </p>
        </div>

        {/* Reminder days */}
        <div>
          <label htmlFor="reminderDays" className="block text-sm font-medium text-gray-700 mb-1">
            Promemoria
          </label>
          <select
            id="reminderDays"
            value={reminderDays}
            onChange={(e) => setReminderDays(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value={1}>1 giorno prima</option>
            <option value={2}>2 giorni prima</option>
            <option value={3}>3 giorni prima</option>
            <option value={5}>5 giorni prima</option>
            <option value={7}>1 settimana prima</option>
          </select>
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
