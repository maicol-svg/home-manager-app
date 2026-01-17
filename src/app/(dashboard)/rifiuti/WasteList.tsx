"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import WasteCard from "@/components/rifiuti/WasteCard";
import WasteForm from "@/components/rifiuti/WasteForm";
import { type WasteSchedule } from "@/app/actions/waste";

interface WasteListProps {
  schedules: WasteSchedule[];
  isAdmin: boolean;
}

export default function WasteList({ schedules, isAdmin }: WasteListProps) {
  const [editingSchedule, setEditingSchedule] = useState<WasteSchedule | null>(null);

  // Sort by day of week, starting from Monday
  const sortedSchedules = [...schedules].sort((a, b) => {
    // Convert Sunday (0) to 7 for sorting
    const dayA = a.day_of_week === 0 ? 7 : a.day_of_week;
    const dayB = b.day_of_week === 0 ? 7 : b.day_of_week;
    return dayA - dayB;
  });

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {sortedSchedules.map((schedule) => (
            <WasteCard
              key={schedule.id}
              schedule={schedule}
              isAdmin={isAdmin}
              onEdit={setEditingSchedule}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Edit modal */}
      <WasteForm
        isOpen={!!editingSchedule}
        onClose={() => setEditingSchedule(null)}
        schedule={editingSchedule}
      />
    </>
  );
}
