"use client";

import { motion } from "framer-motion";
import { Trash2, Package, FileText, Wine, Leaf, Cylinder, Box, Check } from "lucide-react";
import { type WasteSchedule } from "@/app/actions/waste";
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

interface WasteCalendarProps {
  schedules: WasteSchedule[];
}

export default function WasteCalendar({ schedules }: WasteCalendarProps) {
  const today = new Date().getDay();

  // Group schedules by day
  const schedulesByDay = DAYS_OF_WEEK.map((day) => ({
    ...day,
    schedules: schedules.filter((s) => s.is_active && s.day_of_week === day.value),
  }));

  // Calculate next collection
  const getNextCollection = () => {
    // Find schedules for today or future
    for (let offset = 0; offset <= 7; offset++) {
      const checkDay = (today + offset) % 7;
      const daySchedules = schedules.filter((s) => s.is_active && s.day_of_week === checkDay);
      if (daySchedules.length > 0) {
        return { offset, schedules: daySchedules };
      }
    }
    return null;
  };

  const nextCollection = getNextCollection();

  return (
    <div className="space-y-6">
      {/* Next collection highlight */}
      {nextCollection && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-4 text-white"
        >
          <p className="text-primary-100 text-sm font-medium mb-1">Prossima raccolta</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">
                {nextCollection.offset === 0
                  ? "Oggi"
                  : nextCollection.offset === 1
                  ? "Domani"
                  : DAYS_OF_WEEK[(today + nextCollection.offset) % 7].label}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {nextCollection.schedules.map((s) => {
                  const type = WASTE_TYPES.find((w) => w.value === s.waste_type);
                  return (
                    <span
                      key={s.id}
                      className="text-sm bg-white/20 px-2 py-0.5 rounded-full"
                    >
                      {type?.label || s.waste_type}
                    </span>
                  );
                })}
              </div>
            </div>
            {nextCollection.offset === 0 && (
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Weekly calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 divide-x divide-gray-100">
          {schedulesByDay.map((day, index) => {
            const isToday = day.value === today;
            const hasSchedules = day.schedules.length > 0;

            return (
              <div
                key={day.value}
                className={`relative ${isToday ? "bg-primary-50" : ""}`}
              >
                {/* Day header */}
                <div
                  className={`px-1 py-2 text-center border-b border-gray-100 ${
                    isToday ? "bg-primary-100" : "bg-gray-50"
                  }`}
                >
                  <p
                    className={`text-xs font-medium ${
                      isToday ? "text-primary-700" : "text-gray-500"
                    }`}
                  >
                    {day.short}
                  </p>
                </div>

                {/* Schedule icons */}
                <div className="p-2 min-h-[80px] flex flex-col items-center gap-1">
                  {hasSchedules ? (
                    day.schedules.map((s) => {
                      const type = WASTE_TYPES.find((w) => w.value === s.waste_type);
                      const Icon = iconMap[type?.icon || "Trash2"] || Trash2;
                      const color = type?.color || "#6b7280";

                      return (
                        <motion.div
                          key={s.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${color}20` }}
                          title={type?.label || s.waste_type}
                        >
                          <Icon className="w-4 h-4" style={{ color }} />
                        </motion.div>
                      );
                    })
                  ) : (
                    <span className="text-gray-300 text-xs mt-4">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
            {WASTE_TYPES.filter((type) =>
              schedules.some((s) => s.waste_type === type.value && s.is_active)
            ).map((type) => {
              const Icon = iconMap[type.icon] || Trash2;
              return (
                <div key={type.value} className="flex items-center gap-1">
                  <Icon className="w-3 h-3" style={{ color: type.color }} />
                  <span className="text-xs text-gray-600">{type.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
