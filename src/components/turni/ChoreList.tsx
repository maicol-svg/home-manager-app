"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Filter, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import ChoreCard from "./ChoreCard";
import ChoreForm from "./ChoreForm";
import { type Chore } from "@/app/actions/chores";

type FilterType = "all" | "my" | "overdue" | "today";

interface Member {
  user_id: string;
  user: { full_name: string | null; email: string };
}

interface ChoreListProps {
  chores: Chore[];
  currentUserId: string;
  isAdmin: boolean;
  members: Member[];
}

export default function ChoreList({ chores, currentUserId, isAdmin, members }: ChoreListProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [editingChore, setEditingChore] = useState<Chore | null>(null);

  // Filter chores
  const filteredChores = chores.filter((chore) => {
    if (!chore.is_active) return false;

    switch (filter) {
      case "my":
        return chore.current_assignee === currentUserId;
      case "overdue": {
        if (!chore.next_due) return false;
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return new Date(chore.next_due) < todayStart;
      }
      case "today": {
        if (!chore.next_due) return false;
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);
        const dueDate = new Date(chore.next_due);
        return dueDate >= todayStart && dueDate < todayEnd;
      }
      default:
        return true;
    }
  });

  // Count stats
  const myChoresCount = chores.filter((c) => c.is_active && c.current_assignee === currentUserId).length;
  const overdueCount = chores.filter((c) => {
    if (!c.is_active || !c.next_due) return false;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return new Date(c.next_due) < todayStart;
  }).length;
  const todayCount = chores.filter((c) => {
    if (!c.is_active || !c.next_due) return false;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const dueDate = new Date(c.next_due);
    return dueDate >= todayStart && dueDate < todayEnd;
  }).length;

  const filters: { key: FilterType; label: string; count?: number; icon: React.ElementType }[] = [
    { key: "all", label: "Tutti", count: chores.filter((c) => c.is_active).length, icon: Calendar },
    { key: "my", label: "I miei", count: myChoresCount, icon: CheckCircle2 },
    { key: "today", label: "Oggi", count: todayCount, icon: Calendar },
    { key: "overdue", label: "In ritardo", count: overdueCount, icon: AlertTriangle },
  ];

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {filters.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.key
                  ? "bg-primary-100 text-primary-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    filter === f.key ? "bg-primary-200" : "bg-gray-200"
                  }`}
                >
                  {f.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Chore list */}
      {filteredChores.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nessun turno trovato</h3>
          <p className="text-gray-500">
            {filter === "all"
              ? "Non ci sono turni attivi. Creane uno nuovo!"
              : "Nessun turno corrisponde al filtro selezionato."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredChores.map((chore) => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onEdit={setEditingChore}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit modal */}
      <ChoreForm
        isOpen={!!editingChore}
        onClose={() => setEditingChore(null)}
        chore={editingChore}
        members={members}
      />
    </>
  );
}
