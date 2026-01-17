"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, GripVertical, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { createChore, updateChore, type Chore } from "@/app/actions/chores";
import { FREQUENCIES, CHORE_POINTS } from "@/lib/constants";

interface Member {
  user_id: string;
  user: { full_name: string | null; email: string };
}

interface ChoreFormProps {
  isOpen: boolean;
  onClose: () => void;
  chore?: Chore | null;
  members: Member[];
}

export default function ChoreForm({ isOpen, onClose, chore, members }: ChoreFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [points, setPoints] = useState(3);
  const [rotationOrder, setRotationOrder] = useState<string[]>([]);

  const isEditing = !!chore;

  // Reset form when modal opens or chore changes
  useEffect(() => {
    if (isOpen) {
      if (chore) {
        setName(chore.name);
        setFrequency(chore.frequency);
        setPoints(chore.points);
        setRotationOrder(chore.rotation_order || []);
      } else {
        setName("");
        setFrequency("weekly");
        setPoints(3);
        setRotationOrder([]);
      }
      setError(null);
    }
  }, [isOpen, chore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Inserisci un nome per il turno");
      return;
    }

    setIsLoading(true);
    setError(null);

    const data = {
      name: name.trim(),
      frequency,
      points,
      rotation_order: rotationOrder,
    };

    const result = isEditing
      ? await updateChore(chore.id, data)
      : await createChore(data);

    if (result.success) {
      router.refresh();
      onClose();
    } else {
      setError(result.error || "Errore nel salvataggio");
    }
    setIsLoading(false);
  };

  const toggleMemberInRotation = (userId: string) => {
    setRotationOrder((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const moveMemberUp = (index: number) => {
    if (index === 0) return;
    setRotationOrder((prev) => {
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      return newOrder;
    });
  };

  const moveMemberDown = (index: number) => {
    if (index === rotationOrder.length - 1) return;
    setRotationOrder((prev) => {
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      return newOrder;
    });
  };

  const getMemberName = (userId: string) => {
    const member = members.find((m) => m.user_id === userId);
    return member?.user.full_name || member?.user.email?.split("@")[0] || "Utente";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Modifica turno" : "Nuovo turno"}
      description={isEditing ? "Modifica i dettagli del turno" : "Crea un nuovo turno a rotazione"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome del turno *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="es. Lavare i piatti, Pulire bagno..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            autoFocus
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Frequenza</label>
          <div className="grid grid-cols-3 gap-3">
            {FREQUENCIES.map((freq) => (
              <button
                key={freq.value}
                type="button"
                onClick={() => setFrequency(freq.value as "daily" | "weekly" | "monthly")}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  frequency === freq.value
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                {freq.label}
              </button>
            ))}
          </div>
        </div>

        {/* Points */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Punti <span className="text-gray-400 font-normal">(difficoltà)</span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {CHORE_POINTS.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() => setPoints(pt.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  points === pt.value
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
                title={pt.description}
              >
                {pt.value}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {CHORE_POINTS.find((p) => p.value === points)?.description}
          </p>
        </div>

        {/* Rotation members */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rotazione tra membri
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Seleziona chi partecipa al turno. Il primo della lista sarà il primo assegnatario.
          </p>

          {/* Available members */}
          <div className="space-y-2 mb-4">
            {members.map((member) => {
              const isSelected = rotationOrder.includes(member.user_id);
              const memberName =
                member.user.full_name || member.user.email?.split("@")[0] || "Utente";

              return (
                <div
                  key={member.user_id}
                  onClick={() => toggleMemberInRotation(member.user_id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isSelected ? "bg-primary-500 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {memberName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{memberName}</p>
                    <p className="text-xs text-gray-500">{member.user.email}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? "border-primary-500 bg-primary-500" : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rotation order (drag-like reordering) */}
          {rotationOrder.length > 1 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Ordine rotazione:</p>
              <div className="space-y-1">
                {rotationOrder.map((userId, index) => (
                  <div
                    key={userId}
                    className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200"
                  >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 text-sm">{getMemberName(userId)}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveMemberUp(index)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMemberDown(index)}
                        disabled={index === rotationOrder.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleMemberInRotation(userId)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            {isEditing ? "Salva modifiche" : "Crea turno"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
